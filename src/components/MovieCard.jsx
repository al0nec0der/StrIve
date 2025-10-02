import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Star, Play } from "lucide-react";

// Define MovieCard component outside of SecondaryContainer to avoid conditional hook calls
const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  // Get rating data from Redux store (enhanced by bulk processor)
  const ratings = useSelector((state) => state.movies.ratings);
  const ratingData = ratings?.[movie.id];
  const { imdbRating, rottenTomatoesRating, metacriticRating, source } =
    ratingData || {};

  // If a movie has no poster, we won't render anything for it.
  if (!movie.poster_path || movie.poster_path.trim() === '') return null;

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
      displayRating = rating.replace("%", "");
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
      <div
        className={`flex items-center px-1.5 py-0.5 rounded text-xs ${colorClass} bg-opacity-20`}
      >
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
          {rottenTomatoesRating &&
            getRatingBadge(rottenTomatoesRating, "RT", "bg-red-500")}
          {metacriticRating &&
            getRatingBadge(metacriticRating, "MC", "bg-green-500")}

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
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                source === "cache" || source === "omdb"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-500 text-white"
              }`}
            >
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

export default MovieCard;
