import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { options } from "../util/constants";
import { addToList } from "../util/firestoreService";
import { addItem } from "../util/listsSlice";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import { Play, Plus, Star, RotateCcw } from "lucide-react";
import useRequireAuth from "../hooks/useRequireAuth";
import useImdbTitle from "../hooks/useImdbTitle";
import MoviePlayer from "./MoviePlayer";
import AddToListPopover from "./AddToListPopover";
import CreateListModal from "./CreateListModal";

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
  const { movieId, imdbId } = useParams();
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const user = useRequireAuth();
  const dispatch = useDispatch();
  
  // Determine which ID to use - if imdbId param exists, use it; otherwise use movieId
  const currentId = imdbId || movieId;
  const mediaType = currentId && currentId.startsWith('tt') ? "movie" : "movie";  // For movies, it's always "movie"
  
  // Get IMDb data for this movie using the new hook
  const { data: imdbData, loading: imdbLoading } = useImdbTitle(currentId, mediaType);

  const fetchMovieDetails = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch detailed movie information using TMDB ID with images
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?language=en-US&append_to_response=images&include_image_language=en,null`,
        options
      );
      const movieData = await response.json();
      setMovieDetails(movieData);

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

  const handleSelectList = async (listId, listType) => {
    if (!user) {
      alert("Please log in to add movies to your lists.");
      setShowPopover(false);
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

      if (listType === 'watchlist') {
        await addToList(user.uid, "watchlist", mediaItem);
        alert(`${mediaItem.title} added to your watchlist!`);
      } else {
        await dispatch(addItem({ 
          userId: user.uid, 
          listId, 
          mediaItem 
        })).unwrap();
        alert(`${mediaItem.title} added to your list!`);
      }
      
      setShowPopover(false);
    } catch (error) {
      console.error("Error adding to list:", error);
      alert("Failed to add to list. Please try again.");
    }
  };

  const handleCreateNew = () => {
    setShowPopover(false);
    setShowCreateModal(true);
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
            {/* Title Logo or Text */}
            {movieDetails.images?.logos?.length > 0 ? (
              <div className="mb-4">
                <img 
                  src={`https://image.tmdb.org/t/p/w500${movieDetails.images.logos[0].file_path}`}
                  alt={`${movieDetails.title} Logo`}
                  className="max-w-full h-auto max-h-32 object-contain"
                />
              </div>
            ) : (
              <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">
                {movieDetails.title}
              </h1>
            )}

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

              <div className="relative">
                <button
                  onClick={handleAddToWatchlist}
                  onMouseEnter={() => setShowPopover(true)}
                  className="flex items-center gap-2 px-8 py-4 bg-gray-600/80 text-white text-xl font-semibold rounded hover:bg-gray-500/80 transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="w-6 h-6" />
                  My List
                </button>
                
                {showPopover && (
                  <div 
                    onMouseEnter={() => setShowPopover(true)}
                    onMouseLeave={() => setShowPopover(false)}
                  >
                    <AddToListPopover 
                      onSelectList={handleSelectList}
                      onCreateNew={handleCreateNew}
                    />
                  </div>
                )}
              </div>
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
      {showPlayer && (
        <MoviePlayer 
          movieId={movieId} 
          onClose={() => setShowPlayer(false)} 
        />
      )}

      {/* Create List Modal */}
      <CreateListModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        userId={user?.uid} 
      />
    </div>
  );
};

export default MovieDetails;