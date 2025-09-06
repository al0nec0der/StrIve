import { useDispatch } from "react-redux";
import { options } from "../util/constants";
import { addTopRatedTVShows } from "../util/tvShowsSlice";
import { useEffect } from "react";

const useTopRatedTVShows = () => {
  const dispatch = useDispatch();

  const getTopRatedTVShows = async () => {
    try {
      const data = await fetch(
        "https://api.themoviedb.org/3/tv/top_rated?page=1",
        options
      );
      const json = await data.json();
      dispatch(addTopRatedTVShows(json.results));
    } catch (error) {
      console.error("Error fetching top rated TV shows:", error);
    }
  };

  useEffect(() => {
    getTopRatedTVShows();
  }, []);
};

export default useTopRatedTVShows;
