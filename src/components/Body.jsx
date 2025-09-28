import { createBrowserRouter } from "react-router-dom";
import Browse from "./Browse";
import Login from "./Login";
import TVShows from "./TVShows";
import MoviesPage from "./MoviesPage";
import MovieDetails from "./MovieDetails";
import MoviePlayer from "./MoviePlayer";
import TVShowDetails from "./TVShowDetails";
import { RouterProvider } from "react-router-dom";
import Footer from "./Footer";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../util/firebase";
import { useDispatch } from "react-redux";
import { login, logout } from "../util/userSlice";

// Create simple component placeholders for Search page
const SearchResultsPage = () => (
  <div className="bg-black min-h-screen pt-20">
    <div className="px-12 py-8">
      <h1 className="text-5xl font-bold text-white mb-8">Search Results</h1>
      <p className="text-gray-300 text-xl">Search results will appear here</p>
    </div>
  </div>
);

const Body = () => {
  const dispatch = useDispatch();

  const appRouter = createBrowserRouter([
    {
      path: "/",
      element: <Browse />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/movies",
      element: <MoviesPage />,
    },
    {
      path: "/shows",
      element: <TVShows />,
    },
    {
      path: "/search",
      element: <SearchResultsPage />,
    },
    {
      path: "/movie/:movieId",
      element: <MovieDetails />,
    },
    {
        path: "/movie/:movieId/play",
        element: <MoviePlayer />,
      },
      {
        path: "/tv/:tvId",
        element: <TVShowDetails />,
      },
  ]);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const { uid, email, displayName } = user;
        dispatch(login({ uid: uid, email: email, name: displayName }));
      } else {
        dispatch(logout());
      }
    });
  }, []);

  return (
    <div>
      <RouterProvider router={appRouter} />
      <Footer />
    </div>
  );
};

export default Body;
