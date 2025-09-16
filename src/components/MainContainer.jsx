import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import PosterTitle from "./PosterTitle";
import PosterBackground from "./PosterBackground";

const MainContainer = () => {
  const movies = useSelector((state) => state.movies.nowPlayingMovies);
  const navigate = useNavigate();
  
  if (!movies || movies.length === 0) return null;

  const movie = movies[Math.floor(Math.random() * movies.length)];
  const { original_title, overview, id } = movie;

  // Function to navigate to movie details
  const handleViewDetails = () => {
    navigate(`/movie/${id}`);
  };

  return (
    <div className="relative w-full h-screen">
      {" "}
      {/* Fixed: Added proper container */}
      <PosterBackground movieID={id} />
      {/* Pass the navigate function to PosterTitle */}
      <PosterTitle movie={movie} onViewDetails={handleViewDetails} />
    </div>
  );
};

export default MainContainer;
