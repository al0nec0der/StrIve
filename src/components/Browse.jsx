import useAddMovies from "../hooks/useAddMovies";
import usePopularMovies from "../hooks/usePopularMovies";
import useTopRatedMovies from "../hooks/useTopRatedMovies";
import useUpcomingMovies from "../hooks/useUpcomingMovies";
import usePopularTVShows from "../hooks/usePopularTVShows";
import useTopRatedTVShows from "../hooks/useTopRatedTVShows";
import useOnTheAirTVShows from "../hooks/useOnTheAirTVShows";
import Header from "./Header";
import MainContainer from "./MainContainer";
import SecondaryContainer from "./SecondaryContainer";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Tv, Star, Flame, Radio, Play } from "lucide-react";

const Browse = () => {
  useAddMovies();
  usePopularMovies();
  useTopRatedMovies();
  useUpcomingMovies();
  usePopularTVShows();
  useTopRatedTVShows();
  useOnTheAirTVShows();

  const navigate = useNavigate();
  const movies = useSelector((store) => store.movies);
  const tvShows = useSelector((store) => store.tvShows);

  const MediaList = ({ title, items, icon, type }) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="text-white text-2xl font-bold mb-4 px-12 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <div className="flex overflow-x-scroll scrollbar-hide px-12 pb-4">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="flex-none w-48 mr-4 cursor-pointer"
              onClick={() => {
                // Navigate to the appropriate page based on type
                if (type === 'tv') {
                  navigate(`/shows/${item.id}`);
                } else {
                  navigate(`/movie/${item.id}`);
                }
              }}
            >
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={
                    item.poster_path
                      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                      : "/placeholder-poster.jpg"
                  }
                  alt={type === "movie" ? item.title : item.name}
                  className="w-full h-72 object-cover hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-all duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white text-sm font-medium truncate">
                      {type === "movie" ? item.title : item.name}
                    </h3>
                    <p className="text-gray-300 text-xs">
                      {type === "movie" 
                        ? item.release_date?.split("-")[0] 
                        : item.first_air_date?.split("-")[0]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black min-h-screen">
      <Header />
      <MainContainer />
      
      {/* Popular Movies Section */}
      <MediaList
        title="Popular Movies"
        items={movies.popularMovies}
        icon={<Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />}
        type="movie"
      />
      
      {/* Top Rated Movies Section */}
      <MediaList
        title="Top Rated Movies"
        items={movies.topRatedMovies}
        icon={<Play className="w-6 h-6 text-red-500" />}
        type="movie"
      />
      
      {/* Upcoming Movies Section */}
      <MediaList
        title="Upcoming Movies"
        items={movies.upcomingMovies}
        icon={<Flame className="w-6 h-6 text-orange-500" />}
        type="movie"
      />
      
      {/* On The Air TV Shows Section */}
      <MediaList
        title="On The Air TV Shows"
        items={tvShows.onTheAirTVShows}
        icon={<Radio className="w-6 h-6 text-red-500" />}
        type="tv"
      />
      
      {/* Popular TV Shows Section */}
      <MediaList
        title="Popular TV Shows"
        items={tvShows.popularTVShows}
        icon={<Flame className="w-6 h-6 text-orange-500" />}
        type="tv"
      />
      
      {/* Top Rated TV Shows Section */}
      <MediaList
        title="Top Rated TV Shows"
        items={tvShows.topRatedTVShows}
        icon={<Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />}
        type="tv"
      />
    </div>
  );
};

export default Browse;
