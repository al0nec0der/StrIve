import { useSelector } from "react-redux";
import useMovieTrailer from "../hooks/useMovieTrailer";

const PosterBackground = ({ movieID }) => {
  useMovieTrailer(movieID);

  const trailerVideo = useSelector((store) => store.movies.trailer);

  return (
    <div className="relative w-full">
      {/* Background Trailer */}
      <iframe
        className="w-full aspect-video absolute top-0 left-0 z-10"
        src={"https://www.youtube.com/embed/" + trailerVideo?.key}
      ></iframe>

      {/* Dark Overlay for Better Readability */}
      
    </div>
  );
};

export default PosterBackground;
