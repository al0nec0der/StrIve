// src/util/riveService.js - CORRECTED VERSION
export class RiveStreamingService {
  static BASE_URL = "https://rivestream.org/embed";

  /**
   * Get streaming URL for a movie using TMDB ID
   * @param {number} tmdbId - The Movie Database ID
   * @returns {string} - Rive embed URL for the movie
   */
  static getMovieStreamUrl(tmdbId) {
    return `${this.BASE_URL}?type=movie&id=${tmdbId}`;
  }

  /**
   * Get streaming URL for a TV show episode using TMDB ID
   * @param {number} tmdbId - The Movie Database ID
   * @param {number} season - Season number
   * @param {number} episode - Episode number
   * @returns {string} - Rive embed URL for the TV episode
   */
  static getTVStreamUrl(tmdbId, season, episode) {
    return `${this.BASE_URL}?type=tv&id=${tmdbId}&s=${season}&e=${episode}`;
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

      // For iframe embeds, we can't reliably check with HEAD request
      // So we'll assume it's available and handle errors in the player
      return true;
    } catch (error) {
      console.error(
        `Error checking availability for TMDB ID ${tmdbId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get alternative streaming URLs for fallback (updated formats)
   * @param {number} tmdbId - TMDB ID
   * @returns {Array<object>} - Array of server objects with names and URLs
   */
  static getAlternativeServers(tmdbId) {
    return [
      {
        name: "Rive",
        url: `https://rivestream.org/embed?type=movie&id=${tmdbId}`,
      },
      {
        name: "2Embed",
        url: `https://www.2embed.to/embed/tmdb/movie?id=${tmdbId}`,
      },
      {
        name: "MultiEmbed",
        url: `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`,
      },
      {
        name: "VidSrc",
        url: `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`,
      },
    ];
  }
}
