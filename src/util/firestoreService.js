

import {
  doc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Adds or updates a media item in a user's specific list in Firestore.
 * @param {string} userId - The UID of the user from Firebase Auth.
 * @param {string} listName - The name of the collection (e.g., "watchlist", "watched").
 * @param {object} mediaItem - The movie or TV show object to save.
 */
export const addToList = async (userId, listName, mediaItem) => {
  try {
    const itemToSave = {
      id: mediaItem.id,
      title: mediaItem.title || mediaItem.name,
      poster_path: mediaItem.poster_path,
      release_date: mediaItem.release_date || mediaItem.first_air_date,
      vote_average: mediaItem.vote_average,
      media_type: mediaItem.media_type || (mediaItem.first_air_date ? 'tv' : 'movie'),
      dateAdded: new Date().toISOString(),
    };
    const itemRef = doc(db, "users", userId, listName, String(mediaItem.id));
    await setDoc(itemRef, itemToSave);
    console.log(
      `Successfully added ${itemToSave.title} to ${listName}`
    );
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

/**
 * Fetches all items from a user's specific list in Firestore.
 * @param {string} userId - The UID of the user.
 * @param {string} listName - The name of the list (e.g., "watchlist").
 * @returns {Promise<Array>} - A promise that resolves to an array of media items.
 */
export const getList = async (userId, listName) => {
  try {
    const listCollectionRef = collection(db, "users", String(userId), String(listName));
    const querySnapshot = await getDocs(listCollectionRef);
    try {
      const list = querySnapshot.docs.map((doc) => doc.data());
      return list;
    } catch (error) {
      console.error("Error parsing documents: ", error);
      return []; // Return empty list if parsing fails
    }
  } catch (error) {
    console.error("Error fetching list: ", error);
    throw error;
  }
};

/**
 * Removes a media item from a user's specific list in Firestore.
 * @param {string} userId - The UID of the user.
 * @param {string} listName - The name of the list (e.g., "watchlist").
 * @param {string|number} mediaId - The ID of the media item to remove.
 */
export const removeFromList = async (userId, listName, mediaId) => {
  try {
    const itemRef = doc(db, "users", userId, listName, String(mediaId));
    await deleteDoc(itemRef);
    console.log(`Successfully removed item ${mediaId} from ${listName}`);
  } catch (error) {
    console.error("Error removing document: ", error);
    throw error;
  }
};
