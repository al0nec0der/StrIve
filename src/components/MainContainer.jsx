import React from "react";
import { useSelector } from "react-redux";
import PosterTitle from "./PosterTitle";
import PosterBackground from "./PosterBackground";

const MainContainer = () => {
  const movies = useSelector((state) => state.movies.movies);
  if (!movies) return null;

  if (!movies) return null;

  const movie = movies[Math.floor(Math.random() * movies.length)];
  const { original_title, overview, id } = movie;
  return (
    <div>
      <PosterTitle title={original_title} overview={overview} />
      <PosterBackground movieID={id} />
    </div>
  );
};

export default MainContainer;
