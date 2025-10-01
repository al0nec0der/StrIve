/**
 * Cache Manager
 * Orchestrates IMDb ID resolution + cache lookup + OMDb API calls with fallback mechanisms
 */

import { getImdbId } from './imdbResolver';
import { getCachedRating, setCachedRating, getRatingWithWriteThrough } from './omdbCacheService';
import OmdbService from './omdbService';
import { options } from './constants';

// Performance metrics storage
const performanceMetrics = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  omdbApiCalls: 0,
  tmdbFallbacks: 0,
  errors: 0,
  totalResponseTime: 0
};

// TMDB API base URL
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Get rating with full cache orchestration
 * @param {string} tmdbId - The TMDB ID
 * @param {string} mediaType - The media type ('movie' or 'tv')
 * @param {string} apiKey - The OMDb API key
 * @returns {Promise<Object>} Rating data
 */
export const getRatingWithCache = async (tmdbId, mediaType = 'movie', apiKey) => {
  performanceMetrics.totalRequests++;
  const startTime = Date.now();

  try {
    // Step 1: Attempt to get IMDb ID for the TMDB ID
    const imdbId = await getImdbId(tmdbId, mediaType);
    
    if (!imdbId) {
      console.warn(`No IMDb ID found for TMDB ID ${tmdbId}, falling back to TMDB ratings`);
      performanceMetrics.tmdbFallbacks++;
      return await getFallbackRatingsFromTmdb(tmdbId, mediaType);
    }

    // Step 2: Check Firestore cache for the rating using the IMDb ID
    let ratingData = await getCachedRating(imdbId);
    
    if (ratingData) {
      // Cache hit
      performanceMetrics.cacheHits++;
      console.log(`Cache hit for TMDB ID ${tmdbId}, IMDb ID ${imdbId}`);
      return ratingData;
    } else {
      // Cache miss - need to fetch from OMDb API
      performanceMetrics.cacheMisses++;
      console.log(`Cache miss for TMDB ID ${tmdbId}, fetching from OMDb API...`);
      
      if (!apiKey) {
        throw new Error('OMDb API key is required when cache is missed');
      }

      // Step 3: Fetch from OMDb API
      const omdbService = new OmdbService(apiKey);
      performanceMetrics.omdbApiCalls++;
      
      try {
        ratingData = await omdbService.fetchByImdbId(imdbId);
        
        // Step 4: Write-through caching - store the result in Firestore
        await setCachedRating(imdbId, ratingData);
        console.log(`Successfully fetched and cached rating for TMDB ID ${tmdbId}`);
        
        return ratingData;
      } catch (omdbError) {
        console.warn(`OMDb API failed for IMDb ID ${imdbId}:`, omdbError.message);
        
        // Fallback to TMDB ratings if OMDb fails
        performanceMetrics.tmdbFallbacks++;
        console.log(`Falling back to TMDB ratings for TMDB ID ${tmdbId}`);
        return await getFallbackRatingsFromTmdb(tmdbId, mediaType);
      }
    }
  } catch (error) {
    performanceMetrics.errors++;
    console.error(`Error in rating lookup for TMDB ID ${tmdbId}:`, error);
    
    // Final fallback to TMDB if everything else fails
    performanceMetrics.tmdbFallbacks++;
    return await getFallbackRatingsFromTmdb(tmdbId, mediaType);
  } finally {
    const responseTime = Date.now() - startTime;
    performanceMetrics.totalResponseTime += responseTime;
  }
};

/**
 * Get ratings for multiple TMDB IDs with cache orchestration
 * @param {Array} tmdbIds - Array of TMDB IDs
 * @param {string} mediaType - The media type ('movie' or 'tv')
 * @param {string} apiKey - The OMDb API key
 * @returns {Promise<Object>} Object mapping TMDB IDs to ratings
 */
export const batchGetRatingsWithCache = async (tmdbIds, mediaType = 'movie', apiKey) => {
  if (!Array.isArray(tmdbIds) || tmdbIds.length === 0) {
    return {};
  }

  const results = {};
  const startTime = Date.now();

  // Process each ID individually to maintain proper metrics and error handling
  for (const tmdbId of tmdbIds) {
    try {
      results[tmdbId] = await getRatingWithCache(tmdbId, mediaType, apiKey);
    } catch (error) {
      console.error(`Error getting rating for TMDB ID ${tmdbId}:`, error);
      results[tmdbId] = null; // Ensure we have an entry even for failures
    }
  }

  // Update performance metrics for the batch operation
  const responseTime = Date.now() - startTime;
  performanceMetrics.totalResponseTime += responseTime;

  return results;
};

/**
 * Get fallback ratings from TMDB API
 * @param {string} tmdbId - The TMDB ID
 * @param {string} mediaType - The media type ('movie' or 'tv')
 * @returns {Promise<Object>} Rating data from TMDB
 */
async function getFallbackRatingsFromTmdb(tmdbId, mediaType) {
  try {
    // TMDB doesn't provide detailed ratings like OMDb, but we can get the basic rating
    const endpoint = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}?api_key=${options.headers.Authorization}`;
    const response = await fetch(endpoint, options);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Map TMDB data to our rating schema format
    return {
      id: data.id,
      title: data.title || data.name,
      year: data.release_date ? new Date(data.release_date).getFullYear().toString() : 'N/A',
      imdbRating: data.vote_average ? data.vote_average.toString() : 'N/A',
      imdbVotes: data.vote_count ? data.vote_count.toString() : 'N/A',
      genre: Array.isArray(data.genres) ? data.genres.map(g => g.name) : [],
      plot: data.overview || 'N/A',
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      tmdbId: tmdbId,
      source: 'tmdb',
      // Add other fields with appropriate fallbacks
      rottenTomatoesRating: 'N/A',
      metacriticRating: 'N/A',
      awards: 'N/A',
      cachedAt: new Date() // This is just for schema compatibility
    };
  } catch (error) {
    console.error(`Error in TMDB fallback for ${mediaType} ${tmdbId}:`, error);
    // Return a minimal fallback object if TMDB also fails
    return {
      id: tmdbId,
      title: 'Title Unknown',
      year: 'N/A',
      imdbRating: 'N/A',
      imdbVotes: 'N/A',
      genre: [],
      plot: 'No plot information available',
      poster: null,
      tmdbId: tmdbId,
      source: 'fallback',
      rottenTomatoesRating: 'N/A',
      metacriticRating: 'N/A',
      awards: 'N/A',
      cachedAt: new Date()
    };
  }
}

/**
 * Get performance metrics
 * @returns {Object} Performance metrics
 */
export const getPerformanceMetrics = () => {
  const avgResponseTime = performanceMetrics.totalRequests > 0 
    ? performanceMetrics.totalResponseTime / performanceMetrics.totalRequests 
    : 0;

  return {
    ...performanceMetrics,
    averageResponseTime: avgResponseTime,
    cacheHitRate: performanceMetrics.totalRequests > 0 
      ? (performanceMetrics.cacheHits / performanceMetrics.totalRequests * 100).toFixed(2) + '%' 
      : '0%'
  };
};

/**
 * Reset performance metrics
 */
export const resetPerformanceMetrics = () => {
  Object.keys(performanceMetrics).forEach(key => {
    performanceMetrics[key] = typeof performanceMetrics[key] === 'number' ? 0 : '';
  });
};

/**
 * Get cache statistics from the omdbCacheService
 * @returns {Object} Cache statistics
 */
export const getCacheStatistics = async () => {
  // Import here to avoid circular dependencies
  try {
    const omdbCacheModule = await import('./omdbCacheService');
    return omdbCacheModule.getCacheStatistics ? omdbCacheModule.getCacheStatistics() : 
      { hits: 0, misses: 0, totalRequests: 0, hitRate: 0 };
  } catch (error) {
    console.error('Error getting cache statistics:', error);
    return { hits: 0, misses: 0, totalRequests: 0, hitRate: 0 };
  }
};

/**
 * Clear all caches (both local and Firestore)
 * @returns {Promise<Object>} Results of clearing operations
 */
export const clearAllCaches = async () => {
  // Import here to avoid circular dependencies
  const idCacheModule = await import('./idMappingCache');
  const omdbCacheModule = await import('./omdbCacheService');
  
  const idMappingResults = idCacheModule.clearCache ? idCacheModule.clearCache() : 0;
  const omdbCacheResults = omdbCacheModule.clearAllCache ? await omdbCacheModule.clearAllCache() : 0;
  
  return {
    idMappingCacheCleared: idMappingResults,
    omdbCacheCleared: omdbCacheResults
  };
};

/**
 * Perform cache maintenance (cleanup expired entries, etc.)
 * @returns {Promise<Object>} Results of maintenance operations
 */
export const performCacheMaintenance = async () => {
  // Import here to avoid circular dependencies
  const idCacheModule = await import('./idMappingCache');
  const omdbCacheModule = await import('./omdbCacheService');
  
  const idMappingResults = idCacheModule.cleanup ? idCacheModule.cleanup() : { totalRemoved: 0 };
  const omdbCacheResults = omdbCacheModule.clearExpiredCache ? await omdbCacheModule.clearExpiredCache() : 0;
  
  return {
    idMappingCacheResults: idMappingResults,
    omdbCacheResults: omdbCacheResults
  };
};

// Export a default object with all public methods
export default {
  getRatingWithCache,
  batchGetRatingsWithCache,
  getPerformanceMetrics,
  resetPerformanceMetrics,
  getCacheStatistics,
  clearAllCaches,
  performCacheMaintenance
};