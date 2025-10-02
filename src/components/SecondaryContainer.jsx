import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Star, Flame, Play, Calendar, RotateCcw } from "lucide-react";
import { batchGetRatingsWithCache } from "../util/cacheManager";

// Import actions to update Redux state with ratings
import { updateRatings } from "../util/moviesSlice";
import MovieCard from "./MovieCard";

const SecondaryContainer = () => {
  const movies = useSelector((store) => store.movies);
  const dispatch = useDispatch();
  // const navigate = useNavigate(); // Currently unused
  
  // State for bulk processing
  const [bulkProcessingStatus, setBulkProcessingStatus] = useState({
    isProcessing: false,
    progress: 0,
    total: 0,
    message: ""
  });

  // Flatten all movies from all categories
  const allMovies = React.useMemo(() => [
    ...(movies.nowPlayingMovies || []),
    ...(movies.popularMovies || []),
    ...(movies.topRatedMovies || []),
    ...(movies.upcomingMovies || [])
  ], [
    movies.nowPlayingMovies,
    movies.popularMovies,
    movies.topRatedMovies,
    movies.upcomingMovies
  ]);

  // Function to process ratings for all visible movies
  const processBulkRatings = async () => {
    if (!allMovies || allMovies.length === 0) {
      console.log("No movies to process ratings for");
      return;
    }

    const omdbApiKey = import.meta.env.VITE_OMDB_KEY_1;

    if (!omdbApiKey) {
      console.error("OMDB API key is missing");
      setBulkProcessingStatus({
        isProcessing: false,
        progress: 0,
        total: allMovies.length,
        message: "OMDB API key is required for ratings"
      });
      return;
    }

    setBulkProcessingStatus({
      isProcessing: true,
      progress: 0,
      total: allMovies.length,
      message: "Fetching ratings..."
    });

    try {
      // Extract unique movie IDs from all movie lists
      const movieIds = allMovies.map(movie => movie.id);
      
      // Process ratings in chunks to manage API rate limits
      const chunkSize = 10;
      const chunks = [];
      for (let i = 0; i < movieIds.length; i += chunkSize) {
        chunks.push(movieIds.slice(i, i + chunkSize));
      }
      
      let processedRatings = {};
      let processedCount = 0;
      
      for (const chunk of chunks) {
        const chunkRatings = await batchGetRatingsWithCache(chunk, 'movie', omdbApiKey);
        processedRatings = { ...processedRatings, ...chunkRatings };
        
        processedCount += chunk.length;
        setBulkProcessingStatus(prev => ({
          ...prev,
          progress: processedCount,
          message: `Processed ${processedCount} of ${allMovies.length} movies...`
        }));
        
        // Small delay to avoid hitting API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update Redux store with the new ratings
      dispatch(updateRatings(processedRatings));

      setBulkProcessingStatus({
        isProcessing: false,
        progress: allMovies.length,
        total: allMovies.length,
        message: `Successfully updated ratings for ${allMovies.length} movies`
      });
    } catch (error) {
      console.error("Error processing bulk ratings:", error);
      setBulkProcessingStatus({
        isProcessing: false,
        progress: 0,
        total: allMovies.length,
        message: `Error: ${error.message}`
      });
    }
  };

  // Check if we need to process ratings for the current movies
  useEffect(() => {
    if (!bulkProcessingStatus.isProcessing && allMovies && allMovies.length > 0) {
      // Process ratings in batches when component mounts or movies change
      const timer = setTimeout(() => {
        processBulkRatings();
      }, 1000); // Small delay to let the UI render first

      return () => clearTimeout(timer);
    }
  }, [allMovies, processBulkRatings]); // Re-run when movies change

  if (!movies.nowPlayingMovies) return null;

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