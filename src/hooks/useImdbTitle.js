import { useState, useEffect } from 'react';
import IMDbService from '../util/imdbService';
import { getImdbId } from '../util/imdbResolver';

/**
 * Custom hook to fetch IMDb title information by TMDB ID
 * @param {string} tmdbId - The TMDB ID to lookup
 * @param {string} mediaType - The media type ('movie' or 'tv')
 * @returns {Object} Object containing data, loading, and error states
 */
const useImdbTitle = (tmdbId, mediaType = 'movie') => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImdbTitle = async () => {
      try {
        setLoading(true);
        setError(null);

        // First get the IMDb ID using the TMDB ID
        const imdbId = await getImdbId(tmdbId, mediaType);

        if (!imdbId) {
          // No IMDb ID found for this TMDB ID
          setData(null);
          setLoading(false);
          return;
        }

        // Create an instance of IMDbService and fetch the title data
        const imdbService = new IMDbService();
        const titleData = await imdbService.getTitleById(imdbId);

        setData(titleData);
      } catch (err) {
        setError(err.message);
        console.error('Error in useImdbTitle hook:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tmdbId) {
      fetchImdbTitle();
    }
  }, [tmdbId, mediaType]);

  return { data, loading, error };
};

export default useImdbTitle;