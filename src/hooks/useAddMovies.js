import { useDispatch } from "react-redux";
import { options } from "../util/constants";
import { addNowPlayingMovies } from "../util/moviesSlice"; // Fixed import
import { useEffect } from "react";

const useAddMovies = () => {
  const dispatch = useDispatch();

  const getmovies = async () => {
    try {
      const data = await fetch(
        "https://api.themoviedb.org/3/movie/now_playing?page=1",
        options
      );
      const json = await data.json();
      dispatch(addNowPlayingMovies(json.results)); // Fixed dispatch
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  useEffect(() => {
    getmovies();
  }, []);
};

export default useAddMovies;
