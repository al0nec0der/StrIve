import React from "react";
import { useSelector } from "react-redux"; 
import { addToList } from "../util/firestoreService"; 

const PosterTitle = ({ movie }) => {

  const user = useSelector((store) => store.user.user);

  
  const { id, original_title, overview, poster_path } = movie;

  const handleAddToWatchlist = () => {
    if (!user) {
      alert("Please log in to add movies to your watchlist.");
      return;
    }

    const mediaItem = { id, title: original_title, poster_path, overview };
    addToList(user.uid, "watchlist", mediaItem);
    alert(`${mediaItem.title} added to your watchlist!`);
  };

  return (
    <div className="absolute inset-0 flex items-center text-left text-white z-20">
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
      <div className="relative left-10 max-w-2xl p-8">
        <h1 className="text-6xl font-extrabold drop-shadow-lg">
          {original_title}
        </h1>
        <p className="mt-4 text-lg font-medium text-gray-300 leading-relaxed">
          {overview}
        </p>
        <div className="mt-6 flex gap-6">
          <button className="px-12 py-4 text-2xl bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-xl">
            ▶ Play
          </button>
          <button
            onClick={handleAddToWatchlist}
            className="px-12 py-4 text-2xl bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg shadow-xl"
          >
            + Add to Watchlist
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosterTitle;
