import { useDispatch } from "react-redux";
import { options } from "../util/constants";
import { addMovies } from "../util/moviesSlice";
import { useEffect } from "react";

const useAddMovies = () => {
    const dispatch = useDispatch();

    //fetching the data from api and update the hook
    const getmovies = async () => {
      const data = await fetch(
        "https://api.themoviedb.org/3/movie/now_playing?page=1",
        options
      );

      const json = await data.json();
      console.log(json.results);
      dispatch(addMovies(json.results));
    };

    useEffect(() => {
      getmovies();
    }, []);

}


export default useAddMovies;