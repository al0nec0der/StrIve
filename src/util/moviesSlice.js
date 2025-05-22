import { createSlice } from "@reduxjs/toolkit";

const moviesSlice = createSlice({
  name: "movies",
  initialState: {
    movies: null,
    trailer: null,
  },
  reducers: {
    addMovies: (state, action) => {
      state.movies = action.payload;
    },
    addtrailer: (state, action) => {
      state.trailer = action.payload;
    },
  },
});

export const { addMovies , addtrailer } = moviesSlice.actions;
export default moviesSlice.reducer;
