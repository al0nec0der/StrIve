
export class RiveStreamingService {
  static BASE_URL = "https://rivestream.org/embed";

  /**
   * Get streaming URL for a movie using TMDB ID
   * @param {number} tmdbId - The Movie Database ID
   * @returns {string} - Rive embed URL for the movie
   */
  static getMovieStreamUrl(tmdbId) {
    return `${this.BASE_URL}/movie/${tmdbId}`;
  }

  /**
   * Get streaming URL for a TV show episode using TMDB ID
   * @param {number} tmdbId - The Movie Database ID
   * @param {number} season - Season number
   * @param {number} episode - Episode number
   * @returns {string} - Rive embed URL for the TV episode
   */
  static getTVStreamUrl(tmdbId, season, episode) {
    return `${this.BASE_URL}/tv/${tmdbId}/${season}/${episode}`;
  }

  /**
   * Check if content is available on Rive
   * @param {string} type - 'movie' or 'tv'
   * @param {number} tmdbId - TMDB ID
   * @returns {Promise<boolean>} - Whether content is available
   */
  static async isContentAvailable(type, tmdbId) {
    try {
      const url =
        type === "movie"
          ? this.getMovieStreamUrl(tmdbId)
          : this.getTVStreamUrl(tmdbId, 1, 1);

      const response = await fetch(url, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      console.error("Error checking content availability:", error);
      return false;
    }
  }
}
