import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Star, Flame, Play, Calendar, RotateCcw } from "lucide-react";
import useImdbRating from "../hooks/useImdbRating";
// import { enhancedBulkRatingProcessor } from "../util/bulkRatingProcessor";

// Import actions to update Redux state with ratings
import { updateRatings } from "../util/moviesSlice";

const SecondaryContainer = () => {
  const movies = useSelector((store) => store.movies);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // State for bulk processing
  const [bulkProcessingStatus, setBulkProcessingStatus] = useState({
    isProcessing: false,
    progress: 0,
    total: 0,
    message: ""
  });

  // Flatten all movies from all categories
  const allMovies = [
    ...(movies.nowPlayingMovies || []),
    ...(movies.popularMovies || []),
    ...(movies.topRatedMovies || []),
    ...(movies.upcomingMovies || [])
  ];

  // Function to process ratings for all visible movies
  const processBulkRatings = async () => {
    // Temporary stub implementation - bulk rating processor is commented out
    console.log("Bulk rating processing temporarily disabled");
    setBulkProcessingStatus({
      isProcessing: true,
      progress: 0,
      total: allMovies.length,
      message: "Bulk processing temporarily disabled for stability"
    });
    
    // Simulate processing completion after a short delay
    setTimeout(() => {
      setBulkProcessingStatus({
        isProcessing: false,
        progress: allMovies.length,
        total: allMovies.length,
        message: "Bulk processing temporarily disabled for stability"
      });
    }, 500);
  };

  // Check if we need to process ratings for the current movies
  useEffect(() => {
    // Temporarily disabled bulk processing to maintain app stability
    // if (!bulkProcessingStatus.isProcessing && allMovies && allMovies.length > 0) {
    //   // Process ratings in batches when component mounts or movies change
    //   const timer = setTimeout(() => {
    //     processBulkRatings();
    //   }, 1000); // Small delay to let the UI render first

    //   return () => clearTimeout(timer);
    // }
  }, [allMovies]); // Re-run when movies change

  if (!movies.nowPlayingMovies) return null;

  const MovieCard = ({ movie }) => {
    if (!movie.poster_path) return null;

    // Get rating data from Redux store (enhanced by bulk processor)
    const ratings = useSelector(state => state.movies.ratings);
    const ratingData = ratings?.[movie.id];
    const { imdbRating, rottenTomatoesRating, metacriticRating, source } = ratingData || {};

    const handleMovieClick = () => {
      console.log(
        `Selected movie: ${movie.original_title} (TMDB ID: ${movie.id})`
      );
      // Navigate to the movie detail page
      navigate(`/movie/${movie.id}`);
    };

    // Function to get rating badge with styling
    const getRatingBadge = (rating, sourceName, colorClass) => {
      if (!rating || rating === "N/A") return null;
      
      // Clean the rating to extract numeric value for display
      let displayRating = rating;
      if (sourceName === "RT") {
        // Extract percentage (e.g., "95%" -> "95")
        displayRating = rating.replace('%', '');
      } else if (sourceName === "MC") {
        // Extract score out of 100 (e.g., "82/100" -> "82")
        const match = rating.match(/^(\d+)\/\d+/);
        displayRating = match ? match[1] : rating;
      } else if (sourceName === "IMDb") {
        // Extract rating out of 10 (e.g., "8.0/10" -> "8.0")
        const match = rating.match(/^(\d+\.?\d*)\/\d+/);
        displayRating = match ? match[1] : rating;
      }

      return (
        <div className={`flex items-center px-1.5 py-0.5 rounded text-xs ${colorClass} bg-opacity-20`}>
          <span className="font-bold mr-1">{sourceName}:</span>
          <span>{displayRating}</span>
        </div>
      );
    };

    return (
      <div
        className="flex-none w-48 mr-4 cursor-pointer group transition-all duration-300"
        onClick={handleMovieClick}
      >
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.original_title}
            className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Enhanced Play overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="bg-white rounded-full p-2 mb-2">
                    <Play className="w-6 h-6 text-black" />
                  </div>
                </div>
                <div className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                  HD
                </div>
              </div>
            </div>
          </div>

          {/* Multi-source Rating badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {imdbRating && getRatingBadge(imdbRating, "IMDb", "bg-yellow-500")}
            {rottenTomatoesRating && getRatingBadge(rottenTomatoesRating, "RT", "bg-red-500")}
            {metacriticRating && getRatingBadge(metacriticRating, "MC", "bg-green-500")}
            
            {/* Fallback to TMDB rating if no OMDb ratings available */}
            {!imdbRating && !rottenTomatoesRating && !metacriticRating && (
              <div className="flex items-center px-2 py-1 bg-blue-500 bg-opacity-30 rounded text-xs">
                <Star className="w-3 h-3 mr-1 text-blue-300 fill-blue-300" />
                <span>{movie.vote_average?.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Source indicator */}
          {source && (
            <div className="absolute bottom-2 left-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                source === "cache" || source === "omdb" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-500 text-white"
              }`}>
                {source === "cache" || source === "omdb" ? "OMDb" : "TMDB"}
              </span>
            </div>
          )}
        </div>

        <div className="mt-2">
          <h3 className="text-white text-sm font-medium truncate group-hover:text-red-400 transition-colors">
            {movie.original_title}
          </h3>
          <p className="text-gray-400 text-xs">
            {movie.release_date?.split("-")[0]} • Movie
          </p>
        </div>
      </div>
    );
  };

  const MovieList = ({ title, movies, icon }) => {
    if (!movies) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-12">
          <h2 className="text-white text-2xl font-bold flex items-center gap-2">
            {icon}
            {title}
          </h2>
          
          {/* Bulk refresh button */}
          <button
            onClick={processBulkRatings}
            disabled={bulkProcessingStatus.isProcessing}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm ${
              bulkProcessingStatus.isProcessing 
                ? "bg-gray-600 text-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <RotateCcw className={`w-4 h-4 ${bulkProcessingStatus.isProcessing ? 'animate-spin' : ''}`} />
            Refresh All Ratings
          </button>
        </div>
        
        {/* Progress bar for bulk operations */}
        {bulkProcessingStatus.isProcessing && (
          <div className="px-12 mb-2">
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${(bulkProcessingStatus.progress / bulkProcessingStatus.total) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-400 mt-1">{bulkProcessingStatus.message}</div>
          </div>
        )}
        
        <div className="flex overflow-x-scroll scrollbar-hide px-12 pb-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative bg-black pt-16 pb-20">
      <MovieList title="Now Playing" movies={movies.nowPlayingMovies} icon={<Flame className="w-6 h-6 text-red-500" />} />
      <MovieList title="Popular Movies" movies={movies.popularMovies} icon={<Play className="w-6 h-6 text-white" />} />
      <MovieList title="Top Rated" movies={movies.topRatedMovies} icon={<Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />} />
      <MovieList title="Upcoming" movies={movies.upcomingMovies} icon={<Calendar className="w-6 h-6 text-blue-400" />} />
    </div>
  );
};

export default SecondaryContainer;
