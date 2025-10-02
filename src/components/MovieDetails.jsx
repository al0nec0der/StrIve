import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { options } from "../util/constants";
import { addToList } from "../util/firestoreService";
import Header from "./Header";
import { Play, Plus, Star, RotateCcw } from "lucide-react";
import useRequireAuth from "../hooks/useRequireAuth";
import useImdbTitle from "../hooks/useImdbTitle";

// Helper function to format large numbers
const formatCount = (num) => {
  if (num === null || num === undefined) return 'N/A';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const MovieDetails = () => {
  const { movieId } = useParams();
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = useRequireAuth();
  
  // Get IMDb data for this movie using the new hook
  const { data: imdbData, loading: imdbLoading, error: imdbError } = useImdbTitle(movieId, "movie");

  const fetchMovieDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`,
        options
      );
      const data = await response.json();
      setMovieDetails(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    fetchMovieDetails();
  }, [fetchMovieDetails]);

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

            {/* Rating Section with Progressive Loading */}
            <div className="mb-6">
              {/* Multi-source Rating Grid */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4">
                {/* TMDB Rating Card */}
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">TMDB</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {movieDetails.vote_average?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {movieDetails.vote_count ? `${formatCount(movieDetails.vote_count)} votes` : 'User Rating'}
                  </div>
                </div>
                
                {/* IMDb Rating Card */}
                <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">IMDb</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {imdbLoading ? (
                      <div className="h-6 w-8 bg-gray-600 rounded-full animate-pulse mx-auto"></div>
                    ) : imdbData && imdbData.rating && imdbData.rating.aggregateRating ? (
                      imdbData.rating.aggregateRating
                    ) : (
                      'N/A'
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {imdbData && imdbData.rating && imdbData.rating.voteCount ? 
                      `${formatCount(imdbData.rating.voteCount)} votes` : 
                      imdbLoading ? 'Loading...' : 'N/A votes'}
                  </div>
                </div>
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