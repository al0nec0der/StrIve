import { useEffect } from "react";
import { addtrailer } from "../util/moviesSlice";
import { useDispatch } from "react-redux";
import { options } from "../util/constants";

const useMovieTrailer = (movieID) => {
  const dispatch = useDispatch();
  const getMovieVideos = async () => {
    const data = await fetch(
      "https://api.themoviedb.org/3/movie/" +
        movieID +
        "/videos?language=en-US",
      options
    );
    const json = await data.json();
    // console.log(json);

    const filterData = json.results.filter((video) => video.type === "Trailer");
    const trailer = filterData.length ? filterData[0] : json.results[0];
    // console.log(trailer);
    dispatch(addtrailer(trailer));
  };
  useEffect(() => {
    getMovieVideos();
  }, []);
};


export default useMovieTrailer;