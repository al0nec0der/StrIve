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
    <div className="absolute inset-0 flex items-center justify-start z-20">
      <div className="ml-12 max-w-lg">
        {" "}
        {/* Better positioning and max width */}
        <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-2xl mb-4">
          {original_title}
        </h1>
        <p className="text-lg text-gray-200 mb-8 leading-relaxed drop-shadow-lg">
          {overview}
        </p>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-8 py-3 bg-white text-black text-xl font-semibold rounded hover:bg-gray-200 transition-colors">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </button>
          <button
            onClick={handleAddToWatchlist}
            className="flex items-center gap-2 px-8 py-3 bg-gray-600/80 text-white text-xl font-semibold rounded hover:bg-gray-500/80 transition-colors"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            My List
          </button>
        </div>
      </div>
    </div>
  );
};

export default PosterTitle;
