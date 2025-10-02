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
}

export default IMDbService;