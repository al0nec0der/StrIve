import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Utility function to get the next OMDb API key using a round-robin approach
 * It tracks the last used key index in Firestore and increments it for round-robin distribution
 * Make sure to set the OMDb API keys using: firebase functions:config:set omdb.key1="your_key1" omdb.key2="your_key2" omdb.key3="your_key3" omdb.key4="your_key4"
 * @returns A promise that resolves to the next API key to use
 */
export const getNextApiKey = async (): Promise<string> => {
  try {
    // Get the API keys from environment variables
    const keys = [
      functions.config().omdb.key1,
      functions.config().omdb.key2,
      functions.config().omdb.key3,
      functions.config().omdb.key4
    ];

    // Validate that all keys exist
    if (keys.some(key => !key)) {
      throw new Error('One or more OMDb API keys are missing from environment variables');
    }

    // Get the current counter from Firestore
    const counterDoc = admin.firestore().collection('metadata').doc('apiCounters');
    const doc = await counterDoc.get();

    let nextIndex = 0;
    if (doc.exists) {
      // If document exists, get the current index and increment it
      const currentIndex = doc.data()?.lastUsedIndex || 0;
      nextIndex = (currentIndex + 1) % keys.length; // Round-robin: cycle back to 0 after last index
    }

    // Update the counter to the new index
    await counterDoc.set({
      lastUsedIndex: nextIndex,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Return the API key at the calculated index
    return keys[nextIndex] as string;
  } catch (error) {
    functions.logger.error('Error getting next API key:', error);
    throw error;
  }
};