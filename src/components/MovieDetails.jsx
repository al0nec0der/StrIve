import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { options } from "../util/constants";
import { addToList } from "../util/firestoreService";
import Header from "./Header";
import { Play, Plus, Star, RotateCcw } from "lucide-react";
import useRequireAuth from "../hooks/useRequireAuth";
import comprehensiveRatingService from "../util/comprehensiveRatingService";

const MovieDetails = () => {
  const { movieId } = useParams();
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [comprehensiveRating, setComprehensiveRating] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const navigate = useNavigate();
  const user = useRequireAuth();
  
  const fetchMovieDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`,
        options
      );
      const data = await response.json();
      setMovieDetails(data);
      
      // Fetch comprehensive ratings after getting movie details
      await fetchComprehensiveRatings(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    fetchMovieDetails();
  }, [fetchMovieDetails]);

  const fetchComprehensiveRatings = async (movieData) => {
    setRatingLoading(true);
    try {
      console.log(`[${new Date().toISOString()}] MovieDetails: Starting fetchComprehensiveRatings for movieId: ${movieId}`);
      
      // Resolve IMDb ID from TMDB data first
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/external_ids`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_TMDB_KEY}`,
          },
        }
      );
      const tmdbData = await tmdbResponse.json();
      const imdbId = tmdbData.imdb_id;
      
      if (!imdbId) {
        throw new Error("No IMDb ID found for this movie");
      }
      
      // Make direct API call to OMDB
      const omdbResponse = await fetch(
        `https://www.omdbapi.com/?i=${imdbId}&apikey=${import.meta.env.VITE_OMDB_KEY_1}`
      );
      const omdbData = await omdbResponse.json();
      
      if (omdbData.Response === "False") {
        throw new Error(omdbData.Error || "OMDB API returned an error");
      }
      
      // Extract ratings directly from OMDB response
      const rtRating = omdbData.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || 'N/A';
      const mcRating = omdbData.Ratings?.find(r => r.Source === 'Metacritic')?.Value || 'N/A';
      const imdbRating = omdbData.imdbRating || 'N/A';
      const imdbVotes = omdbData.imdbVotes || 'N/A';
      
      // Format the rating data to match expected structure
      const ratingData = {
        imdbRating,
        rottenTomatoesRating: rtRating,
        metacriticRating: mcRating,
        imdbVotes,
        awards: omdbData.Awards || 'N/A',
        plot: omdbData.Plot || 'N/A',
        director: omdbData.Director || 'N/A',
        actors: omdbData.Actors || 'N/A',
        writer: omdbData.Writer || 'N/A',
        source: 'omdb',
        reliability: { score: 9, freshness: 10 }
      };
      
      console.log(`[${new Date().toISOString()}] MovieDetails: Direct OMDB ratings data:`, ratingData);
      setComprehensiveRating(ratingData);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] MovieDetails: Error fetching OMDB ratings directly:`, error);
      // Set an error state to display to the user
      setComprehensiveRating({
        source: 'error',
        error: error.message,
        imdbRating: 'N/A',
        rottenTomatoesRating: 'N/A',
        metacriticRating: 'N/A',
        tmdbRating: movieData?.vote_average?.toFixed(1) || 'N/A'
      });
    } finally {
      setRatingLoading(false);
    }
  };

  const handlePlayMovie = () => {
    if (!user) {
      alert("Please log in to watch movies.");
      navigate("/login");
      return;
    }
    navigate(`/movie/${movieId}/play`);
  };

  const handleAddToWatchlist = async () => {
    if (!user) {
      alert("Please log in to add movies to your watchlist.");
      return;
    }

    try {
      const mediaItem = {
        id: movieDetails.id,
        title: movieDetails.title,
        poster_path: movieDetails.poster_path,
        overview: movieDetails.overview,
        release_date: movieDetails.release_date,
        vote_average: movieDetails.vote_average,
        type: "movie",
      };

      await addToList(user.uid, "watchlist", mediaItem);
      alert(`${mediaItem.title} added to your watchlist!`);
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      alert("Failed to add to watchlist. Please try again.");
    }
  };

  const handleRefreshRating = async () => {
    setRefreshing(true);
    try {
      if (movieDetails) {
        // Make direct API call to OMDB (same as initial fetch)
        const tmdbResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}/external_ids`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_TMDB_KEY}`,
            },
          }
        );
        const tmdbData = await tmdbResponse.json();
        const imdbId = tmdbData.imdb_id;
        
        if (!imdbId) {
          throw new Error("No IMDb ID found for this movie");
        }
        
        // Make direct API call to OMDB
        const omdbResponse = await fetch(
          `https://www.omdbapi.com/?i=${imdbId}&apikey=${import.meta.env.VITE_OMDB_KEY_1}`
        );
        const omdbData = await omdbResponse.json();
        
        if (omdbData.Response === "False") {
          throw new Error(omdbData.Error || "OMDB API returned an error");
        }
        
        // Extract ratings directly from OMDB response
        const rtRating = omdbData.Ratings?.find(r => r.Source === 'Rotten Tomatoes')?.Value || 'N/A';
        const mcRating = omdbData.Ratings?.find(r => r.Source === 'Metacritic')?.Value || 'N/A';
        const imdbRating = omdbData.imdbRating || 'N/A';
        const imdbVotes = omdbData.imdbVotes || 'N/A';
        
        // Format the rating data to match expected structure
        const ratingData = {
          imdbRating,
          rottenTomatoesRating: rtRating,
          metacriticRating: mcRating,
          imdbVotes,
          awards: omdbData.Awards || 'N/A',
          plot: omdbData.Plot || 'N/A',
          director: omdbData.Director || 'N/A',
          actors: omdbData.Actors || 'N/A',
          writer: omdbData.Writer || 'N/A',
          source: 'omdb',
          reliability: { score: 9, freshness: 10 }
        };
        
        setComprehensiveRating(ratingData);
      }
    } catch (error) {
      console.error("Error refreshing ratings:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Use comprehensive rating data
  // Destructured variables removed - using comprehensiveRating properties directly in JSX

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
          <div className="mt-4 text-white text-lg">Loading Movie Details...</div>
        </div>
      </div>
    );
  }

  if (!movieDetails) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-2xl">Movie not found</div>
          <button
            onClick={() => window.history.back()}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <Header />
      
      {/* Background Image */}
      <div
        className="relative h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original${movieDetails.backdrop_path})`,
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-12 z-10">
          <div className="max-w-4xl">
            <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">
              {movieDetails.title}
            </h1>

            {/* Comprehensive Rating Section */}
            <div className="mb-6">
              {/* Show error message if there was an error */}
              {comprehensiveRating?.source === 'error' && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
                  <p className="text-red-200 font-medium">Rating Service Error: {comprehensiveRating.error}</p>
                  <p className="text-red-300 text-sm mt-1">Displaying limited data from TMDB only</p>
                </div>
              )}
              
              {/* Rating Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {/* TMDB Rating Card */}
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">TMDB</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {comprehensiveRating?.tmdbRating || movieDetails.vote_average?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {comprehensiveRating?.tmdbVoteCount ? `${comprehensiveRating.tmdbVoteCount} votes` : 'User Rating'}
                  </div>
                </div>
                
                {/* IMDb Rating Card */}
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">IMDb</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {comprehensiveRating?.imdbRating || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {comprehensiveRating?.imdbVotes || 'No votes'}
                  </div>
                </div>
                
                {/* Rotten Tomatoes Rating Card */}
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Rotten Tomatoes</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {comprehensiveRating?.rottenTomatoesRating || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {comprehensiveRating?.source === 'omdb' ? 'Verified' : 'TMDB fallback'}
                  </div>
                </div>
                
                {/* Metacritic Rating Card */}
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Metacritic</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {comprehensiveRating?.metacriticRating || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {comprehensiveRating?.source === 'omdb' ? 'Verified' : 'TMDB fallback'}
                  </div>
                </div>
                
                {/* Source Indicator */}
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Data Source</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {comprehensiveRating?.source === 'omdb' ? 'OMDb' : 
                     comprehensiveRating?.source === 'cache' ? 'Cache' : 
                     comprehensiveRating?.source === 'error' ? 'Error' : 'TMDB'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {comprehensiveRating?.source === 'omdb' ? 'Full Data' : 'Limited Data'}
                  </div>
                </div>
              </div>
              
              {/* Refresh All Ratings Button */}
              <div className="mt-2 flex justify-center">
                <button 
                  onClick={handleRefreshRating}
                  disabled={refreshing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    refreshing 
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } transition-colors`}
                >
                  <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh All Ratings
                </button>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-6 mb-6 text-lg">
              <span className="text-red-400 font-semibold">
                {movieDetails.release_date?.split("-")[0]}
              </span>
              <span className="text-white">
                {Math.floor(movieDetails.runtime / 60)}h {movieDetails.runtime % 60}m
              </span>
              {movieDetails.status && (
                <span className="bg-red-600 text-white px-3 py-1 rounded text-sm">
                  {movieDetails.status}
                </span>
              )}
            </div>

            {/* Awards */}
            {comprehensiveRating?.awards && comprehensiveRating.awards !== "N/A" && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-800 rounded-lg">
                <p className="text-yellow-200 font-medium">Awards: {comprehensiveRating.awards}</p>
              </div>
            )}

            <p className="text-xl text-gray-200 mb-8 leading-relaxed max-w-3xl">
              {movieDetails.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handlePlayMovie}
                className="flex items-center gap-2 px-8 py-4 bg-white text-black text-xl font-semibold rounded hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
              >
                <Play className="w-6 h-6" />
                Play
              </button>

              <button
                onClick={handleAddToWatchlist}
                className="flex items-center gap-2 px-8 py-4 bg-gray-600/80 text-white text-xl font-semibold rounded hover:bg-gray-500/80 transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-6 h-6" />
                My List
              </button>
            </div>

            {/* Genres */}
            {movieDetails.genres && (
              <div className="flex flex-wrap gap-2">
                {movieDetails.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default MovieDetails;