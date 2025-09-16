22// src/util/riveService.js
export class RiveStreamingService {
  static BASE_URL = import.meta.env.VITE_RIVE_BASE_URL;

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
   * @returns {Promise<boolean>} - Whether content is available
   */
  static async isContentAvailable() {
    // For iframe embeds, we can't reliably check with HEAD request
    // So we'll assume it's available and handle errors in the player
    return true;
  }

  /**
   * Get alternative streaming URLs for fallback
   * @param {number} tmdbId - TMDB ID
   * @returns {Array<object>} - Array of server objects with names and URLs
   */
  static getAlternativeServers(tmdbId) {
    return [
      {
        name: "Rive",
        url: `${import.meta.env.VITE_RIVE_BASE_URL}?type=movie&id=${tmdbId}`,
      },
      {
        name: "Cinemaos",
        url: `${import.meta.env.VITE_CINEMAOS_URL}/${tmdbId}`,
      },
      {
        name: "2Embed",
        url: `${import.meta.env.VITE_2EMBED_URL}/movie?id=${tmdbId}`,
      },
      {
        name: "MultiEmbed",
        url: `${
          import.meta.env.VITE_MULTIEMBED_URL
        }/directstream.php?video_id=${tmdbId}&tmdb=1`,
      },
      {
        name: "VidSrc",
        url: `${import.meta.env.VITE_VIDSRC_URL}/movie?tmdb=${tmdbId}`,
      },
    ];
  }
}
