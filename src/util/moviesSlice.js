import { createSlice } from "@reduxjs/toolkit";


const moviesSlice = createSlice({
  name: "movies",
  initialState: {
    nowPlayingMovies: null, // Changed from 'movies'
    popularMovies: null,      // Added
    topRatedMovies: null,     // Added
    upcomingMovies: null,     // Added
    trailer: null,
  },
  reducers: {
    addNowPlayingMovies: (state, action) => { // Changed from addMovies
      state.nowPlayingMovies = action.payload;
    },
    addPopularMovies: (state, action) => {   // Added
      state.popularMovies = action.payload;
    },
    addTopRatedMovies: (state, action) => {  // Added
      state.topRatedMovies = action.payload;
    },
    addUpcomingMovies: (state, action) => { // Added
      state.upcomingMovies = action.payload;
    },
    addtrailer: (state, action) => {
      state.trailer = action.payload;
    },
  },
});


export const { addNowPlayingMovies, addPopularMovies, addTopRatedMovies, addUpcomingMovies, addtrailer } = moviesSlice.actions;
export default moviesSlice.reducer;

