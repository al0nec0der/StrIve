// src/util/constants.js - UPDATED
export const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: import.meta.env.VITE_TMDB_KEY,
  },
};

export const IMG_CDN_URL = "https://image.tmdb.org/t/p/w500";

// Rive Streaming Configuration
export const RIVE_CONFIG = {
  BASE_URL: "https://rivestream.org/embed",
  FEATURES: {
    RESPONSIVE: true,
    AUTO_QUALITY: true,
    MULTI_SERVER: true,
    DAILY_UPDATES: true,
  },
};
