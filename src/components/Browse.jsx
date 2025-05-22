import useAddMovies from "../hooks/useaddMovies";
import Header from "./Header";
import MainContainer from "./MainContainer";
import SecondaryContainer from "./SecondaryContainer";

const Browse = () => {
  useAddMovies();
  return (
    <div>

      <Header />
      <MainContainer />
      <SecondaryContainer />
      
      <h1 className="text-3xl font-bold underline">Browse</h1>
    </div>
  );
};

export default Browse;
