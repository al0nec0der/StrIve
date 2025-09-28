
import { useState, useEffect } from "react";

// IMPORTANT: Move this to a .env file
const OMDb_API_KEY = "your_omdb_api_key";

const useImdbRating = (tmdbId, mediaType) => {
  const [imdbRating, setImdbRating] = useState(null);

  useEffect(() => {
    const fetchImdbRating = async () => {
      try {
        // 1. Get IMDb ID from TMDb API
        const tmdbResponse = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/external_ids`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4Y2E2MDQ4ZDM4ZjJkN2Y5Y2ZmMjU4Y2IzZGQwN2YxMyIsInN1YiI6IjY1Y2EwMWYxYmYwZjYzMDE4NTI4YjYxOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.3bAx3yP-j_30K3YxMv0C3n-Hi0hH6hr_i_n5p_gJ1YI",
            },
          }
        );
        const tmdbData = await tmdbResponse.json();
        const imdbId = tmdbData.imdb_id;

        if (imdbId) {
          // 2. Get IMDb rating from OMDb API
          const omdbResponse = await fetch(
            `http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDb_API_KEY}`
          );
          const omdbData = await omdbResponse.json();
          if (omdbData.imdbRating && omdbData.imdbRating !== "N/A") {
            setImdbRating(omdbData.imdbRating);
          }
        }
      } catch (error) {
        console.error("Error fetching IMDb rating:", error);
      }
    };

    if (tmdbId) {
      fetchImdbRating();
    }
  }, [tmdbId, mediaType]);

  return imdbRating;
};

export default useImdbRating;
