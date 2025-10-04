import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getList, removeFromList } from "./firestoreService";

export const fetchWatchlist = createAsyncThunk(
  "lists/fetchWatchlist",
  async (userId, { rejectWithValue }) => {
    try {
      const watchlist = await getList(userId, "watchlist");
      return watchlist;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const removeItemFromWatchlist = createAsyncThunk(
  "lists/removeItemFromWatchlist",
  async ({ userId, mediaId }, { rejectWithValue }) => {
    try {
      await removeFromList(userId, "watchlist", mediaId);
      return mediaId; // Return the ID of the removed item
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const listsSlice = createSlice({
  name: "lists",
  initialState: {
    watchlist: { items: [], status: "idle", error: null },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Watchlist
      .addCase(fetchWatchlist.pending, (state) => {
        state.watchlist.status = "loading";
      })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.watchlist.status = "succeeded";
        state.watchlist.items = action.payload;
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.watchlist.status = "failed";
        state.watchlist.error = action.payload;
      })
      // Remove Item from Watchlist
      .addCase(removeItemFromWatchlist.pending, (state) => {
        // Optionally, you can set a specific status for removal
        state.watchlist.status = "loading";
      })
      .addCase(removeItemFromWatchlist.fulfilled, (state, action) => {
        state.watchlist.status = "succeeded";
        state.watchlist.items = state.watchlist.items.filter(
          (item) => item.id !== action.payload
        );
      })
      .addCase(removeItemFromWatchlist.rejected, (state, action) => {
        state.watchlist.status = "failed";
        // You might want to handle removal errors differently
        state.watchlist.error = action.payload;
      });
  },
});

export default listsSlice.reducer;
