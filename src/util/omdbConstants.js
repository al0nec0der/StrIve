/**
 * OMDb API Constants for Client Side
 * Contains all necessary constants for OMDb API integration
 */

// Base URL for OMDb API
export const OMDB_BASE_URL = 'https://www.omdbapi.com';

// API Endpoints
export const OMDB_ENDPOINTS = {
  SEARCH: '/?s=',      // Search for movies by title
  GET_BY_ID: '/?i=',   // Get movie details by IMDb ID
  GET_BY_TITLE: '/?t=', // Get movie details by title
  GET_BY_IMDB_ID: '/?i=', // Get by IMDb ID (alternative to GET_BY_ID)
};

// Rate limits (as per OMDb API documentation)
export const OMDB_RATE_LIMITS = {
  REQUESTS_PER_DAY: 1000, // 1000 requests per day per API key
  REQUESTS_PER_HOUR: 10, // Approximate per hour (1000/24 ≈ 41, but they may have hourly limits too)
  RECOMMENDED_DAILY_USAGE: 800, // 80% of limit to stay safe
};

// Request parameters
export const OMDB_PARAMS = {
  API_KEY: 'apikey',  // API key parameter name
  SEARCH_TERM: 's',   // Search term parameter name
  IMDB_ID: 'i',       // IMDb ID parameter name
  TITLE: 't',         // Title parameter name
  YEAR: 'y',          // Year parameter name
  PLOT: 'plot',       // Plot type parameter (short, full)
  TYPE: 'type',       // Media type (movie, series, episode)
  PAGE: 'page',       // Page number for search results
};

// HTTP timeout settings (in milliseconds)
export const OMDB_HTTP_TIMEOUT = {
  REQUEST_TIMEOUT: 10000, // 10 seconds for each request
  CONNECTION_TIMEOUT: 5000, // 5 seconds for connection
  RESPONSE_TIMEOUT: 10000, // 10 seconds for response
};

// Plot length options
export const OMDB_PLOT_LENGTH = {
  SHORT: 'short',
  FULL: 'full',
};

// Media type options
export const OMDB_MEDIA_TYPE = {
  MOVIE: 'movie',
  SERIES: 'series',
  EPISODE: 'episode',
};

// Response type options
export const OMDB_RESPONSE_TYPE = {
  JSON: 'json',
  XML: 'xml',
};

// Configuration object combining all constants for easy import
export const OMDB_CONFIG = {
  BASE_URL: OMDB_BASE_URL,
  ENDPOINTS: OMDB_ENDPOINTS,
  RATE_LIMITS: OMDB_RATE_LIMITS,
  PARAMS: OMDB_PARAMS,
  HTTP_TIMEOUT: OMDB_HTTP_TIMEOUT,
  PLOT_LENGTH: OMDB_PLOT_LENGTH,
  MEDIA_TYPE: OMDB_MEDIA_TYPE,
  RESPONSE_TYPE: OMDB_RESPONSE_TYPE,
};