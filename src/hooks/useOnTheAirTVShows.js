import { useDispatch } from "react-redux";
import { options } from "../util/constants";
import { addOnTheAirTVShows } from "../util/tvShowsSlice";
import { useEffect } from "react";

const useOnTheAirTVShows = () => {
  const dispatch = useDispatch();

  const getOnTheAirTVShows = async () => {
    try {
      const data = await fetch(
        "https://api.themoviedb.org/3/tv/on_the_air?page=1",
        options
      );
      const json = await data.json();
      dispatch(addOnTheAirTVShows(json.results));
    } catch (error) {
      console.error("Error fetching on the air TV shows:", error);
    }
  };

  useEffect(() => {
    getOnTheAirTVShows();
  }, []);
};

export default useOnTheAirTVShows;
