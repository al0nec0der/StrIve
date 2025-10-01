/**
 * Test script to verify OMDb API access with key rotation
 */
import OmdbService from './omdbService';
import { OMDB_API_KEYS } from './constants';

const testOmdb = async () => {
  console.log('Testing OMDb API access with available keys...');
  console.log(`Available API keys: ${OMDB_API_KEYS.length}`);
  console.log(`Keys: ${OMDB_API_KEYS.map(key => key.substring(0, 3) + '...')}`);

  if (OMDB_API_KEYS.length === 0) {
    console.error('No API keys available in constants.js');
    return;
  }

  // Test with a known movie
  const testImdbId = 'tt0111161'; // The Shawshank Redemption
  
  for (let i = 0; i < OMDB_API_KEYS.length; i++) {
    const key = OMDB_API_KEYS[i];
    console.log(`\\n--- Testing with API key ${i + 1}: ${key.substring(0, 3)}... ---`);
    
    try {
      // Create an OmdbService instance with this key
      const service = new OmdbService(key);
      
      // Test fetching data
      console.log(`Fetching data for IMDb ID: ${testImdbId}`);
      const data = await service.fetchByImdbId(testImdbId);
      
      console.log('Success! Received data:');
      console.log(`Title: ${data.title}`);
      console.log(`Year: ${data.year}`);
      console.log(`IMDb Rating: ${data.imdbRating}`);
      console.log(`Ratings:`, data.ratings);
      
      // If successful, break out of the loop
      console.log(`\\nSuccessfully fetched data with API key ${i + 1}`);
      break;
    } catch (error) {
      console.error(`API key ${i + 1} failed:`, error.message);
      
      // If this was the last key, log the final error
      if (i === OMDB_API_KEYS.length - 1) {
        console.error('\\nAll API keys failed. Please check your API keys in the .env file.');
      }
    }
  }
};

// Run the test
testOmdb();