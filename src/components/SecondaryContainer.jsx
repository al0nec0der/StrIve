import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Star, Flame, Play, Calendar, RotateCcw } from "lucide-react";


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
          

        </div>
        

        
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