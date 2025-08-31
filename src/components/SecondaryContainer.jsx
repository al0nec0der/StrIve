import React from "react";
import { useSelector } from "react-redux";

const SecondaryContainer = () => {
  const movies = useSelector((store) => store.movies);

  if (!movies.nowPlayingMovies) return null;

  const MovieCard = ({ movie }) => {
    if (!movie.poster_path) return null;

    return (
      <div className="flex-none w-48 mr-4 cursor-pointer group">
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.original_title}
          className="w-full h-72 object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
        />
        <h3 className="text-white text-sm mt-2 truncate">
          {movie.original_title}
        </h3>
      </div>
    );
  };

  const MovieList = ({ title, movies }) => {
    if (!movies) return null;

    return (
      <div className="mb-8">
        <h2 className="text-white text-2xl font-bold mb-4 px-12">{title}</h2>
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
      {" "}
      {/* Added proper spacing */}
      <MovieList title="Now Playing" movies={movies.nowPlayingMovies} />
      <MovieList title="Popular" movies={movies.popularMovies} />
      <MovieList title="Top Rated" movies={movies.topRatedMovies} />
      <MovieList title="Upcoming" movies={movies.upcomingMovies} />
    </div>
  );
};

export default SecondaryContainer;
