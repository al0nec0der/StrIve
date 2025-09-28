import React, { useState, useRef, useEffect } from "react";
import { RiveStreamingService } from "../util/riveService";
import { addToList } from "../util/firestoreService";
import {
  Star,
  RotateCw,
  X,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import useRequireAuth from "../hooks/useRequireAuth";

const MoviePlayer = () => {
  const { movieId } = useParams();
  const [movieDetails, setMovieDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [streamingUrl, setStreamingUrl] = useState("");
  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const [isAddedToWatched, setIsAddedToWatched] = useState(false);

  const user = useRequireAuth();
  const iframeRef = useRef(null);
  const navigate = useNavigate();

  const alternativeServers = RiveStreamingService.getAlternativeServers(movieId);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization:
                "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4Y2E2MDQ4ZDM4ZjJkN2Y5Y2ZmMjU4Y2IzZGQwN2YxMyIsInN1YiI6IjY1Y2EwMWYxYmYwZjYzMDE4NTI4YjYxOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.3bAx3yP-j_30K3YxMv0C3n-Hi0hH6hr_i_n5p_gJ1YI",
            },
          }
        );
        const data = await response.json();
        setMovieDetails(data);
      } catch (error) {
        console.error("Error fetching movie details:", error);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  useEffect(() => {
    if (!user) return; // If user is null (due to authentication redirect), don't proceed
    
    const loadMovieStream = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const currentServer = alternativeServers[currentServerIndex];
        console.log(
          `Loading ${currentServer.name}: ${movieDetails?.original_title} (TMDB ID: ${movieId})`
        );
        console.log(`Stream URL: ${currentServer.url}`);

        setStreamingUrl(currentServer.url);

        setTimeout(() => {
          setIsLoading(false);
        }, 2000);

        setTimeout(() => {
          if (!isAddedToWatched) {
            handleAddToWatched();
          }
        }, 30000);
      } catch (error) {
        console.error("Error loading movie stream:", error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    if (movieDetails) {
      loadMovieStream();
    }
  }, [movieDetails, user, currentServerIndex]);

  const handleAddToWatched = async () => {
    if (!user || isAddedToWatched) return;

    try {
      const watchedItem = {
        id: movieId,
        title: movieDetails.original_title,
        poster_path: movieDetails.poster_path,
        overview: movieDetails.overview,
        release_date: movieDetails.release_date,
        vote_average: movieDetails.vote_average,
        watched_at: new Date().toISOString(),
        type: "movie",
      };

      await addToList(user.uid, "watched", watchedItem);
      setIsAddedToWatched(true);
      console.log(`Added ${movieDetails.original_title} to watched list`);
    } catch (error) {
      console.error("Error adding to watched list:", error);
    }
  };

  const handleTryNextServer = () => {
    if (currentServerIndex < alternativeServers.length - 1) {
      setCurrentServerIndex(currentServerIndex + 1);
    }
  };

  const handleTryPrevServer = () => {
    if (currentServerIndex > 0) {
      setCurrentServerIndex(currentServerIndex - 1);
    }
  };

  // If user is not authenticated, the hook has already redirected
  // If still rendering here, the user is authenticated
  if (!user) return null; // Safety check

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="w-full h-full max-w-6xl bg-gray-900 rounded-lg shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-3 bg-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/movie/${movieId}`)}
              className="text-white hover:text-red-400 p-2 rounded-full bg-gray-700/50 hover:bg-gray-600"
              title="Go Back"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-white text-xl font-bold truncate">
                {movieDetails?.original_title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span>{movieDetails?.release_date?.split("-")[0]}</span>
                <span className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-400" />
                  {movieDetails?.vote_average}/10
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTryPrevServer}
              disabled={currentServerIndex === 0}
              className="text-white hover:text-blue-400 p-2 rounded-full bg-gray-700/50 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous Server"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="bg-green-600 px-3 py-1 rounded text-xs text-white">
              Source: {alternativeServers[currentServerIndex]?.name}
            </span>
            <button
              onClick={handleTryNextServer}
              disabled={currentServerIndex >= alternativeServers.length - 1}
              className="text-white hover:text-blue-400 p-2 rounded-full bg-gray-700/50 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next Server"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative w-full h-[calc(100%-64px)] bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
                <div className="mt-4 text-white text-lg">Loading movie...</div>
                <div className="mt-2 text-gray-400 text-sm">
                  Connecting to {alternativeServers[currentServerIndex]?.name}{" "}
                  servers
                </div>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="text-red-500 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                  </svg>
                </div>
                <h3 className="text-white text-xl mb-2">Streaming Error</h3>
                <p className="text-gray-400 mb-4">
                  Unable to load "{movieDetails?.original_title}" from any
                  server.
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  TMDB ID: {movieId} • Tried {currentServerIndex + 1} of{" "}
                  {alternativeServers.length} servers
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded mr-2"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => navigate(`/movie/${movieId}`)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !hasError && streamingUrl && (
            <iframe
              ref={iframeRef}
              src={streamingUrl}
              className="w-full h-full border-0"
              title={`Streaming ${movieDetails?.original_title}`}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MoviePlayer;