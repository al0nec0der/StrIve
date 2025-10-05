import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as Papa from 'papaparse';
import Busboy from 'busboy';

// Initialize the Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Helper function to escape CSV fields that might contain commas, quotes, or newlines
function escapeCsvField(field: string): string {
  if (field === null || field === undefined) {
    return '';
  }
  
  const fieldStr = String(field);
  
  // If the field contains commas, quotes, or newlines, wrap it in quotes and escape internal quotes
  if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
    return `"${fieldStr.replace(/"/g, '""')}"`;
  }
  
  return fieldStr;
}

/**
 * Exports a user's movie list to CSV format
 * Route: GET /api/lists/{listId}/export
 */
export const exportListToCsv = functions.https.onRequest(async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract the listId from the URL. In Firebase Functions, the URL will be formatted like:
    // https://us-central1-<project-id>.cloudfunctions.net/exportListToCsv?listId=<listId>
    // or we may need to use a specific path pattern
    const listId = req.query.listId as string || req.params.listId;
    
    if (!listId) {
      return res.status(400).json({ error: 'List ID is required' });
    }

    // Get the authenticated user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    let decodedToken;

    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const userId = decodedToken.uid;

    // Check if the user owns the list
    const listRef = db.collection('users').doc(userId).collection('custom_lists').doc(listId);
    const listDoc = await listRef.get();

    if (!listDoc.exists) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Verify that the list belongs to the authenticated user
    const listData = listDoc.data();
    if (!listData || listData.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to access this list' });
    }

    // Fetch all items in the list
    const itemsCollectionRef = db.collection('users').doc(userId).collection('custom_lists').doc(listId).collection('items');
    const itemsSnapshot = await itemsCollectionRef.get();

    if (itemsSnapshot.empty) {
      // Return an empty CSV with headers
      const csvHeaders = 'tmdbId,Name,Year,type\n';
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', `attachment; filename="list-${listId}-export.csv"`);
      return res.status(200).send(csvHeaders);
    }

    // Prepare CSV data
    const csvRows: string[] = [];
    csvRows.push('tmdbId,Name,Year,type'); // CSV headers

    // Process each item in the list
    for (const doc of itemsSnapshot.docs) {
      const item = doc.data();
      
      // Extract the required fields for CSV
      const tmdbId = item.id || '';
      const name = item.title || '';
      const year = item.release_date ? new Date(item.release_date).getFullYear().toString() : '';
      const type = item.media_type || 'movie'; // Default to 'movie' if not specified
      
      csvRows.push([
        escapeCsvField(tmdbId.toString()),
        escapeCsvField(name),
        escapeCsvField(year),
        escapeCsvField(type)
      ].join(','));
    }

    const csvContent = csvRows.join('\n');

    // Set appropriate headers for file download
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="list-${listId}-export.csv"`);
    res.set('Cache-Control', 'no-cache');

    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting list to CSV:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a separate function for the specific URL pattern /lists/{listId}/export
export const listsExport = functions.https.onRequest(async (req, res) => {
  const pathParts = req.path.split('/').filter(part => part !== ''); // Remove empty parts
  
  // Find 'lists' in the path and get the ID that follows
  const listsIndex = pathParts.indexOf('lists');
  if (listsIndex === -1 || listsIndex + 1 >= pathParts.length) {
    return res.status(400).json({ error: 'Invalid URL path. Expected /lists/{listId}/export' });
  }
  
  const listId = pathParts[listsIndex + 1];
  
  // The rest is the same as exportListToCsv but with the extracted listId
  if (!listId) {
    return res.status(400).json({ error: 'List ID is required' });
  }

  // Get the authenticated user
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  let decodedToken;

  try {
    decodedToken = await admin.auth().verifyIdToken(token);
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const userId = decodedToken.uid;

  // Check if the user owns the list
  const listRef = db.collection('users').doc(userId).collection('custom_lists').doc(listId);
  const listDoc = await listRef.get();

  if (!listDoc.exists) {
    return res.status(404).json({ error: 'List not found' });
  }

  // Verify that the list belongs to the authenticated user
  const listData = listDoc.data();
  if (!listData || listData.ownerId !== userId) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to access this list' });
  }

  // Fetch all items in the list
  const itemsCollectionRef = db.collection('users').doc(userId).collection('custom_lists').doc(listId).collection('items');
  const itemsSnapshot = await itemsCollectionRef.get();

  if (itemsSnapshot.empty) {
    // Return an empty CSV with headers
    const csvHeaders = 'tmdbId,Name,Year,type\n';
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="list-${listId}-export.csv"`);
    return res.status(200).send(csvHeaders);
  }

  // Prepare CSV data
  const csvRows: string[] = [];
  csvRows.push('tmdbId,Name,Year,type'); // CSV headers

  // Process each item in the list
  for (const doc of itemsSnapshot.docs) {
    const item = doc.data();
    
    // Extract the required fields for CSV
    const tmdbId = item.id || '';
    const name = item.title || '';
    const year = item.release_date ? new Date(item.release_date).getFullYear().toString() : '';
    const type = item.media_type || 'movie'; // Default to 'movie' if not specified
    
    csvRows.push([
      escapeCsvField(tmdbId.toString()),
      escapeCsvField(name),
      escapeCsvField(year),
      escapeCsvField(type)
    ].join(','));
  }

  const csvContent = csvRows.join('\n');

  // Set appropriate headers for file download
  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', `attachment; filename="list-${listId}-export.csv"`);
  res.set('Cache-Control', 'no-cache');

  return res.status(200).send(csvContent);
});

// Interface for movie data
interface MovieData {
  id: number;
  title: string;
  release_date: string;
  tmdbId: number;
}

// Interface for CSV row
interface CsvRow {
  tmdbId: string;
  Name: string;
  Year: string;
  'Letterboxd URI'?: string;
}

// Interface for analysis result
interface AnalysisResult {
  matched: Array<{
    movie: MovieData;
    originalRow: CsvRow;
  }>;
  unmatched: Array<{
    row: CsvRow;
    reason: string;
  }>;
  duplicates: Array<{
    movie: MovieData;
    originalRow: CsvRow;
  }>;
}

// Mock TMDB API service - in a real implementation, this would call the actual TMDB API
async function findMovieByTmdbId(tmdbId: string): Promise<MovieData | null> {
  // This is a mock implementation that returns a dummy movie if tmdbId is provided
  // In a real implementation, this would make a call to the TMDB API
  if (!tmdbId || isNaN(Number(tmdbId))) {
    return null;
  }
  
  // Return a mock movie object
  return {
    id: parseInt(tmdbId),
    title: `Mock Movie ${tmdbId}`,
    release_date: `2020-01-01`,
    tmdbId: parseInt(tmdbId)
  };
}

async function findMovieByNameAndYear(name: string, year: string): Promise<MovieData | null> {
  // This is a mock implementation for searching by name and year
  // In a real implementation, this would make a call to the TMDB API
  if (!name || !year) {
    return null;
  }
  
  // Return a mock movie object
  return {
    id: 999999, // mock ID
    title: name,
    release_date: `${year}-01-01`,
    tmdbId: 999999
  };
}

/**
 * Analyzes a CSV file for import to a user's movie list
 * Route: POST /api/lists/{listId}/import/analyze
 */
export const analyzeListImport = functions.https.onRequest(async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract the listId from the URL
    const pathParts = req.path.split('/');
    const listsIndex = pathParts.indexOf('lists');
    if (listsIndex === -1 || listsIndex + 1 >= pathParts.length) {
      return res.status(400).json({ error: 'List ID is required in URL' });
    }
    const listId = pathParts[listsIndex + 1];
    
    // Extract import/analyze part to ensure correct path
    const importIndex = pathParts.indexOf('import');
    const analyzeIndex = pathParts.indexOf('analyze');
    
    if (importIndex === -1 || analyzeIndex === -1 || analyzeIndex !== importIndex + 1) {
      return res.status(400).json({ error: 'Invalid URL path. Expected /lists/{listId}/import/analyze' });
    }
    
    if (!listId) {
      return res.status(400).json({ error: 'List ID is required' });
    }

    // Get the authenticated user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    let decodedToken;

    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const userId = decodedToken.uid;

    // Check if the user owns the list
    const listRef = db.collection('users').doc(userId).collection('custom_lists').doc(listId);
    const listDoc = await listRef.get();

    if (!listDoc.exists) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Verify that the list belongs to the authenticated user
    const listData = listDoc.data();
    if (!listData || listData.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to access this list' });
    }

    // Check content type for multipart form data
    const contentType = req.headers['content-type'] || req.headers['Content-Type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    // Use Busboy to parse multipart form data
    const busboy = Busboy({ headers: req.headers });
    let csvBuffer: Buffer | null = null;
    let csvFieldFound = false;

    // Handle uploaded files
    busboy.on('file', (fieldname, file, info) => {
      const { filename, encoding, mimeType } = info;
      
      // Only process CSV files
      if (mimeType === 'text/csv' || filename.endsWith('.csv')) {
        const buffers: Buffer[] = [];
        file.on('data', (data) => {
          buffers.push(data);
        });
        file.on('end', () => {
          csvBuffer = Buffer.concat(buffers);
          csvFieldFound = true;
        });
      } else {
        file.resume(); // Skip non-CSV files
      }
    });

    // Handle finished parsing
    busboy.on('finish', async () => {
      if (!csvFieldFound || !csvBuffer) {
        return res.status(400).json({ error: 'CSV file is required in the request' });
      }

      try {
        // Parse the CSV buffer
        const csvString = csvBuffer.toString('utf8');
        const csvData = Papa.parse(csvString, {
          header: true, // Use first row as column names (equivalent to columns: true)
          skipEmptyLines: true, // Skip empty lines
        }).data;

        if (!Array.isArray(csvData) || csvData.length === 0) {
          return res.status(400).json({ error: 'CSV file is empty or invalid' });
        }

        // Fetch existing items in the target list to check for duplicates
        const itemsCollectionRef = db.collection('users').doc(userId).collection('custom_lists').doc(listId).collection('items');
        const itemsSnapshot = await itemsCollectionRef.get();
        
        const existingItems: { [key: string]: any } = {};
        itemsSnapshot.docs.forEach(doc => {
          const item = doc.data();
          existingItems[item.id] = item; // Using tmdbId as key
        });

        // Initialize result arrays
        const result: AnalysisResult = {
          matched: [],
          unmatched: [],
          duplicates: []
        };

        // Process each row in the CSV
        for (const row of csvData) {
          // Type cast to ensure we have the expected structure
          const csvRow: CsvRow = {
            tmdbId: row.tmdbId || row['tmdbId'] || '',
            Name: row.Name || row['Name'] || '',
            Year: row.Year || row['Year'] || '',
            'Letterboxd URI': row['Letterboxd URI'] || row['Letterboxd URI'] || ''
          };

          // Check for duplicates first
          const isDuplicate = existingItems[csvRow.tmdbId] || 
            Object.values(existingItems).some(item => 
              item.title === csvRow.Name && 
              item.release_date && 
              new Date(item.release_date).getFullYear().toString() === csvRow.Year
            );

          if (isDuplicate) {
            // Find the original movie data from existing items
            const duplicateMovie = existingItems[csvRow.tmdbId] || 
              Object.values(existingItems).find(item => 
                item.title === csvRow.Name && 
                item.release_date && 
                new Date(item.release_date).getFullYear().toString() === csvRow.Year
              );
            
            result.duplicates.push({
              movie: {
                id: duplicateMovie.id,
                title: duplicateMovie.title,
                release_date: duplicateMovie.release_date,
                tmdbId: duplicateMovie.id
              },
              originalRow: csvRow
            });
            continue; // Skip further processing for duplicates
          }

          // Attempt to match the movie using TMDB API
          let matchedMovie: MovieData | null = null;
          
          // First, try to find by tmdbId if available
          if (csvRow.tmdbId && !isNaN(Number(csvRow.tmdbId))) {
            matchedMovie = await findMovieByTmdbId(csvRow.tmdbId);
          }
          
          // If tmdbId lookup failed, try searching by Name and Year
          if (!matchedMovie && csvRow.Name && csvRow.Year) {
            matchedMovie = await findMovieByNameAndYear(csvRow.Name, csvRow.Year);
          }

          if (matchedMovie) {
            result.matched.push({
              movie: matchedMovie,
              originalRow: csvRow
            });
          } else {
            result.unmatched.push({
              row: csvRow,
              reason: 'Movie not found in TMDB'
            });
          }
        }

        // Return the analysis result
        return res.status(200).json(result);
      } catch (parseError) {
        console.error('Error parsing CSV:', parseError);
        return res.status(400).json({ error: 'Invalid CSV format' });
      }
    });

    // Pass the request to Busboy for processing
    req.pipe(busboy);
  } catch (error) {
    console.error('Error analyzing CSV for import:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Confirms the import of selected movies to a user's movie list
 * Route: POST /api/lists/{listId}/import/confirm
 */
export const confirmListImport = functions.https.onRequest(async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract the listId from the URL
    const pathParts = req.path.split('/');
    const listsIndex = pathParts.indexOf('lists');
    if (listsIndex === -1 || listsIndex + 1 >= pathParts.length) {
      return res.status(400).json({ error: 'List ID is required in URL' });
    }
    const listId = pathParts[listsIndex + 1];
    
    // Extract import/confirm part to ensure correct path
    const importIndex = pathParts.indexOf('import');
    const confirmIndex = pathParts.indexOf('confirm');
    
    if (importIndex === -1 || confirmIndex === -1 || confirmIndex !== importIndex + 1) {
      return res.status(400).json({ error: 'Invalid URL path. Expected /lists/{listId}/import/confirm' });
    }
    
    if (!listId) {
      return res.status(400).json({ error: 'List ID is required' });
    }

    // Get the authenticated user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    let decodedToken;

    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const userId = decodedToken.uid;

    // Check if the user owns the list
    const listRef = db.collection('users').doc(userId).collection('custom_lists').doc(listId);
    const listDoc = await listRef.get();

    if (!listDoc.exists) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Verify that the list belongs to the authenticated user
    const listData = listDoc.data();
    if (!listData || listData.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to access this list' });
    }

    // Parse the request body
    const { moviesToImport } = req.body;

    // Validate the request body
    if (!moviesToImport || !Array.isArray(moviesToImport)) {
      return res.status(400).json({ error: 'Request body must contain an array of moviesToImport' });
    }

    if (moviesToImport.length === 0) {
      return res.status(201).json({ 
        success: true, 
        moviesAdded: 0,
        message: 'No movies to import, but request was processed successfully'
      });
    }

    // Fetch the current list's movies again for a final duplicate check
    const itemsCollectionRef = db.collection('users').doc(userId).collection('custom_lists').doc(listId).collection('items');
    const itemsSnapshot = await itemsCollectionRef.get();
    
    const existingItemIds = new Set<string>();
    itemsSnapshot.docs.forEach(doc => {
      const item = doc.data();
      existingItemIds.add(item.id?.toString());
    });

    // Filter out movies that are already in the list
    const moviesToActuallyImport = moviesToImport.filter((tmdbId: string) => !existingItemIds.has(tmdbId.toString()));

    // Add the movies that are not duplicates to the list
    let moviesAddedCount = 0;
    const batch = db.batch();

    for (const tmdbId of moviesToActuallyImport) {
      // Create a new document reference for each movie
      const newItemRef = itemsCollectionRef.doc(tmdbId.toString());
      
      // Get full movie details from TMDB API (in a real implementation)
      // For now, using a mock implementation
      const movieDetails = await findMovieByTmdbId(tmdbId.toString());
      
      if (movieDetails) {
        // Prepare the movie data to store
        const movieData = {
          id: movieDetails.tmdbId,
          title: movieDetails.title,
          release_date: movieDetails.release_date,
          dateAdded: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp
          media_type: 'movie', // Default to movie, could be expanded
        };
        
        batch.set(newItemRef, movieData);
        moviesAddedCount++;
      }
    }

    // Commit all changes in a batch
    if (moviesAddedCount > 0) {
      await batch.commit();
    }

    // Return success response
    return res.status(201).json({ 
      success: true, 
      moviesAdded: moviesAddedCount,
      message: `${moviesAddedCount} movies successfully added to the list`
    });
  } catch (error) {
    console.error('Error confirming list import:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Export all functions for Firebase to recognize them
export { exportListToCsv, listsExport, analyzeListImport, confirmListImport };