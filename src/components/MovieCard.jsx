import React from "react";
import { IMG_CDN_URL } from "../util/constants";

const MovieCard = ({ posterPath }) => {
  // If a movie has no poster, we won't render anything for it.
  if (!posterPath) return null;

  return (
    <div className="w-48 pr-4">
      <img alt="Movie Card" src={IMG_CDN_URL + posterPath} />
    </div>
  );
};

export default MovieCard;
