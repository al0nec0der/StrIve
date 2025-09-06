import { createSlice } from "@reduxjs/toolkit";

const tvShowsSlice = createSlice({
  name: "tvShows",
  initialState: {
    popularTVShows: null,
    topRatedTVShows: null,
    onTheAirTVShows: null,
    tvShowDetails: null,
    tvShowSeasons: null,
    selectedSeason: 1,
  },
  reducers: {
    addPopularTVShows: (state, action) => {
      state.popularTVShows = action.payload;
    },
    addTopRatedTVShows: (state, action) => {
      state.topRatedTVShows = action.payload;
    },
    addOnTheAirTVShows: (state, action) => {
      state.onTheAirTVShows = action.payload;
    },
    setTVShowDetails: (state, action) => {
      state.tvShowDetails = action.payload;
    },
    setTVShowSeasons: (state, action) => {
      state.tvShowSeasons = action.payload;
    },
    setSelectedSeason: (state, action) => {
      state.selectedSeason = action.payload;
    },
  },
});

export const {
  addPopularTVShows,
  addTopRatedTVShows,
  addOnTheAirTVShows,
  setTVShowDetails,
  setTVShowSeasons,
  setSelectedSeason,
} = tvShowsSlice.actions;

export default tvShowsSlice.reducer;
