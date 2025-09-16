// src/components/MoviePlayer.jsx - SIMPLIFIED WITH CORRECT URL
import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { RiveStreamingService } from "../util/riveService";
import { addToList } from "../util/firestoreService";
import { Star, Maximize, RotateCw, X, Lock } from "../components/icons";

const MoviePlayer = ({ movie, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [streamingUrl, setStreamingUrl] = useState("");
  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const [isAddedToWatched, setIsAddedToWatched] = useState(false);

  const user = useSelector((store) => store.user.user);
  const iframeRef = useRef(null);

  // Get alternative servers
  const alternativeServers = RiveStreamingService.getAlternativeServers(
    movie.id
  );

  useEffect(() => {
    const loadMovieStream = async () => {
      if (!user) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);

        const currentServer = alternativeServers[currentServerIndex];
        console.log(
          `Loading ${currentServer.name}: ${movie.original_title} (TMDB ID: ${movie.id})`
        );
        console.log(`Stream URL: ${currentServer.url}`);

        setStreamingUrl(currentServer.url);

        // Give iframe time to load
        setTimeout(() => {
          setIsLoading(false);
        }, 2000);

        // Auto-add to watched list after 30 seconds of viewing
        setTimeout(() => {
          if (user && !isAddedToWatched) {
            handleAddToWatched();
          }
        }, 30000);
      } catch (error) {
        console.error("Error loading movie stream:", error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadMovieStream();
  }, [movie.id, user, currentServerIndex]);

  const handleAddToWatched = async () => {
    if (!user || isAddedToWatched) return;

    try {
      const watchedItem = {
        id: movie.id,
        title: movie.original_title,
        poster_path: movie.poster_path,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        watched_at: new Date().toISOString(),
        type: "movie",
      };

      await addToList(user.uid, "watched", watchedItem);
      setIsAddedToWatched(true);
      console.log(`Added ${movie.original_title} to watched list`);
    } catch (error) {
      console.error("Error adding to watched list:", error);
    }
  };

  const handleTryNextServer = () => {
    if (currentServerIndex < alternativeServers.length - 1) {
      setCurrentServerIndex(currentServerIndex + 1);
    } else {
      setHasError(true);
    }
  };

  const handleFullScreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      } else if (iframeRef.current.webkitRequestFullscreen) {
        iframeRef.current.webkitRequestFullscreen();
      }
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-8 rounded-lg text-center max-w-md">
          <div className="text-red-500 mb-4">
            <Lock className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-white text-2xl mb-4">Login Required</h2>
          <p className="text-gray-300 mb-6">
            Please log in to watch movies and TV shows
          </p>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-98 flex items-center justify-center z-50">
      <div className="w-full h-full max-w-7xl max-h-full p-2 md:p-4">
        {/* Header with movie info and controls */}
        <div className="flex justify-between items-center mb-2 md:mb-4 bg-gray-900/80 p-3 rounded-lg">
          <div className="flex-1">
            <h1 className="text-white text-lg md:text-2xl font-bold truncate">
              {movie.original_title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span>{movie.release_date?.split("-")[0]}</span>
              <span className="flex items-center">
                <Star className="w-4 h-4 mr-1 text-yellow-400" />
                {movie.vote_average}/10
              </span>
              <span className="bg-green-600 px-2 py-1 rounded text-xs">
                Server: {alternativeServers[currentServerIndex]?.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTryNextServer}
              disabled={currentServerIndex >= alternativeServers.length - 1}
              className="text-white hover:text-blue-400 p-2 rounded bg-gray-700/50 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Try Next Server"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            <button
              onClick={handleFullScreen}
              className="text-white hover:text-yellow-400 p-2 rounded bg-gray-700/50 hover:bg-gray-600"
              title="Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>

            <button
              onClick={onClose}
              className="text-white hover:text-red-400 p-2 rounded bg-gray-700/50 hover:bg-gray-600"
              title="Close Player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative w-full h-5/6 bg-gray-900 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
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
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center max-w-md">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <h3 className="text-white text-xl mb-2">Streaming Error</h3>
                <p className="text-gray-400 mb-4">
                  Unable to load "{movie.original_title}" from any server.
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  TMDB ID: {movie.id} • Tried {currentServerIndex + 1} of{" "}
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
                    onClick={onClose}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
                  >
                    Close Player
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
              title={`Streaming ${movie.original_title}`}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}
        </div>

        {/* Movie Details Panel */}
        <div className="mt-2 md:mt-4 bg-gray-800/80 p-3 md:p-4 rounded-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">
                About this movie
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                {movie.overview}
              </p>
            </div>

            <div className="flex flex-col gap-2 min-w-[200px]">
              <div className="text-gray-400 text-sm">
                <span className="text-white font-semibold">TMDB ID:</span>{" "}
                {movie.id}
              </div>
              {isAddedToWatched && (
                <div className="bg-green-600/20 text-green-400 text-sm p-2 rounded">
                  ✅ Added to Watched List
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoviePlayer;
