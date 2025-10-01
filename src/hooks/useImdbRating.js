
import { useState, useEffect } from "react";
import { options } from '../util/constants';
import comprehensiveRatingService from '../util/comprehensiveRatingService';

const useImdbRating = (tmdbId, mediaType = 'movie') => {
  const [imdbRating, setImdbRating] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRating = async () => {
      console.log(`useImdbRating hook: Starting to fetch ratings for tmdbId: ${tmdbId}, mediaType: ${mediaType}`);
      
      if (!tmdbId) {
        console.log("useImdbRating hook: No tmdbId provided, setting null");
        setImdbRating(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        // 2. First call TMDB external_ids endpoint using existing options from constants.js
        console.log("useImdbRating hook: Fetching TMDB external IDs...");
        const tmdbResponse = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/external_ids`,
          options
        );
        
        if (!tmdbResponse.ok) {
          throw new Error(`TMDB API error: ${tmdbResponse.status}`);
        }
        
        const tmdbData = await tmdbResponse.json();
        console.log("useImdbRating hook: TMDB external IDs response received:", tmdbData);
        
        // 3. Extract IMDb ID from TMDB response (format: "tt1234567")
        const imdbId = tmdbData.imdb_id;
        console.log("useImdbRating hook: Extracted IMDb ID:", imdbId);
        
        if (!imdbId) {
          console.log(`useImdbRating hook: No IMDb ID found for TMDB ID: ${tmdbId}`);
          setImdbRating(null);
          setIsLoading(false);
          return;
        }

        // 4. Call fixed comprehensiveRatingService with the IMDb ID
        console.log("useImdbRating hook: Calling comprehensiveRatingService...");
        const ratingData = await comprehensiveRatingService.fetchComprehensiveRatings(
          tmdbId,
          mediaType,
          import.meta.env.VITE_OMDB_KEY_1
        );
        
        console.log("useImdbRating hook: Comprehensive rating data received:", ratingData);
        
        // 5. Return object with the requested structure
        const formattedRatingData = {
          imdbRating: ratingData.imdbRating,
          imdbVotes: ratingData.imdbVotes,
          rottenTomatoes: ratingData.rottenTomatoesRating,
          metacritic: ratingData.metacriticRating,
          source: ratingData.source
        };
        
        console.log("useImdbRating hook: Setting formatted rating data:", formattedRatingData);
        setImdbRating(formattedRatingData);

        // 8. Cache successful results in component state to avoid re-fetching
        // The state itself acts as a cache, and useEffect will only re-run when tmdbId changes
      } catch (error) {
        console.error("useImdbRating hook: Error fetching ratings:", error);
        // 7. Handle error states
        setError(error.message);
        setImdbRating(null);
      } finally {
        // 7. Handle loading states
        setIsLoading(false);
      }
    };

    fetchRating();
  }, [tmdbId, mediaType]); // 6. Handle the useEffect dependency correctly (like movieID dependency in useMovieTrailer.js)

  // 5. Return object with the requested structure
  return {
    imdbRating: imdbRating?.imdbRating || null,
    imdbVotes: imdbRating?.imdbVotes || null,
    rottenTomatoes: imdbRating?.rottenTomatoes || null,
    metacritic: imdbRating?.metacritic || null,
    source: imdbRating?.source || null,
    isLoading,
    error
  };
};

export default useImdbRating;
