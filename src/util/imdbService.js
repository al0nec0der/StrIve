/**
 * IMDb Service
 * Handles all API calls to api.imdbapi.dev
 */
class IMDbService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_IMDB_BASE_URL || 'https://api.imdbapi.dev';
  }

  /**
   * Fetches title information by IMDb ID
   * @param {string} imdbId - The IMDb ID to lookup
   * @returns {Promise<Object>} The title data from IMDb API
   */
  async getTitleById(imdbId) {
    try {
      const url = `${this.baseUrl}/titles/${imdbId}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching data for IMDb ID ${imdbId}:`, error);
      throw error;
    }
  }

  /**
   * Searches for titles based on a query string
   * @param {string} query - The search query
   * @returns {Promise<Array>} The array of title data from IMDb API
   */
  async searchTitles(query, limit = 50) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseUrl}/search/titles?query=${encodedQuery}&limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.titles || [];
    } catch (error) {
      console.error(`Error searching for titles with query "${query}":`, error);
      throw error;
    }
  }
}

export default IMDbService;