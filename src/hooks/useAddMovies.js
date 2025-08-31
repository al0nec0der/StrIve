
import { useDispatch } from "react-redux";
import { options } from "../util/constants";

import { addNowPlayingMovies } from "../util/moviesSlice";
import { useEffect } from "react";

const useAddMovies = () => {
  const dispatch = useDispatch();

  const getmovies = async () => {
    const data = await fetch(
      "https://api.themoviedb.org/3/movie/now_playing?page=1",
      options
    );
    const json = await data.json();

    // 2. Change the dispatch to use the new action
    dispatch(addNowPlayingMovies(json.results));
  };

  useEffect(() => {
    getmovies();
  }, []);
};

export default useAddMovies;
