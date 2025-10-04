import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, Play, Trash2 } from "lucide-react";

const MovieCard = ({ movie, onRemove }) => {
  const navigate = useNavigate();

  if (!movie.poster_path || movie.poster_path.trim() === "") return null;

  const handleCardClick = () => {
    const isTVShow = movie.media_type === "tv" || movie.first_air_date;
    if (isTVShow) {
      navigate(`/shows/${movie.id}`);
    } else {
      navigate(`/movie/${movie.id}`);
    }
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation(); // Prevent card click event
    if (onRemove) {
      onRemove(movie);
    }
  };

  return (
    <div
      className="flex-none w-48 mr-4 cursor-pointer group transition-all duration-300"
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden rounded-lg">
        <img
          src={
            movie.poster_path.startsWith("http")
              ? movie.poster_path
              : `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          }
          alt={movie.title || movie.name}
          className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
        />

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

        {onRemove && (
            <div 
                className="absolute top-2 right-2 bg-red-600 p-2 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemoveClick}
            >
                <Trash2 className="w-4 h-4 text-white" />
            </div>
        )}

        <div className="absolute top-2 left-2">
          <div className="flex items-center px-2 py-1 bg-blue-500 bg-opacity-30 rounded text-xs">
            <Star className="w-3 h-3 mr-1 text-blue-300 fill-blue-300" />
            <span>{movie.vote_average?.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <h3 className="text-white text-sm font-medium truncate group-hover:text-red-400 transition-colors">
          {movie.title || movie.name}
        </h3>
        <p className="text-gray-400 text-xs">
          {
            (movie.release_date || movie.first_air_date)?.split("-")[0]
          } • {movie.media_type === 'tv' || movie.first_air_date ? 'TV' : 'Movie'}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;