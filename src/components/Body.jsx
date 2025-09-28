import { createBrowserRouter } from "react-router-dom";
import Browse from "./Browse";
import Login from "./Login";
import TVShows from "./TVShows";
import MoviesPage from "./MoviesPage";
import MovieDetails from "./MovieDetails";
import MoviePlayer from "./MoviePlayer";
import TVShowDetails from "./TVShowDetails";
import ProtectedRoute from "./ProtectedRoute";
import { RouterProvider } from "react-router-dom";
import Footer from "./Footer";

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
      element: (
        <ProtectedRoute>
          <MoviesPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/shows",
      element: (
        <ProtectedRoute>
          <TVShows />
        </ProtectedRoute>
      ),
    },
    {
      path: "/search",
      element: (
        <ProtectedRoute>
          <SearchResultsPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/movie/:movieId",
      element: <MovieDetails />,
    },
    {
      path: "/movie/:movieId/play",
      element: (
        <ProtectedRoute>
          <MoviePlayer />
        </ProtectedRoute>
      ),
    },
    {
      path: "/tv/:tvId/:season/:episode",
      element: (
        <ProtectedRoute>
          <TVShowDetails />
        </ProtectedRoute>
      ),
    },
  ]);

  return (
    <div>
      <RouterProvider router={appRouter} />
      <Footer />
    </div>
  );
};

export default Body;
