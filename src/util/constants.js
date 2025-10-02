// src/util/constants.js

// TMDB API Configuration
export const tmdbOptions = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_TMDB_KEY}`,
  },
};

// OMDb API Configuration
export const omdbConfig = {
  baseUrl: "https://www.omdbapi.com",
  apiKey: import.meta.env.VITE_OMDB_API_KEY,
  defaultParams: {
    plot: "full",  // Get full plot by default
    type: "movie", // Default to movie type
  }
};

// OMDb API Keys array for rotation
let _omdbApiKeys = [];
try {
  _omdbApiKeys = [
    import.meta.env.VITE_OMDB_KEY_1 || '',     // Primary key as specified in requirements
    import.meta.env.VITE_OMDB_KEY_2 || '',     // Secondary key as specified in requirements
    import.meta.env.VITE_OMDB_KEY_3 || '',     // Third key as specified in requirements
    import.meta.env.VITE_OMDB_KEY_4 || '',     // Fourth key as specified in requirements
    // Fallback to original keys if the required ones aren't defined
    import.meta.env.VITE_OMDB_API_KEY || '',   // Original key as fallback
    import.meta.env.VITE_OMDB_API_KEY2 || '',  // Original key as fallback
    import.meta.env.VITE_OMDB_API_KEY3 || '',  // Original key as fallback
    import.meta.env.VITE_OMDB_API_KEY4 || ''   // Original key as fallback
  ].filter(key => key !== ''); // Remove empty keys
} catch (error) {
  console.warn("Environment variables not available, using empty keys array:", error.message);
  _omdbApiKeys = [];
}

export const OMDB_API_KEYS = _omdbApiKeys;

// OMDb Options object - similar to existing options but for OMDb API
export const omdbOptions = {
  method: "GET",
  // OMDb doesn't require headers like TMDB, so we keep it simple
  // The API key is passed as a query parameter
};

// OMDb base URL and parameter structure
export const OMDB_BASE_URL = "https://www.omdbapi.com";

// OMDb key rotation utility
export const getNextOmdbApiKey = (currentIndex = 0) => {
  if (OMDB_API_KEYS.length === 0) {
    throw new Error("No OMDb API keys available. Please add VITE_OMDB_KEY_1 through VITE_OMDB_KEY_4 to your environment variables.");
  }
  return OMDB_API_KEYS[currentIndex % OMDB_API_KEYS.length];
};

// OMDb URL builder utility
export const buildOmdbUrl = (imdbId, apiKey) => {
  if (!imdbId) {
    throw new Error("IMDb ID is required to build OMDb URL");
  }
  if (!apiKey) {
    throw new Error("OMDb API key is required to build OMDb URL");
  }
  
  return `${OMDB_BASE_URL}?i=${imdbId}&apikey=${apiKey}`;
};

// Environment validation utility for OMDb keys
export const validateOmdbEnvironment = () => {
  const missingKeys = [];
  
  if (!import.meta.env.VITE_OMDB_KEY_1) missingKeys.push('VITE_OMDB_KEY_1');
  if (!import.meta.env.VITE_OMDB_KEY_2) missingKeys.push('VITE_OMDB_KEY_2');
  if (!import.meta.env.VITE_OMDB_KEY_3) missingKeys.push('VITE_OMDB_KEY_3');
  if (!import.meta.env.VITE_OMDB_KEY_4) missingKeys.push('VITE_OMDB_KEY_4');
  
  if (missingKeys.length > 0) {
    // Log a more detailed warning message
    console.warn(`\n⚠️  WARNING: Missing OMDb API keys in environment: ${missingKeys.join(', ')}. Using fallback keys.\n`);
    console.warn(`   Please add these environment variables to your .env file or set them in your system environment.\n`);
    console.warn(`   You can get API keys from: https://www.omdbapi.com/apikey.aspx\n`);
  }
  
  if (OMDB_API_KEYS.length === 0) {
    // Throw a more descriptive error with instructions
    throw new Error(
      '\n❌ CRITICAL ERROR: No OMDb API keys are configured.\n' +
      'Please add at least one of the following environment variables to your .env file:\n' +
      '- VITE_OMDB_KEY_1\n' +
      '- VITE_OMDB_KEY_2\n' +
      '- VITE_OMDB_KEY_3\n' +
      '- VITE_OMDB_KEY_4\n' +
      '- VITE_OMDB_API_KEY\n' +
      '- VITE_OMDB_API_KEY2\n' +
      '- VITE_OMDB_API_KEY3\n' +
      '- VITE_OMDB_API_KEY4\n\n' +
      'You can get free API keys from: https://www.omdbapi.com/apikey.aspx\n' +
      'After adding the keys, restart your development server.\n'
    );
  }
  
  return { isValid: missingKeys.length < 4, missingKeys, availableKeys: OMDB_API_KEYS.length };
};

// Combined options object (keeping existing for backward compatibility)
export const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_TMDB_KEY}`,
  },
};

export const IMG_CDN_URL = "https://image.tmdb.org/t/p/w500";
