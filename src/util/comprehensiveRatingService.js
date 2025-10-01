/**
 * Comprehensive Rating Service
 * Fetches ratings from multiple sources: TMDB, OMDb, and cached data
 */

import { getDoc, setDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { tmdbOptions, OMDB_API_KEYS } from './constants';
import OmdbService from './omdbService';

// Function to get timestamp for consistent logging
const getTimestamp = () => new Date().toISOString();

// Constants
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const CACHE_COLLECTION = 'comprehensive_ratings';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Source reliability indicators
const SOURCE_RELIABILITY = {
  tmdb: { score: 8, freshness: 10 },      // TMDB is usually available and reliable
  omdb: { score: 9, freshness: 10 },      // OMDb is very reliable for ratings
  cache: { score: 6, freshness: 5 },      // Cache is reliable but may be stale
  fallback: { score: 4, freshness: 2 }    // Fallback is less reliable
};

/**
 * Fetch TMDB data for a movie or TV show
 * @param {string} tmdbId - The TMDB ID
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Promise<Object>} TMDB data
 */
const fetchTmdbData = async (tmdbId, mediaType) => {
  try {
    console.log(`[${getTimestamp()}] fetchTmdbData: Starting fetch for ${mediaType} ID: ${tmdbId}`);
    
    // First, get the main movie/TV data
    const endpoint = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}`;
    console.log(`[${getTimestamp()}] fetchTmdbData: Fetching from endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint, tmdbOptions);
    
    console.log(`[${getTimestamp()}] fetchTmdbData: TMDB API response status: ${response.status}`);
    if (!response.ok) {
      console.error(`[${getTimestamp()}] fetchTmdbData: TMDB API error: ${response.status}`);
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[${getTimestamp()}] fetchTmdbData: TMDB API response received:`, {
      id: data.id,
      title: data.title || data.name,
      vote_average: data.vote_average,
      vote_count: data.vote_count
    });
    
    // Also try to get alternative ratings data where available
    let ratingsData = {};
    try {
      const alternativeEndpoint = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}/release_dates`;
      const ratingsResponse = await fetch(alternativeEndpoint, tmdbOptions);
      if (ratingsResponse.ok) {
        const ratingsDataRaw = await ratingsResponse.json();
        // Process ratings data if available
        ratingsData = {
          release_dates: ratingsDataRaw
        };
      }
    } catch (ratingsError) {
      console.log(`[${getTimestamp()}] fetchTmdbData: Could not fetch additional ratings data for ${tmdbId}:`, ratingsError.message);
      // This is okay, we can continue with basic data
    }
    
    const result = {
      id: data.id,
      title: data.title || data.name,
      vote_average: data.vote_average,
      vote_count: data.vote_count,
      release_date: data.release_date || data.first_air_date,
      genres: data.genres?.map(g => g.name) || [],
      ...ratingsData // Include any additional ratings data we got
    };
    
    console.log(`[${getTimestamp()}] fetchTmdbData: Returning formatted TMDB data:`, result);
    return result;
  } catch (error) {
    console.error(`[${getTimestamp()}] fetchTmdbData: Error fetching TMDB data for ${mediaType} ${tmdbId}:`, error);
    throw error;
  }
};

/**
 * Resolve IMDb ID from TMDB external_ids
 * @param {string} tmdbId - The TMDB ID
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Promise<string>} IMDb ID
 */
const resolveImdbId = async (tmdbId, mediaType) => {
  try {
    console.log(`[${getTimestamp()}] resolveImdbId: Starting to resolve IMDb ID for ${mediaType} ID: ${tmdbId}`);
    const endpoint = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}/external_ids`;
    console.log(`[${getTimestamp()}] resolveImdbId: Fetching from endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint, tmdbOptions);
    console.log(`[${getTimestamp()}] resolveImdbId: TMDB external_ids API response status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`[${getTimestamp()}] resolveImdbId: TMDB external_ids API error: ${response.status}`);
      throw new Error(`TMDB external_ids API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[${getTimestamp()}] resolveImdbId: TMDB external_ids response:`, data);
    
    const imdbId = data.imdb_id;
    console.log(`[${getTimestamp()}] resolveImdbId: Extracted IMDb ID: ${imdbId}`);
    
    if (!imdbId) {
      console.warn(`[${getTimestamp()}] resolveImdbId: No IMDb ID found for TMDB ID: ${tmdbId}`);
    }
    
    return imdbId;
  } catch (error) {
    console.error(`[${getTimestamp()}] resolveImdbId: Error resolving IMDb ID for ${mediaType} ${tmdbId}:`, error);
    throw error;
  }
};

/**
 * Fetch OMDb data using IMDb ID with key rotation and retry logic
 * @param {string} imdbId - The IMDb ID
 * @param {string} primaryApiKey - Primary OMDb API key
 * @returns {Promise<Object>} OMDb data
 */
const fetchOmdbData = async (imdbId, primaryApiKey) => {
  console.log(`[${getTimestamp()}] fetchOmdbData: Starting fetch for IMDb ID: ${imdbId}`);
  console.log(`[${getTimestamp()}] fetchOmdbData: Primary API key provided: ${!!primaryApiKey}`);
  
  // If a primary key is provided, try it first, then rotate through all available keys
  const keysToTry = primaryApiKey ? [primaryApiKey, ...OMDB_API_KEYS.filter(key => key !== primaryApiKey)] : OMDB_API_KEYS;
  
  console.log(`[${getTimestamp()}] fetchOmdbData: Attempting key rotation with ${keysToTry.length} keys:`, 
    keysToTry.map(key => key ? key.substring(0, 3) + '...' : 'UNDEFINED'));
  console.log(`[${getTimestamp()}] fetchOmdbData: All available API keys:`, OMDB_API_KEYS);
  
  let lastError;
  
  for (let i = 0; i < keysToTry.length; i++) {
    const apiKey = keysToTry[i];
    const maskedKey = apiKey ? apiKey.substring(0, 3) + '...' : 'UNDEFINED';
    
    console.log(`[${getTimestamp()}] fetchOmdbData: Attempt #${i+1} with API key: ${maskedKey}, key value: ${apiKey ? 'present' : 'undefined'}`);
    
    if (!apiKey) {
      console.warn(`[${getTimestamp()}] fetchOmdbData: Skipping undefined API key at position ${i}`);
      continue; // Skip undefined or null keys
    }
    
    try {
      console.log(`[${getTimestamp()}] fetchOmdbData: Creating OmdbService instance with key: ${maskedKey}`);
      
      const service = new OmdbService(apiKey);
      console.log(`[${getTimestamp()}] fetchOmdbData: OmdbService instance created successfully with key: ${maskedKey}`);
      
      console.log(`[${getTimestamp()}] fetchOmdbData: Calling service.fetchByImdbId for ${imdbId}...`);
      const data = await service.fetchByImdbId(imdbId);
      console.log(`[${getTimestamp()}] fetchOmdbData: Received raw OMDb API response:`, JSON.stringify(data, null, 2));
      
      // Extract Rotten Tomatoes and Metacritic from Ratings array with proper checks
      console.log(`[${getTimestamp()}] fetchOmdbData: Processing ratings from response...`);
      const rt = data.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value ?? 'N/A';
      const mcRaw = data.Ratings?.find(r => r.Source === 'Metacritic')?.Value ?? 'N/A';
      
      console.log(`[${getTimestamp()}] fetchOmdbData: Raw ratings values - RT: ${rt}, MC: ${mcRaw}`);
      
      const mc = typeof mcRaw === 'string' ? mcRaw.split('/') : 'N/A';
      
      // Extract the values, defaulting to "N/A" if not found
      const imdbRating = typeof data.imdbRating === 'string' ? data.imdbRating : (data.imdbRating?.toString?.() ?? 'N/A');
      const rottenTomatoes = rt; 
      const metacritic = Array.isArray(mc) ? mc[0] : mcRaw; // Get just the first part if it's an array
      
      console.log(`[${getTimestamp()}] fetchOmdbData: Extracted ratings before cleaning:`);
      console.log(`[${getTimestamp()}] fetchOmdbData: - IMDb Rating: ${imdbRating}`);
      console.log(`[${getTimestamp()}] fetchOmdbData: - Rotten Tomatoes: ${rottenTomatoes}`);
      console.log(`[${getTimestamp()}] fetchOmdbData: - Metacritic: ${metacritic}`);
      
      // Clean up metacritic rating to just the number (e.g., "82/100" -> "82")
      let cleanMetacritic = metacritic;
      if (typeof metacritic === 'string' && metacritic !== "N/A") {
        const metacriticParts = metacritic.split('/');
        cleanMetacritic = metacriticParts[0];
      }
      
      // Clean up imdb rating to just the number (e.g., "8.6/10" -> "8.6")
      let cleanImdbRating = imdbRating;
      if (typeof imdbRating === 'string' && imdbRating !== "N/A") {
        const imdbRatingParts = imdbRating.split('/');
        cleanImdbRating = imdbRatingParts[0];
      }
      
      console.log(`[${getTimestamp()}] fetchOmdbData: Cleaned ratings:`);
      console.log(`[${getTimestamp()}] fetchOmdbData: - Clean IMDb Rating: ${cleanImdbRating}`);
      console.log(`[${getTimestamp()}] fetchOmdbData: - Clean Rotten Tomatoes: ${rottenTomatoes}`);
      console.log(`[${getTimestamp()}] fetchOmdbData: - Clean Metacritic: ${cleanMetacritic}`);
      
      const result = {
        imdbRating: typeof cleanImdbRating !== 'undefined' ? cleanImdbRating : 'N/A',
        rottenTomatoes: typeof rottenTomatoes !== 'undefined' ? rottenTomatoes : 'N/A', 
        metacritic: typeof cleanMetacritic !== 'undefined' ? cleanMetacritic : 'N/A',
        imdbVotes: typeof data.imdbVotes === 'string' || typeof data.imdbVotes === 'number' ? String(data.imdbVotes) : 'N/A',
        awards: typeof data.Awards === 'string' ? data.Awards : 'N/A',
        plot: typeof data.Plot === 'string' ? data.Plot : 'N/A',
        director: typeof data.Director === 'string' ? data.Director : 'N/A',
        actors: typeof data.Actors === 'string' ? data.Actors : 'N/A',
        writer: typeof data.Writer === 'string' ? data.Writer : 'N/A'
      };
      
      console.log(`[${getTimestamp()}] fetchOmdbData: Returning formatted OMDb data:`, result);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`[${getTimestamp()}] fetchOmdbData: API key ${maskedKey} failed for ${imdbId}:`, error.message);
      console.error(`[${getTimestamp()}] fetchOmdbData: Error details:`, error);
      
      // If this is the last key, throw the error
      if (i === keysToTry.length - 1) {
        console.error(`[${getTimestamp()}] fetchOmdbData: All ${keysToTry.length} API keys failed for ${imdbId}`);
        console.error(`[${getTimestamp()}] fetchOmdbData: Final error after all attempts:`, lastError);
        throw error;
      } else {
        console.log(`[${getTimestamp()}] fetchOmdbData: Trying next key...`);
      }
    }
  }
  
  // If all keys failed, throw the last error
  console.error(`[${getTimestamp()}] fetchOmdbData: All keys failed, throwing last error:`, lastError);
  throw lastError;
};

/**
 * Get cached rating data from Firestore
 * @param {string} tmdbId - The TMDB ID
 * @returns {Promise<Object|null>} Cached data or null
 */
const getCachedRating = async (tmdbId) => {
  try {
    const docRef = doc(db, CACHE_COLLECTION, tmdbId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const now = Date.now();
      
      // Check if cache is still valid (less than 24 hours old)
      if (now - data.cachedAt.toMillis() < CACHE_DURATION) {
        return data;
      } else {
        console.log(`Cache expired for TMDB ID ${tmdbId}`);
        // TODO: Consider removing expired cache entry
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting cached rating for TMDB ID ${tmdbId}:`, error);
    return null;
  }
};

/**
 * Cache rating data to Firestore
 * @param {string} tmdbId - The TMDB ID
 * @param {Object} ratingData - The rating data to cache
 */
const cacheRating = async (tmdbId, ratingData) => {
  try {
    // Validate and sanitize data before caching to avoid Firestore errors
    const sanitizedData = {
      ...ratingData,
      // Handle potentially undefined values with type safety
      awards: typeof ratingData.awards === 'string' ? ratingData.awards : "N/A",
      plot: typeof ratingData.plot === 'string' ? ratingData.plot : "N/A",
      director: typeof ratingData.director === 'string' ? ratingData.director : "N/A",
      actors: typeof ratingData.actors === 'string' ? ratingData.actors : "N/A",
      writer: typeof ratingData.writer === 'string' ? ratingData.writer : "N/A",
      imdbRating: typeof ratingData.imdbRating === 'string' ? ratingData.imdbRating : 
                  (ratingData.imdbRating?.toString?.() ?? "N/A"),
      imdbVotes: typeof ratingData.imdbVotes === 'string' || typeof ratingData.imdbVotes === 'number' ? 
                 String(ratingData.imdbVotes) : "N/A",
      rottenTomatoesRating: typeof ratingData.rottenTomatoesRating === 'string' ? ratingData.rottenTomatoesRating : "N/A", 
      metacriticRating: typeof ratingData.metacriticRating === 'string' ? ratingData.metacriticRating : "N/A",
      tmdbRating: typeof ratingData.tmdbRating === 'string' || typeof ratingData.tmdbRating === 'number' ? 
                  String(ratingData.tmdbRating) : "N/A",
      tmdbVoteCount: typeof ratingData.tmdbVoteCount === 'number' ? ratingData.tmdbVoteCount : 0,
      title: typeof ratingData.title === 'string' ? ratingData.title : "Unknown Title",
      releaseDate: typeof ratingData.releaseDate === 'string' ? ratingData.releaseDate : "Unknown Date",
      genres: Array.isArray(ratingData.genres) ? ratingData.genres : [],
      source: typeof ratingData.source === 'string' ? ratingData.source : "unknown",
      reliability: ratingData.reliability || { score: 0, freshness: 0 },
      cachedAt: new Date()
    };

    // Remove any undefined values to prevent Firestore errors
    Object.keys(sanitizedData).forEach(key => {
      if (sanitizedData[key] === undefined) {
        sanitizedData[key] = null; // Firestore accepts null values
      }
    });

    console.log(`[${getTimestamp()}] cacheRating: Attempting to cache data for TMDB ID ${tmdbId}`);
    const docRef = doc(db, CACHE_COLLECTION, tmdbId);
    await setDoc(docRef, sanitizedData);
    console.log(`[${getTimestamp()}] cacheRating: Successfully cached rating for TMDB ID ${tmdbId}`);
  } catch (error) {
    console.error(`[${getTimestamp()}] cacheRating: Error caching rating for TMDB ID ${tmdbId}:`, error);
    console.error(`[${getTimestamp()}] cacheRating: Error details - code: ${error.code}, message: ${error.message}`);
  }
};

/**
 * Normalize rating values for consistency
 * @param {any} value - The rating value to normalize
 * @param {string} type - The type of rating (imdb, rt, mc, etc.)
 * @returns {string} Normalized rating
 */
const normalizeRating = (value, type) => {
  if (typeof value === 'undefined' || value === null || value === 'N/A' || value === 'N/a' || value === '') {
    return 'N/A';
  }
  
  // Remove any HTML tags or extra formatting
  value = String(value).trim();
  
  // Special handling for different rating types
  switch (type) {
    case 'imdb':
      // Ensure format is like "8.1/10" or "N/A"
      if (/^\d+(\.\d+)?\/\d+$/.test(value)) {
        return value;
      } else if (/^\d+(\.\d+)?$/.test(value)) {
        return `${value}/10`;
      }
      return value;
    case 'rt':
      // Ensure format is like "85%" or "N/A"
      if (typeof value === 'string' && value.includes('%')) {
        return value;
      } else if (/^\d+$/.test(value)) {
        return `${value}%`;
      }
      return value;
    case 'mc':
      // Ensure format is like "72/100" or "N/A"
      if (/^\d+\/\d+$/.test(value)) {
        return value;
      } else if (/^\d+$/.test(value)) {
        return `${value}/100`;
      }
      return value;
    default:
      return value;
  }
};

/**
 * Fetch comprehensive ratings from all available sources
 * @param {string} tmdbId - The TMDB ID
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {string} omdbApiKey - OMDb API key
 * @param {boolean} forceRefresh - Whether to bypass cache
 * @returns {Promise<Object>} Unified rating object with all sources
 */
const fetchComprehensiveRatings = async (tmdbId, mediaType = 'movie', omdbApiKey, forceRefresh = false) => {
  console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Starting comprehensive rating fetch for ${mediaType} ${tmdbId}, forceRefresh: ${forceRefresh}`);
  
  try {
    // Return early if no TMDB ID provided
    if (!tmdbId) {
      console.error(`[${getTimestamp()}] fetchComprehensiveRatings: Error - TMDB ID is required`);
      throw new Error('TMDB ID is required');
    }

    // Step 1: Check cache first (unless force refresh is requested)
    console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Step 1 - Checking cache for TMDB ID ${tmdbId}`);
    if (!forceRefresh) {
      const cachedData = await getCachedRating(tmdbId);
      if (cachedData) {
        console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Cache hit for TMDB ID ${tmdbId}, returning cached data`);
        return {
          ...cachedData,
          source: 'cache',
          reliability: SOURCE_RELIABILITY.cache
        };
      }
      console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Cache miss for TMDB ID ${tmdbId}`);
    }

    // Step 2: Fetch TMDB data (always available and free)
    console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Step 2 - Fetching TMDB data for ${mediaType} ${tmdbId}`);
    const tmdbData = await fetchTmdbData(tmdbId, mediaType);
    console.log(`[${getTimestamp()}] fetchComprehensiveRatings: TMDB data received:`, tmdbData);

    // Initialize the result object with TMDB data
    let result = {
      tmdbId,
      mediaType,
      tmdbRating: normalizeRating(tmdbData.vote_average?.toFixed(1), 'tmdb'),
      tmdbVoteCount: tmdbData.vote_count,
      title: tmdbData.title,
      releaseDate: tmdbData.release_date,
      genres: tmdbData.genres,
      source: 'tmdb',
      reliability: SOURCE_RELIABILITY.tmdb
    };
    console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Initialized result with TMDB data:`, result);

    // Step 3: Resolve IMDb ID from TMDB
    console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Step 3 - Resolving IMDb ID for TMDB ID ${tmdbId}`);
    const imdbId = await resolveImdbId(tmdbId, mediaType);
    console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Resolved IMDb ID: ${imdbId}`);

    // Try to get IMDB rating from TMDB's release dates information
    let imdbRatingFromTMDB = 'N/A';
    if (tmdbData.release_dates && tmdbData.release_dates.results) {
      const usRelease = tmdbData.release_dates.results.find(release => 
        release.iso_3166_1 === 'US'
      );
      
      if (usRelease && usRelease.release_dates && usRelease.release_dates.length > 0) {
        imdbRatingFromTMDB = usRelease.release_dates[0].certification || 'N/A';
      }
    }

    if (imdbId) {
      console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Step 4 - IMDb ID found, attempting OMDb API call`);
      // Use the provided API key or the first available key from constants
      const effectiveApiKey = omdbApiKey || (OMDB_API_KEYS.length > 0 ? OMDB_API_KEYS[0] : null);
      
      if (effectiveApiKey || OMDB_API_KEYS.length > 0) {
        console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Attempting OMDb fetch for IMDb ID ${imdbId} with effective API key: ${effectiveApiKey?.substring(0, 3) || 'first available key'}`);
        try {
          // If no primary key was provided, use the first available key
          const primaryApiKey = effectiveApiKey || OMDB_API_KEYS[0];
          const omdbData = await fetchOmdbData(imdbId, primaryApiKey);
          console.log(`[${getTimestamp()}] fetchComprehensiveRatings: OMDb data received:`, omdbData);
          
          // Merge OMDb data with TMDB data
          result = {
            ...result,
            ...omdbData,
            imdbId,
            // Normalize ratings with type safety
            imdbRating: normalizeRating(
              typeof omdbData.imdbRating === 'string' ? omdbData.imdbRating : 
              (omdbData.imdbRating?.toString?.() ?? 'N/A'), 
              'imdb'
            ),
            rottenTomatoesRating: normalizeRating(
              typeof omdbData.rottenTomatoes === 'string' ? omdbData.rottenTomatoes : 'N/A', 
              'rt'
            ),
            metacriticRating: normalizeRating(
              typeof omdbData.metacritic === 'string' ? omdbData.metacritic : 'N/A', 
              'mc'
            ),
            source: 'omdb',
            reliability: SOURCE_RELIABILITY.omdb
          };
          console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Successfully merged OMDb data, result:`, result);
        } catch (omdbError) {
          console.warn(`[${getTimestamp()}] fetchComprehensiveRatings: OMDb API failed for IMDb ID ${imdbId}, trying alternative rating sources:`, omdbError.message);
          
          // Try to get ratings from alternative sources
          try {
            // Try alternative API - using the RapidAPI alternative that provides similar data
            const alternativeRatingData = await fetchAlternativeRatingData(imdbId);
            if (alternativeRatingData && (alternativeRatingData.imdbRating !== 'N/A' || alternativeRatingData.ratings)) {
              console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Got rating data from alternative source:`, alternativeRatingData);
              
              // Extract ratings from alternative source
              const imdbRating = alternativeRatingData.imdbRating || 
                                (alternativeRatingData.ratings?.find(r => r.Source === 'Internet Movie Database')?.Value) || 'N/A';
              
              result = {
                ...result,
                ...alternativeRatingData,
                imdbRating: normalizeRating(imdbRating, 'imdb'),
                imdbId,
                source: 'alternative',
                reliability: { score: 7, freshness: 8 } // Rating from alternative source
              };
            } else {
              // If alternative source also fails, try to extract IMDB rating from TMDB data as a final fallback
              if (imdbRatingFromTMDB && imdbRatingFromTMDB !== 'N/A') {
                console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Using IMDB rating from TMDB data as fallback: ${imdbRatingFromTMDB}`);
                result = {
                  ...result,
                  imdbRating: normalizeRating(imdbRatingFromTMDB, 'imdb'),
                  imdbId,
                  source: 'tmdb_fallback',
                  reliability: SOURCE_RELIABILITY.fallback
                };
              } else {
                // Keep the TMDB data but mark as fallback
                result = {
                  ...result,
                  source: 'fallback',
                  reliability: SOURCE_RELIABILITY.fallback
                };
              }
            }
          } catch (altError) {
            console.warn(`[${getTimestamp()}] fetchComprehensiveRatings: Alternative rating source also failed:`, altError.message);
            
            // Try to extract IMDB rating from TMDB data as a final fallback
            if (imdbRatingFromTMDB && imdbRatingFromTMDB !== 'N/A') {
              console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Using IMDB rating from TMDB data as fallback: ${imdbRatingFromTMDB}`);
              result = {
                ...result,
                imdbRating: normalizeRating(imdbRatingFromTMDB, 'imdb'),
                imdbId,
                source: 'tmdb_fallback',
                reliability: SOURCE_RELIABILITY.fallback
              };
            } else {
              // Keep the TMDB data but mark as fallback
              result = {
                ...result,
                source: 'fallback',
                reliability: SOURCE_RELIABILITY.fallback
              };
            }
          }
        }
      } else {
        console.warn(`[${getTimestamp()}] fetchComprehensiveRatings: No OMDb API keys available, trying to use TMDB data with IMDB ID`);
        // If no OMDb keys are available but we have an IMDB ID, try to enhance with any additional TMDB data
        if (imdbRatingFromTMDB && imdbRatingFromTMDB !== 'N/A') {
          console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Using IMDB rating from TMDB data as fallback: ${imdbRatingFromTMDB}`);
          result = {
            ...result,
            imdbRating: normalizeRating(imdbRatingFromTMDB, 'imdb'),
            imdbId,
            source: 'tmdb_fallback',
            reliability: SOURCE_RELIABILITY.fallback
          };
        } else {
          result = {
            ...result,
            imdbId,
            source: 'fallback',
            reliability: SOURCE_RELIABILITY.fallback
          };
        }
      }
    } else {
      console.warn(`[${getTimestamp()}] fetchComprehensiveRatings: No IMDb ID found for TMDB ID ${tmdbId}, using TMDB data only`);
      result = {
        ...result,
        source: 'fallback',
        reliability: SOURCE_RELIABILITY.fallback
      };
    }

    // Step 5: Cache the result (only if it includes OMDb data or if we want to cache TMDB-only data)
    console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Step 5 - Caching result for TMDB ID ${tmdbId}, source: ${result.source}`);
    if (result.source !== 'cache') {
      console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Caching data for TMDB ID ${tmdbId}`);
      await cacheRating(tmdbId, result);
    }

    // Return the unified rating object
    console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Returning final result:`, result);
    return result;
  } catch (error) {
    console.error(`[${getTimestamp()}] fetchComprehensiveRatings: Error in comprehensive rating fetch for ${mediaType} ${tmdbId}:`, error);
    
    // Return a fallback object with basic information
    const fallbackResult = {
      tmdbId,
      mediaType,
      title: 'Unknown Title',
      source: 'error',
      reliability: SOURCE_RELIABILITY.fallback,
      error: error.message,
      // Set all rating fields to 'N/A' as fallback
      tmdbRating: 'N/A',
      imdbRating: 'N/A',
      rottenTomatoesRating: 'N/A',
      metacriticRating: 'N/A',
      tmdbVoteCount: 0,
      imdbVotes: 'N/A'
    };
    
    console.log(`[${getTimestamp()}] fetchComprehensiveRatings: Returning fallback result:`, fallbackResult);
    return fallbackResult;
  }
};

/**
 * Extract IMDB rating from TMDB data if available
 * @param {Object} tmdbData - TMDB data object
 * @returns {string} IMDB rating or 'N/A'
 */
const extractImdbRatingFromTMDB = (tmdbData) => {
  // TMDB doesn't typically provide IMDB ratings directly, but if we have release dates info
  // we might be able to extract rating information
  
  if (!tmdbData.release_dates || !tmdbData.release_dates.results) {
    return 'N/A';
  }
  
  // Look for US ratings in release dates
  const usRelease = tmdbData.release_dates.results.find(release => 
    release.iso_3166_1 === 'US'
  );
  
  if (usRelease && usRelease.release_dates && usRelease.release_dates.length > 0) {
    const rating = usRelease.release_dates[0].certification;
    if (rating) {
      return rating; // This might be an MPAA rating, not IMDB score
    }
  }
  
  // For now, we'll return 'N/A' since TMDB doesn't typically provide IMDB scores
  // This function can be extended later if we find a reliable source for IMDB ratings within TMDB
  return 'N/A';
};

/**
 * Fetch rating data from alternative API sources
 * @param {string} imdbId - The IMDb ID to fetch ratings for
 * @returns {Promise<Object>} Alternative rating data or null if unavailable
 */
const fetchAlternativeRatingData = async (imdbId) => {
  // Using APIs that may still be functioning as alternatives to OMDb
  // First try, a different API that might have IMDB ratings
  const altApiUrl = `https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`;
  
  try {
    console.log(`[${getTimestamp()}] fetchAlternativeRatingData: Attempting to fetch from TVMaze for IMDb ID: ${imdbId}`);
    const response = await fetch(altApiUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.rating && data.rating.average) {
        console.log(`[${getTimestamp()}] fetchAlternativeRatingData: Found rating from TVMaze: ${data.rating.average}/10`);
        return {
          imdbRating: `${data.rating.average}/10`,
          plot: data.summary || 'N/A',
          genres: data.genres || [],
          runtime: data.runtime || 'N/A'
        };
      }
    }
  } catch (error) {
    console.log(`[${getTimestamp()}] fetchAlternativeRatingData: TVMaze request failed:`, error.message);
  }
  
  // If TVMaze doesn't have the data, try other methods
  // For now, we'll return null to indicate no alternative source worked
  return null;
};

/**
 * Get reliability score for a source
 * @param {string} source - Source name (tmdb, omdb, cache, fallback, error)
 * @returns {number} Reliability score
 */
const getReliabilityScore = (source) => {
  return SOURCE_RELIABILITY[source]?.score || 1;
};

/**
 * Refresh cache for a specific TMDB ID
 * @param {string} tmdbId - The TMDB ID to refresh
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {string} omdbApiKey - OMDb API key
 * @returns {Promise<Object>} Fresh rating data
 */
const refreshCache = async (tmdbId, mediaType, omdbApiKey) => {
  return await fetchComprehensiveRatings(tmdbId, mediaType, omdbApiKey, true);
};

// Export the service functions
export default {
  fetchComprehensiveRatings,
  getReliabilityScore,
  refreshCache
};