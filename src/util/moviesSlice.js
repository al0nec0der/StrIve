import { createSlice } from "@reduxjs/toolkit";

const moviesSlice = createSlice({
  name: "movies",
  initialState: {
    nowPlayingMovies: null,
    popularMovies: null,
    topRatedMovies: null,
    upcomingMovies: null,
    trailer: null, // <-- This was missing
    ratings: {}, // Add ratings property to store movie ratings
  },
  reducers: {
    addNowPlayingMovies: (state, action) => {
      state.nowPlayingMovies = action.payload;
    },
    addPopularMovies: (state, action) => {
      state.popularMovies = action.payload;
    },
    addTopRatedMovies: (state, action) => {
      state.topRatedMovies = action.payload;
    },
    addUpcomingMovies: (state, action) => {
      state.upcomingMovies = action.payload;
    },
    // This reducer was missing
    addtrailer: (state, action) => {
      state.trailer = action.payload;
    },
    // Add reducer to update ratings
    updateRatings: (state, action) => {
      // action.payload should be an object with tmdbId as key and ratingData as value
      state.ratings = {
        ...state.ratings,
        ...action.payload
      };
    },
  },
});

// We must also export the new 'addtrailer' action
export const {
  addNowPlayingMovies,
  addPopularMovies,
  addTopRatedMovies,
  addUpcomingMovies,
  addtrailer, // <-- This was missing
  updateRatings, // Export the new action
} = moviesSlice.actions;

export default moviesSlice.reducer;
