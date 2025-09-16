import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { options } from "../util/constants";
import { addToList } from "../util/firestoreService";
import MoviePlayer from "./MoviePlayer";
import Header from "./Header";
import { Play, Plus, Star } from "../components/icons";

const MovieDetails = () => {
  const { movieId } = useParams();
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const user = useSelector((store) => store.user.user);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchMovieDetails();
  }, [movieId]);

  const fetchMovieDetails = async () => {
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
  };

  const handlePlayMovie = () => {
    if (!user) {
      alert("Please log in to watch movies.");
      return;
    }
    setShowPlayer(true);
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

            {/* Meta Info */}
            <div className="flex items-center gap-6 mb-6 text-lg">
              <span className="text-red-400 font-semibold">
                {movieDetails.release_date?.split("-")[0]}
              </span>
              <span className="text-white flex items-center">
                <Star className="w-5 h-5 mr-1 text-yellow-400 fill-yellow-400" />
                {movieDetails.vote_average?.toFixed(1)}/10
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

      {/* Movie Player Modal */}
      {showPlayer && movieDetails && (
        <MoviePlayer
          movie={movieDetails}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>
  );
};

export default MovieDetails;