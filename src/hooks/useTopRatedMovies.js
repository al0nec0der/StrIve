import { useDispatch } from "react-redux";
import { options } from "../util/constants";
import { addTopRatedMovies } from "../util/moviesSlice";
import { useEffect } from "react";

const useTopRatedMovies = () => {
  const dispatch = useDispatch();
  const getTopRatedMovies = async () => {
    const data = await fetch(
      "https://api.themoviedb.org/3/movie/top_rated?page=1", // <-- Changed endpoint
      options
    );
    const json = await data.json();
    dispatch(addTopRatedMovies(json.results)); // <-- Changed action
  };

  useEffect(() => {
    getTopRatedMovies();
  }, []);
};

export default useTopRatedMovies;
