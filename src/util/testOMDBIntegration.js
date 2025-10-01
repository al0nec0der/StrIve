/**
 * Comprehensive Test utility for OMDb Integration
 * This utility tests the complete OMDb integration flow to identify failure points
 */

import { OMDB_API_KEYS, validateOmdbEnvironment, tmdbOptions } from './constants';
import comprehensiveRatingService from './comprehensiveRatingService';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Function to get timestamp for consistent logging
const getTimestamp = () => new Date().toISOString();

// Function to mask API keys for security
const maskApiKey = (key) => key ? key.substring(0, 4) + '...' : 'UNDEFINED';

// Function to test environment variable loading
const testEnvironmentVariables = async () => {
  console.log(`\n[${getTimestamp()}] --- Testing Environment Variables ---`);
  
  // Test each OMDb API key
  for (let i = 1; i <= 4; i++) {
    const key = import.meta.env[`VITE_OMDB_KEY_${i}`];
    const maskedKey = maskApiKey(key);
    console.log(`[${getTimestamp()}] VITE_OMDB_KEY_${i}: ${key ? maskedKey : 'UNDEFINED'}`);
  }
  
  // Test legacy keys
  for (let i = 1; i <= 4; i++) {
    const key = import.meta.env[`VITE_OMDB_API_KEY${i ? i : ''}`];
    const maskedKey = maskApiKey(key);
    const keyName = i === 1 ? 'VITE_OMDB_API_KEY' : `VITE_OMDB_API_KEY${i}`;
    console.log(`[${getTimestamp()}] ${keyName}: ${key ? maskedKey : 'UNDEFINED'}`);
  }
  
  const envValidation = validateOmdbEnvironment();
  console.log(`[${getTimestamp()}] Environment validation:`, envValidation);
  
  return envValidation;
};

// Function to test TMDB external_ids call
const testTmdbExternalIds = async (tmdbId, mediaType) => {
  console.log(`\n[${getTimestamp()}] --- Testing TMDB external_ids API Call ---`);
  
  try {
    const endpoint = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/external_ids`;
    console.log(`[${getTimestamp()}] Calling TMDB external_ids API: ${endpoint}`);
    
    const response = await fetch(endpoint, tmdbOptions);
    console.log(`[${getTimestamp()}] TMDB response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[${getTimestamp()}] TMDB external_ids response:`, data);
    
    const imdbId = data.imdb_id;
    console.log(`[${getTimestamp()}] Extracted IMDb ID: ${imdbId}`);
    
    if (!imdbId) {
      console.error(`[${getTimestamp()}] ERROR: No IMDb ID found for TMDB ID: ${tmdbId}`);
    }
    
    return { imdbId, tmdbResponse: data };
  } catch (error) {
    console.error(`[${getTimestamp()}] Error in TMDB external_ids test:`, error);
    throw error;
  }
};

// Function to test OMDb API call with extracted IMDb ID
const testOmdbApiCall = async (imdbId, apiKey) => {
  console.log(`\n[${getTimestamp()}] --- Testing OMDb API Call ---`);
  
  try {
    const url = `https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`;
    console.log(`[${getTimestamp()}] Calling OMDb API: ${url}`);
    
    const response = await fetch(url);
    console.log(`[${getTimestamp()}] OMDb response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`OMDb API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[${getTimestamp()}] OMDb API response:`, data);
    
    if (data.Response === 'False') {
      console.error(`[${getTimestamp()}] OMDb API returned error:`, data.Error);
      throw new Error(data.Error || 'Unknown error from OMDb API');
    }
    
    console.log(`[${getTimestamp()}] OMDb call successful for IMDb ID: ${imdbId}`);
    return data;
  } catch (error) {
    console.error(`[${getTimestamp()}] Error in OMDb API test:`, error);
    throw error;
  }
};

// Function to test response parsing
const testResponseParsing = (omdbData) => {
  console.log(`\n[${getTimestamp()}] --- Testing Response Parsing ---`);
  
  try {
    // Extract ratings from the ratings array
    const imdbRatingObj = omdbData.Ratings?.find(rating => rating.Source === 'Internet Movie Database');
    const rottenTomatoesObj = omdbData.Ratings?.find(rating => rating.Source === 'Rotten Tomatoes');
    const metacriticObj = omdbData.Ratings?.find(rating => rating.Source === 'Metacritic');
    
    const imdbRating = imdbRatingObj?.Value || omdbData.imdbRating || "N/A";
    const rottenTomatoes = rottenTomatoesObj?.Value || "N/A"; 
    const metacritic = metacriticObj?.Value || "N/A";
    
    console.log(`[${getTimestamp()}] Parsed ratings:`);
    console.log(`[${getTimestamp()}] - IMDb Rating: ${imdbRating}`);
    console.log(`[${getTimestamp()}] - Rotten Tomatoes: ${rottenTomatoes}`);
    console.log(`[${getTimestamp()}] - Metacritic: ${metacritic}`);
    
    // Clean up ratings
    let cleanMetacritic = metacritic;
    if (metacritic !== "N/A" && metacritic.includes('/')) {
      cleanMetacritic = metacritic.split('/')[0];
    }
    
    let cleanImdbRating = imdbRating;
    if (imdbRating !== "N/A" && imdbRating.includes('/')) {
      cleanImdbRating = imdbRating.split('/')[0];
    }
    
    console.log(`[${getTimestamp()}] Cleaned ratings:`);
    console.log(`[${getTimestamp()}] - Clean IMDb Rating: ${cleanImdbRating}`);
    console.log(`[${getTimestamp()}] - Clean Rotten Tomatoes: ${rottenTomatoes}`);
    console.log(`[${getTimestamp()}] - Clean Metacritic: ${cleanMetacritic}`);
    
    const parsedResult = {
      imdbRating: cleanImdbRating,
      rottenTomatoes,
      metacritic: cleanMetacritic,
      imdbVotes: omdbData.imdbVotes || "N/A",
      awards: omdbData.Awards || "N/A",
      plot: omdbData.Plot || "N/A",
      director: omdbData.Director || "N/A",
      actors: omdbData.Actors || "N/A",
      writer: omdbData.Writer || "N/A"
    };
    
    console.log(`[${getTimestamp()}] Final parsed result:`, parsedResult);
    return parsedResult;
  } catch (error) {
    console.error(`[${getTimestamp()}] Error in response parsing test:`, error);
    throw error;
  }
};

// Function to test Firestore caching operation
const testFirestoreCaching = async (tmdbId, ratingData) => {
  console.log(`\n[${getTimestamp()}] --- Testing Firestore Caching ---`);
  
  try {
    const CACHE_COLLECTION = 'comprehensive_ratings';
    
    // Validate and sanitize data before caching
    const sanitizedData = {
      ...ratingData,
      // Handle potentially undefined values
      awards: ratingData.awards || "N/A",
      plot: ratingData.plot || "N/A",
      director: ratingData.director || "N/A",
      actors: ratingData.actors || "N/A",
      writer: ratingData.writer || "N/A",
      imdbRating: ratingData.imdbRating || "N/A",
      imdbVotes: ratingData.imdbVotes || "N/A",
      rottenTomatoesRating: ratingData.rottenTomatoes || "N/A", 
      metacriticRating: ratingData.metacritic || "N/A",
      tmdbRating: ratingData.tmdbRating || "N/A",
      tmdbVoteCount: ratingData.tmdbVoteCount || 0,
      title: ratingData.title || "Unknown Title",
      releaseDate: ratingData.releaseDate || "Unknown Date",
      genres: Array.isArray(ratingData.genres) ? ratingData.genres : [],
      source: ratingData.source || "unknown",
      reliability: ratingData.reliability || { score: 0, freshness: 0 },
      cachedAt: new Date()
    };

    // Remove any undefined values to prevent Firestore errors
    Object.keys(sanitizedData).forEach(key => {
      if (sanitizedData[key] === undefined) {
        sanitizedData[key] = null; // Firestore accepts null values
      }
    });

    console.log(`[${getTimestamp()}] Attempting to cache data for TMDB ID ${tmdbId}`);
    console.log(`[${getTimestamp()}] Data to be cached:`, sanitizedData);
    
    const docRef = doc(db, CACHE_COLLECTION, tmdbId);
    await setDoc(docRef, sanitizedData);
    console.log(`[${getTimestamp()}] Successfully cached rating in Firestore for TMDB ID ${tmdbId}`);
    
    // Verify that the document was created by reading it back
    const cachedDoc = await getDoc(docRef);
    if (cachedDoc.exists()) {
      console.log(`[${getTimestamp()}] Successfully verified cached document for TMDB ID ${tmdbId}`);
      return true;
    } else {
      console.error(`[${getTimestamp()}] ERROR: Document was not created in Firestore for TMDB ID ${tmdbId}`);
      return false;
    }
  } catch (error) {
    console.error(`[${getTimestamp()}] Error in Firestore caching test:`, error);
    throw error;
  }
};

// Comprehensive test function for The Godfather Part II (ID: 240) with IMDb ID (tt0071562)
const testOMDBIntegration = async (tmdbId = '240', mediaType = 'movie', testKeyIndex = 0) => {
  console.log(`\n[${getTimestamp()}] Starting Comprehensive OMDb Integration Test`);
  console.log(`[${getTimestamp()}] Testing with TMDB ID: ${tmdbId}, Media Type: ${mediaType}`);
  
  const startTime = Date.now();
  
  try {
    // Step 1: Test environment variable loading
    const envValidation = await testEnvironmentVariables();
    if (!envValidation.isValid || envValidation.availableKeys === 0) {
      console.warn(`[${getTimestamp()}] Environment validation failed, proceeding with available keys...`);
    }
    
    // Select API key to use for testing
    if (OMDB_API_KEYS.length === 0) {
      throw new Error(`[${getTimestamp()}] No OMDb API keys available for testing`);
    }
    
    const apiKey = OMDB_API_KEYS[testKeyIndex % OMDB_API_KEYS.length];
    const maskedApiKey = maskApiKey(apiKey);
    console.log(`[${getTimestamp()}] Testing with API key: ${maskedApiKey}`);
    
    // Step 2: Test TMDB external_ids call
    const { imdbId } = await testTmdbExternalIds(tmdbId, mediaType);
    if (!imdbId) {
      throw new Error(`[${getTimestamp()}] Failed to get IMDb ID from TMDB`);
    }
    
    // Step 3: Test OMDb API call with extracted IMDb ID
    const omdbData = await testOmdbApiCall(imdbId, apiKey);
    
    // Step 4: Test response parsing
    const parsedData = await testResponseParsing(omdbData);
    
    // Step 5: Test Firestore caching
    await testFirestoreCaching(tmdbId, parsedData);
    
    const duration = Date.now() - startTime;
    console.log(`\n[${getTimestamp()}] Comprehensive test completed successfully in ${duration}ms`);
    console.log(`[${getTimestamp()}] All components are working properly!`);
    
    return {
      success: true,
      duration,
      tmdbId,
      imdbId,
      parsedData
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n[${getTimestamp()}] Comprehensive test failed after ${duration}ms:`, error);
    
    return {
      success: false,
      duration,
      error: error.message,
      tmdbId
    };
  }
};

// Function to test all 4 OMDb API keys
const testAllOmdbKeys = async (tmdbId = '240', mediaType = 'movie') => {
  console.log(`\n[${getTimestamp()}] --- Testing All 4 OMDb API Keys ---`);
  
  const results = [];
  
  for (let i = 0; i < OMDB_API_KEYS.length && i < 4; i++) {
    console.log(`\n[${getTimestamp()}] Testing API Key #${i + 1}: ${maskApiKey(OMDB_API_KEYS[i])}`);
    
    try {
      const result = await testOMDBIntegration(tmdbId, mediaType, i);
      results.push({ keyIndex: i, ...result });
      
      if (result.success) {
        console.log(`[${getTimestamp()}] API Key #${i + 1} - SUCCESS`);
      } else {
        console.error(`[${getTimestamp()}] API Key #${i + 1} - FAILED: ${result.error}`);
      }
    } catch (error) {
      console.error(`[${getTimestamp()}] API Key #${i + 1} - ERROR:`, error.message);
      results.push({ keyIndex: i, success: false, error: error.message });
    }
  }
  
  console.log(`\n[${getTimestamp()}] Key Testing Summary:`);
  results.forEach((result, index) => {
    console.log(`[${getTimestamp()}] Key #${index + 1}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
  });
  
  return results;
};

// Specific test for The Godfather Part II (ID: 240) with IMDb ID (tt0071562)
const testTheGodfatherPartII = async () => {
  console.log(`\n[${getTimestamp()}] Running specific test for The Godfather Part II (TMDB ID: 240)`);
  return await testOMDBIntegration('240', 'movie');
};

// Run the test if called directly
if (typeof window !== 'undefined') {
  console.log(`[${getTimestamp()}] Comprehensive OMDb Integration Test Utility loaded`);
  
  // Export the test functions
  window.testOMDBIntegration = testOMDBIntegration;
  window.testAllOmdbKeys = testAllOmdbKeys;
  window.testTheGodfatherPartII = testTheGodfatherPartII;
  
  console.log(`[${getTimestamp()}] Available test functions: testOMDBIntegration(tmdbId), testAllOmdbKeys(), testTheGodfatherPartII()`);
}

export { testOMDBIntegration, testAllOmdbKeys, testTheGodfatherPartII };