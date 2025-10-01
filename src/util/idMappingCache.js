/**
 * ID Mapping Cache
 * Uses localStorage for TMDB-to-IMDb ID relationships with 7-day expiration and LRU eviction
 */

// Constants
const CACHE_KEY_PREFIX = 'tmdb_imdb_mapping_';
const EXPIRATION_DAYS = 7;
const MAX_CACHE_ENTRIES = 1000; // Maximum number of entries to keep in cache
const CACHE_INFO_KEY = 'tmdb_imdb_mapping_info'; // Key to store cache metadata

/**
 * Get the cache key for a specific TMDB ID and media type
 * @param {string} tmdbId - The TMDB ID
 * @param {string} mediaType - The media type ('movie' or 'tv')
 * @returns {string} The cache key
 */
function getCacheKey(tmdbId, mediaType) {
  return `${CACHE_KEY_PREFIX}${mediaType}_${tmdbId}`;
}

/**
 * Check if a cache entry is still valid (not expired)
 * @param {Object} cachedItem - The cached item with timestamp
 * @returns {boolean} True if the cache is still valid
 */
function isCacheValid(cachedItem) {
  if (!cachedItem || !cachedItem.timestamp) {
    return false;
  }
  
  const now = Date.now();
  const expirationTime = EXPIRATION_DAYS * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  return (now - cachedItem.timestamp) < expirationTime;
}

/**
 * Get cache info (metadata about the cache)
 * @returns {Object} Cache info object
 */
function getCacheInfo() {
  const info = JSON.parse(localStorage.getItem(CACHE_INFO_KEY) || 'null');
  return info || {
    createdAt: Date.now(),
    lastAccessed: Date.now(),
    accessCount: 0,
    totalSets: 0
  };
}

/**
 * Update cache info (metadata about the cache)
 * @param {Object} updates - Updates to apply to the cache info
 */
function updateCacheInfo(updates) {
  const info = getCacheInfo();
  Object.assign(info, updates, {
    lastAccessed: Date.now()
  });
  localStorage.setItem(CACHE_INFO_KEY, JSON.stringify(info));
}

/**
 * Get all cache keys that belong to this cache system
 * @returns {Array} Array of cache keys
 */
function getAllCacheKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Clean up expired entries from the cache
 * @returns {number} Number of entries removed
 */
function cleanupExpiredEntries() {
  const keys = getAllCacheKeys();
  let removedCount = 0;

  for (const key of keys) {
    try {
      const item = JSON.parse(localStorage.getItem(key));
      if (!isCacheValid(item)) {
        localStorage.removeItem(key);
        removedCount++;
      }
    } catch (e) {
      // If we can't parse the cached item, remove it
      localStorage.removeItem(key);
      removedCount++;
    }
  }

  return removedCount;
}

/**
 * Implement LRU eviction if cache size exceeds MAX_CACHE_ENTRIES
 * @returns {number} Number of entries removed
 */
function lruEviction() {
  const keys = getAllCacheKeys();
  
  if (keys.length <= MAX_CACHE_ENTRIES) {
    return 0; // No eviction needed
  }

  // Sort keys by access time (LRU)
  const keyedItems = keys.map(key => {
    try {
      const item = JSON.parse(localStorage.getItem(key));
      return {
        key,
        lastAccessed: item.lastAccessed || item.timestamp || 0,
        size: JSON.stringify(item).length
      };
    } catch (e) {
      // If we can't parse, treat as least recently used
      return {
        key,
        lastAccessed: 0,
        size: 0
      };
    }
  });

  // Sort by least recently accessed first
  keyedItems.sort((a, b) => a.lastAccessed - b.lastAccessed);

  // Remove entries until we're under the limit
  let removedCount = 0;
  const toRemove = keyedItems.slice(0, keys.length - MAX_CACHE_ENTRIES);
  
  for (const item of toRemove) {
    localStorage.removeItem(item.key);
    removedCount++;
  }

  return removedCount;
}

/**
 * Set a mapping in the cache
 * @param {string} tmdbId - The TMDB ID
 * @param {string} imdbId - The IMDb ID
 * @param {string} mediaType - The media type ('movie' or 'tv')
 */
export function setMapping(tmdbId, imdbId, mediaType = 'movie') {
  // Validate inputs
  if (!tmdbId || !mediaType) {
    throw new Error('TMDB ID and media type are required');
  }

  // Clean up expired entries before setting new ones
  cleanupExpiredEntries();

  const cacheKey = getCacheKey(tmdbId, mediaType);
  
  // Create the cache entry with current timestamp and access tracking
  const cacheEntry = {
    tmdbId,
    imdbId,
    mediaType,
    timestamp: Date.now(),
    lastAccessed: Date.now()
  };

  // Store the mapping
  localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

  // Update cache info
  const info = getCacheInfo();
  info.totalSets = (info.totalSets || 0) + 1;
  localStorage.setItem(CACHE_INFO_KEY, JSON.stringify(info));

  // Perform LRU eviction if needed
  lruEviction();
}

/**
 * Get a mapping from the cache
 * @param {string} tmdbId - The TMDB ID
 * @param {string} mediaType - The media type ('movie' or 'tv')
 * @returns {string|null} The IMDb ID or null if not found/expired
 */
export function getMapping(tmdbId, mediaType = 'movie') {
  if (!tmdbId || !mediaType) {
    throw new Error('TMDB ID and media type are required');
  }

  const cacheKey = getCacheKey(tmdbId, mediaType);
  
  try {
    const cachedItem = JSON.parse(localStorage.getItem(cacheKey));
    
    if (!cachedItem) {
      // Update cache stats
      updateCacheInfo({ accessCount: (getCacheInfo().accessCount || 0) + 1 });
      return null;
    }

    if (!isCacheValid(cachedItem)) {
      // Remove expired entry
      localStorage.removeItem(cacheKey);
      
      // Update cache stats
      updateCacheInfo({ accessCount: (getCacheInfo().accessCount || 0) + 1 });
      return null;
    }

    // Update last accessed time
    cachedItem.lastAccessed = Date.now();
    localStorage.setItem(cacheKey, JSON.stringify(cachedItem));

    // Update cache stats
    updateCacheInfo({ accessCount: (getCacheInfo().accessCount || 0) + 1 });
    return cachedItem.imdbId;
  } catch (e) {
    console.error(`Error getting mapping for ${mediaType}:${tmdbId}`, e);
    
    // Update cache stats
    updateCacheInfo({ accessCount: (getCacheInfo().accessCount || 0) + 1 });
    return null;
  }
}

/**
 * Set multiple mappings in the cache
 * @param {Array} mappingsArray - Array of objects with {tmdbId, imdbId, mediaType}
 */
export function batchSetMappings(mappingsArray) {
  if (!Array.isArray(mappingsArray)) {
    throw new Error('mappingsArray must be an array');
  }

  // Clean up expired entries before setting new ones
  cleanupExpiredEntries();

  for (const mapping of mappingsArray) {
    if (mapping.tmdbId && mapping.imdbId) {
      setMapping(mapping.tmdbId, mapping.imdbId, mapping.mediaType || 'movie');
    } else {
      console.warn('Invalid mapping object:', mapping);
    }
  }

  // Perform LRU eviction after batch operation
  lruEviction();
}

/**
 * Validate the cache structure and content
 * @returns {Object} Validation results
 */
export function validateCache() {
  const keys = getAllCacheKeys();
  let validEntries = 0;
  let expiredEntries = 0;
  let invalidEntries = 0;

  for (const key of keys) {
    try {
      const item = JSON.parse(localStorage.getItem(key));
      if (!item) {
        invalidEntries++;
      } else if (!isCacheValid(item)) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    } catch (e) {
      invalidEntries++;
    }
  }

  return {
    totalEntries: keys.length,
    validEntries,
    expiredEntries,
    invalidEntries,
    isValid: invalidEntries === 0
  };
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  const cacheInfo = getCacheInfo();
  const validation = validateCache();
  
  return {
    ...validation,
    ...cacheInfo,
    hitRate: cacheInfo.accessCount > 0 ? 
      ((validation.validEntries / cacheInfo.accessCount) * 100).toFixed(2) : 0
  };
}

/**
 * Clear the entire ID mapping cache
 * @returns {number} Number of entries cleared
 */
export function clearCache() {
  const keys = getAllCacheKeys();
  const count = keys.length;
  
  for (const key of keys) {
    localStorage.removeItem(key);
  }
  
  // Remove cache info
  localStorage.removeItem(CACHE_INFO_KEY);
  
  return count;
}

/**
 * Clean up expired entries and perform maintenance
 * @returns {Object} Results of cleanup operations
 */
export function cleanup() {
  const expiredRemoved = cleanupExpiredEntries();
  const evicted = lruEviction();
  
  return {
    expiredRemoved,
    evicted,
    totalRemoved: expiredRemoved + evicted
  };
}