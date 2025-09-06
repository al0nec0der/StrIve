import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { RiveStreamingService } from "../util/riveService";
import { addToList } from "../util/firestoreService";

const TVShowPlayer = ({ tvShow, episode, season, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [streamingUrl, setStreamingUrl] = useState("");
  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const [isAddedToWatched, setIsAddedToWatched] = useState(false);

  const user = useSelector((store) => store.user.user);
  const iframeRef = useRef(null);

  // Get alternative TV streaming servers
  const alternativeServers = [
    {
      name: "Rive TV",
      url: `https://rivestream.org/embed?type=tv&id=${tvShow.id}&s=${season}&e=${episode.episode_number}`,
    },
    {
      name: "2Embed TV",
      url: `https://www.2embed.to/embed/tmdb/tv?id=${tvShow.id}&s=${season}&e=${episode.episode_number}`,
    },
    {
      name: "MultiEmbed TV",
      url: `https://multiembed.mov/directstream.php?video_id=${tvShow.id}&tmdb=1&s=${season}&e=${episode.episode_number}`,
    },
  ];

  useEffect(() => {
    const loadEpisodeStream = async () => {
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
          `Loading ${currentServer.name}: ${tvShow.name} S${season}E${episode.episode_number} - ${episode.name}`
        );
        console.log(`Stream URL: ${currentServer.url}`);

        setStreamingUrl(currentServer.url);

        setTimeout(() => {
          setIsLoading(false);
        }, 2000);

        // Auto-add to watched list after 30 seconds
        setTimeout(() => {
          if (user && !isAddedToWatched) {
            handleAddToWatched();
          }
        }, 30000);
      } catch (error) {
        console.error("Error loading episode stream:", error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadEpisodeStream();
  }, [tvShow.id, season, episode.episode_number, user, currentServerIndex]);

  const handleAddToWatched = async () => {
    if (!user || isAddedToWatched) return;

    try {
      const watchedItem = {
        id: `${tvShow.id}_S${season}E${episode.episode_number}`,
        tvShowId: tvShow.id,
        title: `${tvShow.name} - S${season}E${episode.episode_number}`,
        episodeName: episode.name,
        poster_path: tvShow.poster_path,
        still_path: episode.still_path,
        overview: episode.overview,
        air_date: episode.air_date,
        season_number: season,
        episode_number: episode.episode_number,
        watched_at: new Date().toISOString(),
        type: "tv_episode",
      };

      await addToList(user.uid, "watched", watchedItem);
      setIsAddedToWatched(true);
      console.log(
        `Added ${tvShow.name} S${season}E${episode.episode_number} to watched list`
      );
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
          <div className="text-green-500 text-6xl mb-4">🔒</div>
          <h2 className="text-white text-2xl mb-4">Login Required</h2>
          <p className="text-gray-300 mb-6">
            Please log in to watch TV shows and episodes
          </p>
          <button
            onClick={onClose}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold"
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
        {/* Header */}
        <div className="flex justify-between items-center mb-2 md:mb-4 bg-gray-900/80 p-3 rounded-lg">
          <div className="flex-1">
            <h1 className="text-white text-lg md:text-2xl font-bold truncate">
              {tvShow.name} - S{season}E{episode.episode_number}
            </h1>
            <h2 className="text-gray-300 text-md md:text-lg truncate">
              {episode.name}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-300 mt-1">
              <span>{episode.air_date}</span>
              <span>⭐ {episode.vote_average}/10</span>
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
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>

            <button
              onClick={handleFullScreen}
              className="text-white hover:text-yellow-400 p-2 rounded bg-gray-700/50 hover:bg-gray-600"
              title="Fullscreen"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            </button>

            <button
              onClick={onClose}
              className="text-white hover:text-red-400 text-2xl font-bold p-2 rounded bg-gray-700/50 hover:bg-gray-600"
              title="Close Player"
            >
              ×
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative w-full h-5/6 bg-gray-900 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
                <div className="mt-4 text-white text-lg">
                  Loading Episode...
                </div>
                <div className="mt-2 text-gray-400 text-sm">
                  S{season}E{episode.episode_number} - {episode.name}
                </div>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center max-w-md">
                <div className="text-green-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-white text-xl mb-2">Streaming Error</h3>
                <p className="text-gray-400 mb-4">
                  Unable to load "{episode.name}" from any server.
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  {tvShow.name} S{season}E{episode.episode_number} • Tried{" "}
                  {currentServerIndex + 1} of {alternativeServers.length}{" "}
                  servers
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
              title={`Streaming ${episode.name}`}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}
        </div>

        {/* Episode Details Panel */}
        <div className="mt-2 md:mt-4 bg-gray-800/80 p-3 md:p-4 rounded-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-2">
                About this episode
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                {episode.overview}
              </p>
            </div>

            <div className="flex flex-col gap-2 min-w-[200px]">
              <div className="text-gray-400 text-sm">
                <span className="text-white font-semibold">Episode:</span> S
                {season}E{episode.episode_number}
              </div>
              <div className="text-gray-400 text-sm">
                <span className="text-white font-semibold">Runtime:</span>{" "}
                {episode.runtime} minutes
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

export default TVShowPlayer;
