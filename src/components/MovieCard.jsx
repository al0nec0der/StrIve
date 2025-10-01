import React, { useState, useRef, useEffect } from "react";
import { IMG_CDN_URL } from "../util/constants";
import useImdbRating from "../hooks/useImdbRating";

const MovieCard = ({ posterPath, movieId, tmdbRating, voteAverage }) => {
  // If a movie has no poster, we won't render anything for it.
  if (!posterPath) return null;

  // Fetch rating data for this specific movie using the useImdbRating hook
  const { 
    imdbRating, 
    imdbVotes, 
    rottenTomatoes, 
    metacritic, 
    source,
    isLoading: ratingLoading,
    error
  } = useImdbRating(movieId, 'movie') || {};

  // State for showing tooltip
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeout = useRef(null);

  // Function to format rating for display
  const formatRating = (rating, type) => {
    if (!rating || rating === "N/A") return "N/A";
    
    // Clean the rating to extract numeric value for display
    let displayRating = rating;
    if (type === "RT") {
      // Extract percentage (e.g., "95%" -> "95")
      displayRating = rating.replace('%', '');
    } else if (type === "MC") {
      // Extract score out of 100 (e.g., "82/100" -> "82")
      const match = rating.match(/^(\d+)\/\d+/);
      displayRating = match ? match[1] : rating;
    } else if (type === "IMDb") {
      // Extract rating out of 10 (e.g., "8.0/10" -> "8.0")
      const match = rating.match(/^(\d+\.?\d*)\/\d+/);
      displayRating = match ? match[1] : rating;
    }
    
    return displayRating;
  };

  // Determine primary rating (IMDb if available, otherwise TMDB)
  const primaryRating = imdbRating && imdbRating !== "N/A" 
    ? { value: formatRating(imdbRating, "IMDb"), source: "IMDb" }
    : { value: tmdbRating || voteAverage?.toFixed(1) || "N/A", source: "TMDB" };

  // Handle hover effects for tooltip
  const handleMouseEnter = () => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    tooltipTimeout.current = setTimeout(() => {
      setShowTooltip(false);
    }, 300); // Delay to allow for smooth transitions
  };

  return (
    <div 
      className="w-48 pr-4 relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img 
        alt="Movie Card" 
        src={IMG_CDN_URL + posterPath} 
        className="rounded-lg transition-transform duration-300 group-hover:scale-105"
      />
      
      {/* IMDb Rating (Primary) - Left side */}
      <div className="absolute top-2 left-2">
        {imdbRating && imdbRating !== "N/A" ? (
          <div className="flex items-center bg-black/70 text-white text-xs px-2 py-1 rounded">
            <span className="mr-1">⭐</span>
            <span className="font-bold mr-1">IMDb:</span>
            <span>{formatRating(imdbRating, "IMDb")}</span>
          </div>
        ) : (
          // Show loading state if data is being fetched
          ratingLoading && (
            <div className="flex items-center bg-black/70 text-gray-400 text-xs px-2 py-1 rounded">
              <span className="mr-1">⏳</span>
              <span>Loading...</span>
            </div>
          )
        )}
      </div>
      
      {/* TMDB Rating (Secondary) - Right side */}
      <div className="absolute top-2 right-2">
        {voteAverage ? (
          <div className="flex items-center bg-blue-600/90 text-white text-xs px-2 py-1 rounded">
            <span className="font-bold mr-1">TMDB:</span>
            <span>{voteAverage.toFixed(1)}</span>
          </div>
        ) : (
          // Show loading state if data is being fetched
          ratingLoading && (
            <div className="flex items-center bg-blue-600/90 text-gray-300 text-xs px-2 py-1 rounded">
              <span className="mr-1">⏳</span>
              <span>Loading...</span>
            </div>
          )
        )}
      </div>
      
      {/* Tooltip for additional ratings */}
      {showTooltip && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 bg-opacity-90 rounded-lg p-2 border border-gray-700 shadow-lg min-w-max">
          <div className="flex flex-col gap-1">
            {imdbRating && imdbRating !== "N/A" && (
              <div className="flex items-center text-xs text-white">
                <span className="font-bold mr-2 w-8">IMDb:</span>
                <span>{formatRating(imdbRating, "IMDb")}</span>
              </div>
            )}
            {rottenTomatoes && rottenTomatoes !== "N/A" && (
              <div className="flex items-center text-xs text-white">
                <span className="font-bold mr-2 w-8">RT:</span>
                <span>{formatRating(rottenTomatoes, "RT")}</span>
              </div>
            )}
            {metacritic && metacritic !== "N/A" && (
              <div className="flex items-center text-xs text-white">
                <span className="font-bold mr-2 w-8">MC:</span>
                <span>{formatRating(metacritic, "MC")}</span>
              </div>
            )}
          </div>
          
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default MovieCard;