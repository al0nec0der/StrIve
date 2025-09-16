import React from "react";
import { useSelector } from "react-redux";
import Header from "./Header";
import TVShowCard from "./TVShowCard";
import usePopularTVShows from "../hooks/usePopularTVShows";
import useTopRatedTVShows from "../hooks/useTopRatedTVShows";
import useOnTheAirTVShows from "../hooks/useOnTheAirTVShows";
import { Radio, Flame, Star, Tv } from "../components/icons";

const TVShows = () => {
  const tvShows = useSelector((store) => store.tvShows);

  // Fetch TV shows data
  usePopularTVShows();
  useTopRatedTVShows();
  useOnTheAirTVShows();

  const TVShowList = ({ title, shows, icon }) => {
    if (!shows || shows.length === 0) return null;

    return (
      <div className="mb-8">
        <h2 className="text-white text-2xl font-bold mb-4 px-12 flex items-center gap-2">
          {icon}
          {title}
        </h2>
        <div className="flex overflow-x-scroll scrollbar-hide px-12 pb-4">
          {shows.map((tvShow) => (
            <TVShowCard
              key={tvShow.id}
              tvShow={tvShow}
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
            <Tv className="w-12 h-12 text-green-500" />
            TV Shows
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover amazing TV series from around the world. Binge-watch your
            favorite shows anytime, anywhere.
          </p>
        </div>
      </div>

      {/* TV Show Lists */}
      <div className="relative bg-black pb-20">
        <TVShowList
          title="On The Air"
          shows={tvShows.onTheAirTVShows}
          icon={<Radio className="w-6 h-6 text-red-500" />}
        />
        <TVShowList
          title="Popular TV Shows"
          shows={tvShows.popularTVShows}
          icon={<Flame className="w-6 h-6 text-orange-500" />}
        />
        <TVShowList
          title="Top Rated"
          shows={tvShows.topRatedTVShows}
          icon={<Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />}
        />
      </div>
    </div>
  );
};

export default TVShows;
