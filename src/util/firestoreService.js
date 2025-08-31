

import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase"; 

/**
 * Adds or updates a media item in a user's specific list in Firestore.
 * @param {string} userId - The UID of the user from Firebase Auth.
 * @param {string} listName - The name of the collection (e.g., "watchlist", "watched").
 * @param {object} mediaItem - The movie or TV show object to save.
 */
export const addToList = async (userId, listName, mediaItem) => {
  try {

    const itemRef = doc(db, "users", userId, listName, String(mediaItem.id));

    await setDoc(itemRef, mediaItem);
    console.log(
      `Successfully added ${mediaItem.title} to ${listName} for user ${userId}`
    );
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};
