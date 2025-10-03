import React from "react";
import { useSelector } from "react-redux";
import Header from "./Header";
import MovieCard from "./MovieCard";
import usePopularMovies from "../hooks/usePopularMovies";
import useTopRatedMovies from "../hooks/useTopRatedMovies";
import useUpcomingMovies from "../hooks/useUpcomingMovies";
import { Star, Flame, Calendar, Play } from "lucide-react";

const MoviesPage = () => {
  const movies = useSelector((store) => store.movies);

  // Fetch movies data
  usePopularMovies();
  useTopRatedMovies();
  useUpcomingMovies();

  const MovieList = ({ title, movies, icon }) => {
    if (!movies || movies.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="text-white text-2xl font-bold mb-4 px-12 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <div className="flex overflow-x-scroll scrollbar-hide px-12 pb-4">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <div className="pt-20 pb-8 px-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Play className="w-12 h-12 text-red-500" />
            Movies
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover amazing movies from around the world. Watch your favorites
            anytime, anywhere.
          </p>
        </div>
      </div>

      {/* Movie Lists */}
      <div className="relative bg-black pb-20">
        <MovieList
          title="Popular Movies"
          movies={movies.popularMovies}
          icon={<Flame className="w-6 h-6 text-orange-500" />}
        />
        <MovieList
          title="Top Rated"
          movies={movies.topRatedMovies}
          icon={<Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />}
        />
        <MovieList
          title="Upcoming"
          movies={movies.upcomingMovies}
          icon={<Calendar className="w-6 h-6 text-blue-400" />}
        />
      </div>
    </div>
  );
};

export default MoviesPage;