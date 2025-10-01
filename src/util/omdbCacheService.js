/**
 * OMDb Cache Service
 * Implements caching for OMDb ratings data with Firestore backend
 * Follows the pattern from existing firestoreService.js
 * Uses collection name 'omdb_ratings' with document structure:
 * {imdbRating, rottenTomatoesRating, metacriticRating, awards, cached_at, tmdb_id}
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// Cache statistics key for localStorage
const CACHE_STATS_KEY = 'omdb_cache_stats';

/**
 * Initialize cache statistics in localStorage if they don't exist
 */
function initializeCacheStats() {
  if (!localStorage.getItem(CACHE_STATS_KEY)) {
    localStorage.setItem(CACHE_STATS_KEY, JSON.stringify({
      hits: 0,
      misses: 0,
      totalRequests: 0
    }));
  }
}

/**
 * Get current cache statistics
 * @returns {Object} Cache statistics object
 */
function getCacheStats() {
  initializeCacheStats();
  return JSON.parse(localStorage.getItem(CACHE_STATS_KEY));
}

/**
 * Update cache statistics
 * @param {string} type - Type of statistic to update ('hit', 'miss', or 'request')
 */
function updateCacheStats(type) {
  const stats = getCacheStats();
  
  switch (type) {
    case 'hit':
      stats.hits++;
      break;
    case 'miss':
      stats.misses++;
      break;
    case 'request':
      stats.totalRequests++;
      break;
  }
  
  localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(stats));
}

/**
 * Get cached rating by IMDb ID
 * @param {string} imdbId - The IMDb ID (e.g., 'tt1234567')
 * @returns {Promise<Object|null>} Cached rating data or null if not found
 */
export const getCachedRating = async (imdbId) => {
  updateCacheStats('request');
  
  try {
    // Validate IMDb ID format
    if (!imdbId || !/^tt\d+$/.test(imdbId)) {
      throw new Error(`Invalid IMDb ID format: ${imdbId}`);
    }

    const ratingRef = doc(db, 'omdb_ratings', imdbId);
    const ratingSnap = await getDoc(ratingRef);

    if (ratingSnap.exists()) {
      updateCacheStats('hit');
      return { ...ratingSnap.data(), id: ratingSnap.id };
    } else {
      updateCacheStats('miss');
      return null;
    }
  } catch (error) {
    console.error(`Error getting cached rating for ${imdbId}:`, error);
    
    // Check for offline scenario
    if (error.code === 'unavailable' || error.code === 'failed-precondition') {
      console.warn(`Firestore unavailable, attempting offline cache for ${imdbId}`);
    }
    
    throw error;
  }
};

/**
 * Format OMDb data to match the required document structure
 * @param {Object} omdbData - Raw OMDb data
 * @returns {Object} Formatted data matching the document structure
 */
function formatOmdbData(omdbData) {
  // Extract ratings from the Ratings array in OMDb response
  let imdbRating = null;
  let rottenTomatoesRating = null;
  let metacriticRating = null;
  
  if (omdbData.Ratings && Array.isArray(omdbData.Ratings)) {
    for (const rating of omdbData.Ratings) {
      if (rating.Source === 'Internet Movie Database') {
        imdbRating = rating.Value;
      } else if (rating.Source === 'Rotten Tomatoes') {
        rottenTomatoesRating = rating.Value;
      } else if (rating.Source === 'Metacritic') {
        metacriticRating = rating.Value;
      }
    }
  }
  
  // Use the direct properties if not found in Ratings array
  if (!imdbRating) {
    imdbRating = omdbData.imdbRating || null;
  }
  
  // Sanitize values: convert undefined/null to 'N/A' for specific fields
  const sanitizedImdbRating = imdbRating != null ? imdbRating : 'N/A';
  const sanitizedRottenTomatoesRating = rottenTomatoesRating != null ? rottenTomatoesRating : 'N/A';
  const sanitizedMetacriticRating = metacriticRating != null ? metacriticRating : 'N/A';
  const sanitizedAwards = omdbData.Awards != null && omdbData.Awards !== '' ? omdbData.Awards : 'N/A';
  const sanitizedImdbVotes = omdbData.imdbVotes != null && omdbData.imdbVotes !== '' ? String(omdbData.imdbVotes) : 'N/A';
  const sanitizedPoster = omdbData.Poster != null && omdbData.Poster !== '' ? omdbData.Poster : 'N/A';
  const sanitizedPlot = omdbData.Plot != null && omdbData.Plot !== '' ? omdbData.Plot : 'N/A';
  
  return {
    imdbRating: sanitizedImdbRating,
    rottenTomatoesRating: sanitizedRottenTomatoesRating,
    metacriticRating: sanitizedMetacriticRating,
    awards: sanitizedAwards,
    imdbVotes: sanitizedImdbVotes,
    poster: sanitizedPoster,
    plot: sanitizedPlot,
    cached_at: new Date(), // Using the naming convention from the requirements
    tmdb_id: omdbData.tmdbId || null // TMDB ID if available
  };
}

/**
 * Set cached rating by IMDb ID
 * @param {string} imdbId - The IMDb ID (e.g., 'tt1234567')
 * @param {Object} omdbData - The OMDb data to cache
 * @returns {Promise<void>}
 */
export const setCachedRating = async (imdbId, omdbData) => {
  try {
    // Validate IMDb ID format
    if (!imdbId || !/^tt\d+$/.test(imdbId)) {
      throw new Error(`Invalid IMDb ID format: ${imdbId}`);
    }

    // Format the data according to the required document structure
    const formattedRating = formatOmdbData(omdbData);

    const ratingRef = doc(db, 'omdb_ratings', imdbId);
    
    // Check for any invalid fields that might cause setDoc to fail
    // Firestore doesn't allow undefined values, so validate again
    for (const [key, value] of Object.entries(formattedRating)) {
      if (value === undefined) {
        console.warn(`Skipping cache write for imdbId ${imdbId} due to invalid field ${key}: ${value}`);
        return; // Exit early instead of throwing to allow other operations to continue
      }
    }
    
    try {
      await setDoc(ratingRef, formattedRating);
      console.log(`Successfully cached rating for ${imdbId}`);
    } catch (setDocError) {
      console.warn(`Skipping cache write for imdbId ${imdbId} due to invalid field: ${setDocError.message}`);
    }
  } catch (error) {
    console.error(`Error setting cached rating for ${imdbId}:`, error);
    throw error;
  }
};

/**
 * Get multiple cached ratings by IMDb IDs
 * @param {string[]} imdbIds - Array of IMDb IDs
 * @returns {Promise<Object>} Object with IMDb IDs as keys and rating data as values
 */
export const batchGetRatings = async (imdbIds) => {
  if (!Array.isArray(imdbIds) || imdbIds.length === 0) {
    return {};
  }

  const results = {};

  // Process each ID individually to maintain statistics
  for (const imdbId of imdbIds) {
    updateCacheStats('request');
    
    try {
      const rating = await getCachedRating(imdbId);
      if (rating) {
        results[imdbId] = rating;
      } else {
        updateCacheStats('miss'); // Update miss count specifically in this case
      }
    } catch (error) {
      console.error(`Error getting rating for ${imdbId}:`, error);
      // Continue with other IDs
      updateCacheStats('miss'); // Count as miss if there's an error
    }
  }

  return results;
};

/**
 * Set multiple cached ratings
 * @param {Array} ratingsArray - Array of objects with {imdbId, omdbData}
 * @returns {Promise<void>}
 */
export const batchSetRatings = async (ratingsArray) => {
  if (!Array.isArray(ratingsArray) || ratingsArray.length === 0) {
    return;
  }

  try {
    // Use Firestore batch write for efficiency
    const batch = writeBatch(db);

    for (const { imdbId, omdbData } of ratingsArray) {
      // Validate IMDb ID format
      if (!imdbId || !/^tt\d+$/.test(imdbId)) {
        console.error(`Invalid IMDb ID format: ${imdbId}`);
        continue;
      }

      // Format the data according to the required document structure
      const formattedRating = formatOmdbData(omdbData);

      // Check for any invalid fields that might cause setDoc to fail
      let hasInvalidField = false;
      for (const [key, value] of Object.entries(formattedRating)) {
        if (value === undefined) {
          console.warn(`Skipping cache write for imdbId ${imdbId} due to invalid field ${key}: ${value}`);
          hasInvalidField = true;
          break;
        }
      }
      
      if (hasInvalidField) {
        continue; // Skip this entry and proceed with others
      }

      const ratingRef = doc(db, 'omdb_ratings', imdbId);
      batch.set(ratingRef, formattedRating);
    }

    await batch.commit();
    console.log(`Successfully batch cached ${ratingsArray.length} ratings`);
  } catch (error) {
    console.error('Error in batch cache operation:', error);
    throw error;
  }
};

/**
 * Write-through cache pattern: get from cache, if not found, fetch from external API and cache it
 * @param {string} imdbId - The IMDb ID to get rating for
 * @param {Function} fetchFn - Async function to fetch data if not in cache
 * @returns {Promise<Object>} Rating data either from cache or fetched fresh
 */
export const getRatingWithWriteThrough = async (imdbId, fetchFn) => {
  // Try to get from cache first
  let rating = await getCachedRating(imdbId);
  
  if (!rating) {
    // If not in cache, fetch from external API
    console.log(`Cache miss for ${imdbId}, fetching from external API...`);
    const freshData = await fetchFn(imdbId);
    
    // Cache the fresh data (write-through)
    await setCachedRating(imdbId, freshData);
    rating = { ...freshData, id: imdbId };
  } else {
    console.log(`Cache hit for ${imdbId}`);
  }
  
  return rating;
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics (hits, misses, totalRequests, hitRate)
 */
export const getCacheStatistics = () => {
  const stats = getCacheStats();
  const hitRate = stats.totalRequests > 0 
    ? (stats.hits / stats.totalRequests * 100).toFixed(2) 
    : 0;
    
  return {
    ...stats,
    hitRate: parseFloat(hitRate)
  };
};

/**
 * Clear cache statistics
 */
export const clearCacheStatistics = () => {
  localStorage.setItem(CACHE_STATS_KEY, JSON.stringify({
    hits: 0,
    misses: 0,
    totalRequests: 0
  }));
};