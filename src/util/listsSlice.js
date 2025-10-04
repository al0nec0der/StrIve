import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  getList, 
  removeFromList, 
  createCustomList, 
  deleteCustomList, 
  addItemToCustomList, 
  removeItemFromCustomList, 
  fetchUserLists, 
  fetchListWithItems,
  fetchUserListsWithPreviews
} from "./firestoreService";

// Async thunks for watchlist (existing functionality)
export const fetchWatchlist = createAsyncThunk(
  "lists/fetchWatchlist",
  async (userId, { rejectWithValue }) => {
    try {
      const watchlist = await getList(userId, "watchlist");
      // Return the watchlist with limited items for preview (first 10)
      return watchlist.slice(0, 10);
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

// Async thunks for custom lists
export const fetchLists = createAsyncThunk(
  "lists/fetchLists",
  async (userId, { rejectWithValue }) => {
    try {
      const lists = await fetchUserListsWithPreviews(userId);
      return lists;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const createList = createAsyncThunk(
  "lists/createList",
  async ({ userId, listData }, { rejectWithValue }) => {
    try {
      const newListId = await createCustomList(userId, listData);
      // Return both the new list ID and the original listData to construct the full list object
      return { id: newListId, ...listData, ownerId: userId, createdAt: new Date() };
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const deleteList = createAsyncThunk(
  "lists/deleteList",
  async ({ userId, listId }, { rejectWithValue }) => {
    try {
      await deleteCustomList(userId, listId);
      return listId; // Return the ID of the deleted list
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const addItem = createAsyncThunk(
  "lists/addItem",
  async ({ userId, listId, mediaItem }, { rejectWithValue }) => {
    try {
      await addItemToCustomList(userId, listId, mediaItem);
      return { listId, item: { ...mediaItem, dateAdded: new Date() } }; // Return list ID and the item added
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const removeItem = createAsyncThunk(
  "lists/removeItem",
  async ({ userId, listId, mediaId }, { rejectWithValue }) => {
    try {
      await removeItemFromCustomList(userId, listId, mediaId);
      return { listId, mediaId }; // Return list ID and media ID of the removed item
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

export const fetchActiveList = createAsyncThunk(
  "lists/fetchActiveList",
  async ({ userId, listId }, { rejectWithValue }) => {
    try {
      const listData = await fetchListWithItems(userId, listId);
      return listData;
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

const listsSlice = createSlice({
  name: "lists",
  initialState: {
    watchlist: { items: [], status: "idle", error: null },
    customLists: { lists: [], status: "idle", error: null }, // To hold all of the user's lists
    activeList: { details: null, items: [], status: "idle", error: null } // For the currently viewed list
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
        state.watchlist.error = action.payload;
      })
      // Fetch Lists
      .addCase(fetchLists.pending, (state) => {
        state.customLists.status = "loading";
      })
      .addCase(fetchLists.fulfilled, (state, action) => {
        state.customLists.status = "succeeded";
        state.customLists.lists = action.payload;
      })
      .addCase(fetchLists.rejected, (state, action) => {
        state.customLists.status = "failed";
        state.customLists.error = action.payload;
      })
      // Create List
      .addCase(createList.pending, (state) => {
        state.customLists.status = "loading";
      })
      .addCase(createList.fulfilled, (state, action) => {
        state.customLists.status = "succeeded";
        state.customLists.lists.push(action.payload);
      })
      .addCase(createList.rejected, (state, action) => {
        state.customLists.status = "failed";
        state.customLists.error = action.payload;
      })
      // Delete List
      .addCase(deleteList.pending, (state) => {
        state.customLists.status = "loading";
      })
      .addCase(deleteList.fulfilled, (state, action) => {
        state.customLists.status = "succeeded";
        state.customLists.lists = state.customLists.lists.filter(
          (list) => list.id !== action.payload
        );
      })
      .addCase(deleteList.rejected, (state, action) => {
        state.customLists.status = "failed";
        state.customLists.error = action.payload;
      })
      // Add Item
      .addCase(addItem.pending, (state) => {
        state.activeList.status = "loading";
      })
      .addCase(addItem.fulfilled, (state, action) => {
        state.activeList.status = "succeeded";
        // Only update the active list if it's the same list
        if (state.activeList.details && state.activeList.details.id === action.payload.listId) {
          state.activeList.items.push(action.payload.item);
        }
      })
      .addCase(addItem.rejected, (state, action) => {
        state.activeList.status = "failed";
        state.activeList.error = action.payload;
      })
      // Remove Item
      .addCase(removeItem.pending, (state) => {
        state.activeList.status = "loading";
      })
      .addCase(removeItem.fulfilled, (state, action) => {
        state.activeList.status = "succeeded";
        // Only update the active list if it's the same list
        if (state.activeList.details && state.activeList.details.id === action.payload.listId) {
          state.activeList.items = state.activeList.items.filter(
            (item) => item.id !== action.payload.mediaId
          );
        }
      })
      .addCase(removeItem.rejected, (state, action) => {
        state.activeList.status = "failed";
        state.activeList.error = action.payload;
      })
      // Fetch Active List
      .addCase(fetchActiveList.pending, (state) => {
        state.activeList.status = "loading";
      })
      .addCase(fetchActiveList.fulfilled, (state, action) => {
        state.activeList.status = "succeeded";
        state.activeList.details = action.payload;
        state.activeList.items = action.payload.items || [];
        state.activeList.error = null;
      })
      .addCase(fetchActiveList.rejected, (state, action) => {
        state.activeList.status = "failed";
        state.activeList.error = action.payload;
      });
  },
});

export default listsSlice.reducer;