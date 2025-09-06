import { useDispatch } from "react-redux";
import { options } from "../util/constants";
import { addPopularTVShows } from "../util/tvShowsSlice";
import { useEffect } from "react";

const usePopularTVShows = () => {
  const dispatch = useDispatch();

  const getPopularTVShows = async () => {
    try {
      const data = await fetch(
        "https://api.themoviedb.org/3/tv/popular?page=1",
        options
      );
      const json = await data.json();
      dispatch(addPopularTVShows(json.results));
    } catch (error) {
      console.error("Error fetching popular TV shows:", error);
    }
  };

  useEffect(() => {
    getPopularTVShows();
  }, []);
};

export default usePopularTVShows;
