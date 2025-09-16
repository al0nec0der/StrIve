import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Star, Flame, Play, Calendar } from "lucide-react";

const SecondaryContainer = () => {
  const movies = useSelector((store) => store.movies);
  const navigate = useNavigate();

  if (!movies.nowPlayingMovies) return null;

  const MovieCard = ({ movie }) => {
    if (!movie.poster_path) return null;

    const handleMovieClick = () => {
      console.log(
        `Selected movie: ${movie.original_title} (TMDB ID: ${movie.id})`
      );
      // Navigate to the movie detail page
      navigate(`/movie/${movie.id}`);
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

          {/* Rating badge */}
          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
            <Star className="w-3 h-3 mr-1 text-yellow-400 fill-yellow-400" />
            {movie.vote_average.toFixed(1)}
          </div>
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
        <h2 className="text-white text-2xl font-bold mb-4 px-12 flex items-center gap-2">
          {icon}
          {title}
        </h2>
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
