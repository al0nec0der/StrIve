/**
 * OMDb Service
 * Provides methods to fetch data from OMDb API with error handling, retry logic, and data normalization
 */

// Import the constants if needed
import { OMDB_CONFIG } from './omdbConstants';
import { options } from './constants'; // Your existing constants
import dynamicOMDbManager from './dynamicOMDbManager'; // Import the dynamic key manager

// For timeout handling
const DEFAULT_TIMEOUT = 10000; // 10 seconds

class OmdbService {
  constructor(timeout = DEFAULT_TIMEOUT) {
    // Use dynamic key management instead of a single API key
    this.timeout = timeout;
    this.baseURL = OMDB_CONFIG.BASE_URL || 'https://www.omdbapi.com';  // Also update to https
  }

  /**
   * Fetch movie/TV data by IMDb ID
   * @param {string} imdbId - The IMDb ID to fetch
   * @param {Object} params - Additional parameters
   * @returns {Promise<Object>} Normalized movie/TV data
   */
  async fetchByImdbId(imdbId, params = {}) {
    if (!imdbId) {
      throw new Error('IMDb ID is required');
    }

    // Validate IMDb ID format
    if (!this.validateImdbId(imdbId)) {
      throw new Error(`Invalid IMDb ID format: ${imdbId}`);
    }

    console.log(`[${new Date().toISOString()}] OmdbService: Starting fetch for IMDb ID ${imdbId}. Available API keys: ${OMDB_API_KEYS.length}`);
    
    // Get the first available key (simplified approach)
    let currentApiKey;
    try {
      currentApiKey = dynamicOMDbManager.getNextActiveKey();
      console.log(`[${new Date().toISOString()}] OmdbService: Selected active key: ${this.maskKey(currentApiKey)}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] OmdbService: No active keys available from dynamic manager:`, error.message);
      
      // If no active keys available, use the first key from constants as fallback
      console.warn(`[${new Date().toISOString()}] OmdbService: No active keys available, using first key from constants`);
      currentApiKey = OMDB_API_KEYS[0];
      if (!currentApiKey) {
        throw new Error('No OMDb API keys available for request');
      }
      console.log(`[${new Date().toISOString()}] OmdbService: Using fallback key: ${this.maskKey(currentApiKey)}`);
    }
    
    const queryParams = {
      ...params,
      i: imdbId,
      apikey: currentApiKey
    };

    const url = `${this.baseURL}?${this.buildQueryString(queryParams)}`;
    
    // Log the attempt details
    const maskedKey = this.maskKey(currentApiKey);
    console.log(`[${new Date().toISOString()}] OmdbService: Attempting fetch for ${imdbId} with key ${maskedKey}`);
    console.log(`[${new Date().toISOString()}] OmdbService: Request URL: ${url}`);

    try {
      // Execute request with retry logic and timeout
      console.log(`[${new Date().toISOString()}] OmdbService: Executing request to OMDb API...`);
      const response = await this.executeRequest(url, 'fetchByImdbId', currentApiKey);
      console.log(`[${new Date().toISOString()}] OmdbService: Received response from OMDb for ${imdbId}`);
      
      // If successful, update key usage
      dynamicOMDbManager.updateKeyUsage(currentApiKey);
      
      console.log(`[${new Date().toISOString()}] OmdbService: Normalizing OMDb response...`);
      const normalizedResponse = this.normalizeResponse(response);
      console.log(`[${new Date().toISOString()}] OmdbService: OMDb response normalized successfully`);
      
      return normalizedResponse;
    } catch (error) {
      // If we get an error, try the next key if available
      console.error(`[${new Date().toISOString()}] OmdbService: Error fetching data for ${imdbId}:`, error.message);
      
      // Try next key if available
      try {
        const nextApiKey = dynamicOMDbManager.getNextActiveKey();
        if (nextApiKey !== currentApiKey) {
          console.log(`[${new Date().toISOString()}] OmdbService: Trying next key: ${this.maskKey(nextApiKey)}`);
          
          const nextQueryParams = {
            ...params,
            i: imdbId,
            apikey: nextApiKey
          };
          
          const nextUrl = `${this.baseURL}?${this.buildQueryString(nextQueryParams)}`;
          
          const nextResponse = await this.executeRequest(nextUrl, 'fetchByImdbId', nextApiKey);
          
          // If successful, update key usage
          dynamicOMDbManager.updateKeyUsage(nextApiKey);
          
          return this.normalizeResponse(nextResponse);
        }
      } catch (nextError) {
        console.error(`[${new Date().toISOString()}] OmdbService: Failed to use next key:`, nextError.message);
      }
      
      // If all else fails, throw the original error
      console.error(`[${new Date().toISOString()}] OmdbService: All attempts failed for ${imdbId}, throwing error:`, error.message);
      throw error;
    }
  }

  /**
   * Search for movies/TV shows by title
   * @param {string} title - The title to search for
   * @param {Object} params - Additional parameters
   * @returns {Promise<Object>} Search results
   */
  async searchByTitle(title, params = {}) {
    if (!title) {
      throw new Error('Title is required');
    }

    // Try each available key until successful or all are exhausted
    const initialKeyIndex = dynamicOMDbManager.currentKeyIndex;
    let lastError;
    
    while (true) {
      // Get the next available key
      let currentApiKey;
      try {
        currentApiKey = dynamicOMDbManager.getNextActiveKey();
      } catch (error) {
        // No more active keys available
        console.error(`[${new Date().toISOString()}] OmdbService: No active keys available for request`);
        throw new Error(`All OMDb API keys have been exhausted or deactivated. Last error: ${lastError?.message || 'No previous error'}`);
      }
      
      const queryParams = {
        ...params,
        s: title,
        apikey: currentApiKey
      };

      const url = `${this.baseURL}?${this.buildQueryString(queryParams)}`;
      
      // Log the attempt details
      const maskedKey = this.maskKey(currentApiKey);
      console.log(`[${new Date().toISOString()}] OmdbService: Attempting search for ${title} with key ${maskedKey}`);

      try {
        // Execute request with retry logic and timeout
        const response = await this.executeRequest(url, 'searchByTitle', currentApiKey);
        
        // If successful, update key usage
        dynamicOMDbManager.updateKeyUsage(currentApiKey);
        
        return this.normalizeResponse(response);
      } catch (error) {
        lastError = error;
        
        // Check if this is a 401 error
        if (error.message.includes('HTTP error! Status: 401')) {
          console.warn(`[${new Date().toISOString()}] OmdbService: 401 error for key ${maskedKey}, marking as inactive`);
          
          // Mark the key as inactive until UTC midnight
          dynamicOMDbManager.markKeyInactiveFor401(currentApiKey);
          
          // Continue to next key, don't retry with same key
          continue;
        }
        
        // For other errors, throw them as usual
        throw error;
      }
      
      // Break if we've cycled through all keys
      if (dynamicOMDbManager.currentKeyIndex === initialKeyIndex) {
        break;
      }
    }
    
    // If we've tried all keys and still failed
    throw new Error(`Failed to execute searchByTitle after trying all available keys. Last error: ${lastError.message}`);
  }

  /**
   * Execute an HTTP request with retry logic, timeout, and error handling
   * @param {string} url - The URL to request
   * @param {string} operation - The operation name for logging
   * @param {string} apiKey - The API key being used for this request
   * @returns {Promise<Object>} The response data
   */
  async executeRequest(url, operation, apiKey) {
    // Extract IMDb ID from URL if it exists
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const imdbId = urlParams.get('i') || 'N/A';
    
    // Add debugging to verify API key is loaded
    const maskedApiKey = apiKey ? this.maskKey(apiKey) : 'UNDEFINED';
    console.log(`[${new Date().toISOString()}] OmdbService: Attempting ${operation} with API key: ${maskedApiKey}`);
    console.log(`[${new Date().toISOString()}] OmdbService: Request URL: ${url}`);
    
    let lastError;
    
    // Retry only for specific errors (not 401), up to 3 times with exponential backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      // Log attempt details: timestamp, imdbId, key mask, status
      console.log(`[${new Date().toISOString()}] OmdbService: Attempt ${attempt} for ${imdbId} with key ${maskedApiKey}, status: STARTED`);
      
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle timeout
        if (controller.signal.aborted) {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }

        // Check if the request was successful
        console.log(`[${new Date().toISOString()}] OmdbService: Attempt ${attempt} for ${imdbId} with key ${maskedApiKey}, status: ${response.status}`);
        
        // If we get a 401 Unauthorized, don't retry, just return as a specific error
        if (response.status === 401) {
          // Log 401 error with details
          console.log(`[${new Date().toISOString()}] OmdbService: Attempt ${attempt} for ${imdbId} with key ${maskedApiKey}, status: 401`);
          throw new Error(`HTTP error! Status: 401`);
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        // Check if the API returned an error
        if (data.Response === 'False') {
          console.error(`[${new Date().toISOString()}] OmdbService: API returned error for ${imdbId} with key ${maskedApiKey}:`, data.Error);
          throw new Error(data.Error || 'Unknown error from OMDb API');
        }

        // Request successful, return the data
        console.log(`[${new Date().toISOString()}] OmdbService: Attempt ${attempt} for ${imdbId} with key ${maskedApiKey}, status: SUCCESS`);
        return data;

      } catch (error) {
        lastError = error;

        // For 401 errors, don't retry with the same key - return immediately
        if (error.message.includes('HTTP error! Status: 401')) {
          console.log(`[${new Date().toISOString()}] OmdbService: Attempt ${attempt} for ${imdbId} with key ${maskedApiKey}, status: 401`);
          throw error; // Re-throw 401 errors to be handled by fetchByImdbId
        }

        // Log failed attempts with details
        console.log(`[${new Date().toISOString()}] OmdbService: Attempt ${attempt} for ${imdbId} with key ${maskedApiKey}, status: FAILED - ${error.message}`);

        // Don't retry on certain errors (only for non-401 errors now)
        if (this.shouldNotRetry(error)) {
          console.log(`[${new Date().toISOString()}] OmdbService: Error is not retryable for ${imdbId}, stopping retries:`, error.message);
          break;
        }

        // If this was the last attempt, break
        if (attempt === 3) {
          console.log(`[${new Date().toISOString()}] OmdbService: Exhausted all ${attempt} retry attempts for ${imdbId}`);
          break;
        }

        // Calculate exponential backoff delay: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.warn(`[${new Date().toISOString()}] OmdbService: Attempt ${attempt} failed for ${imdbId} with key ${maskedApiKey}. Retrying in ${delay}ms...`, error.message);

        // Wait for the calculated delay
        await this.sleep(delay);
      }
    }

    // If we've exhausted all retries, throw the last error
    console.error(`[${new Date().toISOString()}] OmdbService: Failed to execute ${operation} for ${imdbId} after 3 attempts. Last error: ${lastError.message}`);
    throw new Error(`Failed to execute ${operation} after 3 attempts. Last error: ${lastError.message}`);
  }

  /**
   * Determine if a request should not be retried
   * @param {Error} error - The error that occurred
   * @returns {boolean} True if the error should not trigger a retry
   */
  shouldNotRetry(error) {
    // Don't retry if it's a client error (4xx status codes) except for rate limiting (429)
    if (error.message.includes('HTTP error! Status: 4') && !error.message.includes('Status: 429')) {
      return true;
    }
    
    // Don't retry if the error is a timeout
    if (error.message.includes('timeout')) {
      return true;
    }
    
    // Don't retry if the API explicitly says the request is invalid
    if (error.message.includes('Invalid API key') || error.message.includes('Request limit')) {
      return true;
    }
    
    return false;
  }

  /**
   * Sleep for a specified number of milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after the specified time
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build a query string from an object
   * @param {Object} params - Parameters to convert
   * @returns {string} Query string
   */
  buildQueryString(params) {
    return Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }

  /**
   * Validate IMDb ID format
   * @param {string} imdbId - The IMDb ID to validate
   * @returns {boolean} True if the ID is valid
   */
  validateImdbId(imdbId) {
    // IMDb IDs typically start with "tt" followed by numbers
    return /^tt\d+$/.test(imdbId);
  }

  /**
   * Normalize OMDb response to match existing movie object structure
   * @param {Object} response - The OMDb API response
   * @returns {Object} Normalized movie object
   */
  normalizeResponse(response) {
    // Validate the response data
    this.validateResponse(response);
    
    // If this is a search response (has Search array)
    if (response.Search && Array.isArray(response.Search)) {
      return {
        Response: response.Response,
        Search: response.Search.map(item => ({
          id: item.imdbID,
          title: item.Title,
          year: item.Year,
          type: item.Type,
          poster: item.Poster !== 'N/A' ? item.Poster : null,
          // Add other fields as needed to match your existing structure
        })),
        totalResults: parseInt(response.totalResults) || 0
      };
    }
    
    // If this is a detailed response (single movie/TV show)
    return {
      id: response.imdbID,
      title: response.Title,
      year: response.Year,
      rated: response.Rated,
      released: response.Released,
      runtime: response.Runtime,
      genres: response.Genre ? response.Genre.split(', ').map(g => g.trim()) : [],
      director: response.Director,
      writer: response.Writer,
      actors: response.Actors ? response.Actors.split(', ').map(a => a.trim()) : [],
      plot: response.Plot,
      languages: response.Language ? response.Language.split(', ').map(l => l.trim()) : [],
      country: response.Country,
      awards: response.Awards,
      poster: response.Poster !== 'N/A' ? response.Poster : null,
      ratings: this.normalizeRatings(response.Ratings),
      imdbRating: parseFloat(response.imdbRating) || null,
      imdbVotes: response.imdbVotes ? response.imdbVotes.replace(/,/g, '') : null,
      type: response.Type,
      dvd: response.DVD,
      boxOffice: response.BoxOffice,
      production: response.Production,
      website: response.Website,
      Response: response.Response
    };
  }

  /**
   * Normalize ratings array to consistent format
   * @param {Array} ratings - The ratings array from OMDb
   * @returns {Array} Normalized ratings array
   */
  normalizeRatings(ratings = []) {
    return ratings.map(rating => ({
      source: rating.Source,
      value: rating.Value,
      // Extract numeric value if possible (e.g., "8.0/10" -> 8.0)
      numericValue: this.extractNumericRating(rating.Value)
    }));
  }

  /**
   * Extract numeric value from rating string
   * @param {string} ratingValue - The rating value from OMDb (e.g., "8.0/10")
   * @returns {number|null} The numeric rating value or null if not found
   */
  extractNumericRating(ratingValue) {
    if (!ratingValue) return null;
    
    // Match patterns like "8.0/10", "95/100", etc.
    const match = ratingValue.match(/^(\d+\.?\d*)\/\d+/);
    return match ? parseFloat(match[1]) : null;
  }

  /**
   * Mask the middle of the key for logging (e.g., ab1234cd becomes ab...cd)
   * @param {string} key - The key to mask
   * @returns {string} Masked key
   */
  maskKey(key) {
    if (key.length < 5) return key; // If key is too short, return as is
    return `${key.substring(0, 2)}...${key.substring(key.length - 2)}`;
  }

  /**
   * Validate the response data
   * @param {Object} response - The response to validate
   */
  validateResponse(response) {
    if (!response) {
      throw new Error('Empty response from OMDb API');
    }

    if (response.Response === 'False') {
      throw new Error(response.Error || 'Unknown error from OMDb API');
    }

    // Additional validation could be added here
  }
}

// Export the service
export default OmdbService;