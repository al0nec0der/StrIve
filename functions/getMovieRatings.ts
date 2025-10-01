import * as functions from 'firebase-functions';
import * as cors from 'cors';
import * as admin from 'firebase-admin';
import axios from 'axios';
import { getNextApiKey } from './utils/getNextApiKey';

// Initialize the Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize CORS middleware with your React app domain
const corsHandler = cors({
  origin: [
    'http://localhost:3000',  // Default React development server
    // Add your production domain here, e.g.:
    // 'https://your-react-app.firebaseapp.com',
    // 'https://www.yourdomain.com',
  ],
});

export const getMovieRatings = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  corsHandler(req, res, async () => {
    // Extract tmdbId and mediaType from query parameters
    const tmdbId = req.query.tmdbId as string | undefined;
    const mediaType = req.query.mediaType as string | undefined;

    // Validate required parameters
    if (!tmdbId || !mediaType) {
      res.status(400).json({
        error: 'Missing required parameters: tmdbId and mediaType are required',
        requiredParameters: {
          tmdbId: 'The TMDb ID of the movie or TV show',
          mediaType: 'Either "movie" or "tv"'
        }
      });
      return;
    }

    // Validate mediaType is either 'movie' or 'tv'
    if (mediaType !== 'movie' && mediaType !== 'tv') {
      res.status(400).json({
        error: 'Invalid mediaType parameter: must be either "movie" or "tv"'
      });
      return;
    }

    try {
      // Check the ratingsCache collection for a document with an ID matching the tmdbId
      const cacheDocRef = admin.firestore().collection('ratingsCache').doc(tmdbId);
      const cacheDoc = await cacheDocRef.get();

      // If the document exists, send its data as the JSON response and log "Cache Hit"
      if (cacheDoc.exists) {
        functions.logger.info('Cache Hit');
        res.status(200).json(cacheDoc.data());
        return;
      }

      // For cache miss scenario:
      // 1. Call the getNextApiKey utility
      const apiKey = await getNextApiKey();

      // 2. Use axios to fetch data from OMDb using the provided TMDB ID
      // First, convert TMDB ID to IMDb ID using TMDB API
      // Note: Make sure to set TMDB API key using: firebase functions:config:set tmdb.key="your_tmdb_key"
      let imdbId: string | undefined;
      
      try {
        const tmdbResponse = await axios.get(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${functions.config().tmdb.key}`);
        imdbId = tmdbResponse.data.imdb_id;
      } catch (tmdbError) {
        functions.logger.error('Error fetching from TMDB API:', tmdbError);
        res.status(500).json({ error: 'Failed to fetch data from TMDB API' });
        return;
      }

      if (!imdbId) {
        res.status(404).json({ error: 'IMDb ID not found for this TMDB ID' });
        return;
      }

      // Now fetch ratings data from OMDb using the IMDb ID
      let omdbData;
      try {
        const omdbResponse = await axios.get(`http://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`);
        omdbData = omdbResponse.data;

        if (omdbData.Response === 'False') {
          res.status(404).json({ error: omdbData.Error || 'Movie/TV show not found in OMDb' });
          return;
        }
      } catch (omdbError) {
        functions.logger.error('Error fetching from OMDb API:', omdbError);
        res.status(500).json({ error: 'Failed to fetch data from OMDb API' });
        return;
      }

      // 3. Save the OMDb JSON response to a Firestore document in the 'ratingsCache' collection
      await cacheDocRef.set({
        ...omdbData,
        cachedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 4. Return the OMDb data as the final response
      res.status(200).json(omdbData);
    } catch (error) {
      functions.logger.error('Error in getMovieRatings function:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});