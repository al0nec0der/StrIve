
import useAddMovies from "../hooks/useAddMovies";
import usePopularMovies from "../hooks/usePopularMovies"; // <-- Import
import useTopRatedMovies from "../hooks/useTopRatedMovies"; // <-- Import
import useUpcomingMovies from "../hooks/useUpcomingMovies"; // <-- Import
import Header from "./Header";
import MainContainer from "./MainContainer";
import SecondaryContainer from "./SecondaryContainer";

const Browse = () => {
  useAddMovies();
  usePopularMovies();    // <-- Call hook
  useTopRatedMovies();   // <-- Call hook
  useUpcomingMovies();   // <-- Call hook

  return (
    <div>
      <Header />
      <MainContainer />
      <SecondaryContainer />
    </div>
  );
};

export default Browse;

;
