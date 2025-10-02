import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IMG_CDN_URL } from "../util/constants";
import { Star, Play, Tv } from "lucide-react";
import useImdbRating from "../hooks/useImdbRating";

const TVShowCard = ({ tvShow }) => {
  // Fetch rating data for this specific TV show using the useImdbRating hook
  const { 
    imdbRating, 
    imdbVotes: ImdbVotes, 
    rottenTomatoes, 
    metacritic, 
    source: Source,
    isLoading: ratingLoading,
    error: Error 
  } = useImdbRating(tvShow.id, 'tv') || {};

  const navigate = useNavigate();

  // State for showing tooltip
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeout = useRef(null);

  // If a TV show has no poster, we won't render anything for it.
  if (!tvShow.poster_path) return null;

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

  const handleClick = () => {
    console.log(`Selected TV Show: ${tvShow.name} (TMDB ID: ${tvShow.id})`);
    // Navigate to the TV show detail page
    navigate(`/tv/${tvShow.id}`);
  };

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
      className="flex-none w-48 mr-4 cursor-pointer group transition-all duration-300 relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={`${IMG_CDN_URL}${tvShow.poster_path}`}
          alt={tvShow.name}
          className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Play overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="bg-white rounded-full p-2 mb-2">
                  <Play className="w-6 h-6 text-black" />
                </div>
              </div>
              <div className="bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center">
                <Tv className="w-3 h-3 mr-1" />
                TV
              </div>
            </div>
          </div>
        </div>

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
          {tvShow.vote_average ? (
            <div className="flex items-center bg-blue-600/90 text-white text-xs px-2 py-1 rounded">
              <span className="font-bold mr-1">TMDB:</span>
              <span>{tvShow.vote_average.toFixed(1)}</span>
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
      </div>

      <div className="mt-2">
        <h3 className="text-white text-sm font-medium truncate group-hover:text-green-400 transition-colors">
          {tvShow.name}
        </h3>
        <p className="text-gray-400 text-xs">
          {tvShow.first_air_date?.split("-")[0]} • TV Series
        </p>
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

export default TVShowCard;
