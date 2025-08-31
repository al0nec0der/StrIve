import { useDispatch } from "react-redux";
import { options } from "../util/constants";
import { addPopularMovies } from "../util/moviesSlice";
import { useEffect } from "react";

const usePopularMovies = () => {
  const dispatch = useDispatch();
  const getPopularMovies = async () => {
    const data = await fetch(
      "https://api.themoviedb.org/3/movie/popular?page=1", // <-- Changed endpoint
      options
    );
    const json = await data.json();
    dispatch(addPopularMovies(json.results)); // <-- Changed action
  };

  useEffect(() => {
    getPopularMovies();
  }, []);
};

export default usePopularMovies;
