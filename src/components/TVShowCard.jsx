import React from "react";
import { useNavigate } from "react-router-dom";
import { IMG_CDN_URL } from "../util/constants";
import { Star, Play, Tv } from "lucide-react";

const TVShowCard = ({ tvShow }) => {
  const navigate = useNavigate();

  // If a TV show has no poster, we won't render anything for it.
  if (!tvShow.poster_path) return null;

  const handleClick = () => {
    console.log(`Selected TV Show: ${tvShow.name} (TMDB ID: ${tvShow.id})`);
    // Navigate to the TV show detail page
    navigate(`/shows/${tvShow.id}`);
  };

  return (
    <div
      className="flex-none w-48 mr-4 cursor-pointer group transition-all duration-300 relative"
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

        {/* TMDB Rating Badge */}
        <div className="absolute top-2 right-2">
          {tvShow.vote_average ? (
            <div className="flex items-center bg-blue-600/90 text-white text-xs px-2 py-1 rounded">
              <Star className="w-3 h-3 mr-1 text-blue-300 fill-blue-300" />
              <span>{tvShow.vote_average.toFixed(1)}</span>
            </div>
          ) : null}
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
    </div>
  );
};

export default TVShowCard;