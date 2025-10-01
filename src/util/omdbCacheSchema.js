/**
 * Firestore Cache Schema for OMDb Ratings
 * Defines the structure of the 'omdb_ratings' collection and its documents
 */

/**
 * OMDb Ratings Cache Schema
 * 
 * Collection: omdb_ratings
 * Document ID: IMDb ID in format tt1234567
 * 
 * Fields:
 * - imdbRating: String - The IMDb rating (e.g., "8.0")
 * - rottenTomatoesRating: String - Rotten Tomatoes rating (e.g., "95%")
 * - metacriticRating: String - Metacritic rating (e.g., "82/100")
 * - awards: String - Awards information
 * - plot: String - Plot summary
 * - genre: Array of Strings - Genres of the movie/show
 * - imdbVotes: String - Number of votes on IMDb (e.g., "1,234,567")
 * - cachedAt: Firestore Timestamp - When the data was cached
 * - tmdbId: String - TMDB ID for reverse lookup
 * - source: String - Source of the data (e.g., 'omdb')
 */

const omdbRatingSchema = {
  /**
   * Sample document structure for omdb_ratings collection
   * Document ID: tt1234567 (IMDb ID format)
   */
  imdbRating: '8.0',                    // The IMDb rating
  rottenTomatoesRating: '95%',          // Rotten Tomatoes rating
  metacriticRating: '82/100',           // Metacritic rating
  awards: 'Won 4 Oscars. 150 wins & 196 nominations.', // Awards information
  plot: 'A thief who steals corporate secrets...',     // Plot summary
  genre: ['Action', 'Crime', 'Drama'],   // Array of genres
  imdbVotes: '1,234,567',               // Number of IMDb votes
  cachedAt: '2023-01-01T00:00:00.000Z', // Timestamp when cached (in ISO format)
  tmdbId: '157336',                     // TMDB ID for reverse lookup
  source: 'omdb'                        // Source of the data
};

/**
 * Firestore Indexes Configuration
 * 
 * For efficient querying, create these indexes in Firestore:
 * 
 * 1. Single-field index on tmdbId (for reverse lookups)
 * 2. Single-field index on cachedAt (for time-based queries)
 * 3. Composite index on [tmdbId, cachedAt] (for combined queries)
 * 
 * These indexes will enable efficient queries such as:
 * - Get ratings by tmdbId
 * - Get ratings newer than a certain date
 * - Get ratings by tmdbId that are newer than a certain date
 */
const firestoreIndexes = [
  {
    collection: 'omdb_ratings',
    fields: [
      { fieldPath: 'tmdbId', mode: 'ASCENDING' }
    ],
    queryScope: 'COLLECTION'
  },
  {
    collection: 'omdb_ratings',
    fields: [
      { fieldPath: 'cachedAt', mode: 'ASCENDING' }
    ],
    queryScope: 'COLLECTION'
  },
  {
    collection: 'omdb_ratings',
    fields: [
      { fieldPath: 'tmdbId', mode: 'ASCENDING' },
      { fieldPath: 'cachedAt', mode: 'DESCENDING' }
    ],
    queryScope: 'COLLECTION'
  }
];

/**
 * Utility function to validate a rating document against the schema
 * @param {Object} ratingDoc - The rating document to validate
 * @returns {boolean} - Whether the document matches the schema
 */
function validateOmdbRatingSchema(ratingDoc) {
  const requiredFields = [
    'imdbRating',
    'rottenTomatoesRating', 
    'metacriticRating',
    'awards',
    'plot',
    'genre',
    'imdbVotes',
    'cachedAt',
    'tmdbId',
    'source'
  ];
  
  // Check if all required fields exist
  for (const field of requiredFields) {
    if (!(field in ratingDoc)) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }
  
  // Validate field types
  if (typeof ratingDoc.imdbRating !== 'string') {
    console.error('imdbRating must be a string');
    return false;
  }
  
  if (typeof ratingDoc.rottenTomatoesRating !== 'string') {
    console.error('rottenTomatoesRating must be a string');
    return false;
  }
  
  if (typeof ratingDoc.metacriticRating !== 'string') {
    console.error('metacriticRating must be a string');
    return false;
  }
  
  if (typeof ratingDoc.awards !== 'string') {
    console.error('awards must be a string');
    return false;
  }
  
  if (typeof ratingDoc.plot !== 'string') {
    console.error('plot must be a string');
    return false;
  }
  
  if (!Array.isArray(ratingDoc.genre)) {
    console.error('genre must be an array');
    return false;
  }
  
  if (typeof ratingDoc.imdbVotes !== 'string') {
    console.error('imdbVotes must be a string');
    return false;
  }
  
  // Note: For cachedAt, we can't validate timestamp type here as it might be a Date object
  // or a Firestore timestamp depending on how it's retrieved
  
  if (typeof ratingDoc.tmdbId !== 'string') {
    console.error('tmdbId must be a string');
    return false;
  }
  
  if (typeof ratingDoc.source !== 'string') {
    console.error('source must be a string');
    return false;
  }
  
  return true;
}

/**
 * Utility function to create a properly formatted rating document
 * @param {Object} data - The rating data to format
 * @returns {Object} - A properly formatted rating document
 */
function createRatingDocument(data) {
  return {
    imdbRating: data.imdbRating || null,
    rottenTomatoesRating: data.rottenTomatoesRating || null,
    metacriticRating: data.metacriticRating || null,
    awards: data.awards || '',
    plot: data.plot || '',
    genre: Array.isArray(data.genre) ? data.genre : [],
    imdbVotes: data.imdbVotes || '',
    cachedAt: data.cachedAt || new Date(),
    tmdbId: data.tmdbId || '',
    source: data.source || 'omdb'
  };
}

// Export the schema definition, indexes, and utility functions
export {
  omdbRatingSchema,
  firestoreIndexes,
  validateOmdbRatingSchema,
  createRatingDocument
};

// Export default for easy import
export default {
  omdbRatingSchema,
  firestoreIndexes,
  validateOmdbRatingSchema,
  createRatingDocument
};