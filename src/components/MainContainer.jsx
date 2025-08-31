import React from "react";
import { useSelector } from "react-redux";
import PosterTitle from "./PosterTitle";
import PosterBackground from "./PosterBackground";

const MainContainer = () => {
  const movies = useSelector((state) => state.movies.movies);
  if (!movies || movies.length === 0) return null;


  const movie = movies[Math.floor(Math.random() * movies.length)];
  const { original_title, overview, id } = movie;
  return (
    <div>
      <PosterTitle movie={movie} />
      <PosterBackground movieID={id} />
    </div>
  );
};

export default MainContainer;
