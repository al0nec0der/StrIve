import React from "react";
import { useSelector } from "react-redux";
import PosterTitle from "./PosterTitle";
import PosterBackground from "./PosterBackground";

const MainContainer = () => {
  const movies = useSelector((state) => state.movies.nowPlayingMovies);
  if (!movies || movies.length === 0) return null;

  const movie = movies[Math.floor(Math.random() * movies.length)];
  const { original_title, overview, id } = movie;

  return (
    <div className="relative w-full h-screen">
      {" "}
      {/* Fixed: Added proper container */}
      <PosterBackground movieID={id} />
      <PosterTitle movie={movie} />
    </div>
  );
};

export default MainContainer;
