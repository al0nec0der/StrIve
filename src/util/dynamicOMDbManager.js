/**
 * Dynamic OMDb API Key Management System
 * 
 * A fully dynamic system that automatically detects and uses however many keys are available
 * without any code changes.
 */

class DynamicOMDbManager {
  constructor() {
    this.keys = [];
    this.currentKeyIndex = 0;
    this.dailyQuota = 1000; // Standard daily quota per key
    this.quotaExceededKeys = new Set(); // Track keys that have exceeded their quota
    
    // Initialize the system by discovering available keys
    this.initialize();
  }

  /**
   * Auto-Discovery Function
   * Dynamically detects all available OMDb API keys in environment variables
   * with strict validation
   */
  discoverAvailableKeys() {
    const allPossibleKeys = [];
    let keyIndex = 1;
    
    // Use try-catch to handle environments where import.meta.env might not be available
    try {
      // Dynamically check for VITE_OMDB_KEY_1, VITE_OMDB_KEY_2, etc.
      console.log("Starting to discover available OMDb API keys...");
      while (import.meta.env && import.meta.env[`VITE_OMDB_KEY_${keyIndex}`]) {
        const keyValue = import.meta.env[`VITE_OMDB_KEY_${keyIndex}`];
        console.log(`Discovered VITE_OMDB_KEY_${keyIndex}: ${keyValue ? 'present' : 'not present'}`);
        
        // Validation rules:
        // (a) value is truthy
        // (b) trimmed
        // (c) Remove strict validation for key format - allow any non-empty string
        // (d) not containing the substring "YOUR_"
        const trimmedKey = keyValue ? keyValue.trim() : '';
        const hasPlaceholderSubstring = trimmedKey.includes('YOUR_');
        
        console.log(`Validating key ${keyIndex}: value=${trimmedKey}, hasPlaceholder=${hasPlaceholderSubstring}`);
        if (trimmedKey && !hasPlaceholderSubstring) {
          allPossibleKeys.push({
            index: keyIndex,
            key: trimmedKey,
            dailyUsage: 0,
            maxDailyUsage: this.dailyQuota,
            isActive: true,
            deactivatedUntil: null  // For tracking 401 errors
          });
          console.log(`Added key ${keyIndex} to available keys list`);
        } else {
          console.warn(`Ignoring invalid OMDb key at VITE_OMDB_KEY_${keyIndex} (format mismatch or placeholder)`);
        }
        
        keyIndex++;
      }
      
      // Also check the legacy keys (VITE_OMDB_API_KEY, VITE_OMDB_API_KEY2, etc.)
      const legacyKeys = ['VITE_OMDB_API_KEY', 'VITE_OMDB_API_KEY2', 'VITE_OMDB_API_KEY3', 'VITE_OMDB_API_KEY4'];
      for (const legacyKey of legacyKeys) {
        if (import.meta.env[legacyKey] && import.meta.env[legacyKey] !== 'YOUR_MAIN_OMDB_API_KEY_HERE' && 
            import.meta.env[legacyKey] !== 'YOUR_SECOND_OMDB_API_KEY_HERE' && 
            import.meta.env[legacyKey] !== 'YOUR_THIRD_OMDB_API_KEY_HERE' && 
            import.meta.env[legacyKey] !== 'YOUR_FOURTH_OMDB_API_KEY_HERE') {
          const keyValue = import.meta.env[legacyKey];
          const trimmedKey = keyValue ? keyValue.trim() : '';
          const hasPlaceholderSubstring = trimmedKey.includes('YOUR_');
          
          if (trimmedKey && !hasPlaceholderSubstring) {
            allPossibleKeys.push({
              index: `legacy-${legacyKey}`, // Mark as legacy
              key: trimmedKey,
              dailyUsage: 0,
              maxDailyUsage: this.dailyQuota,
              isActive: true,
              deactivatedUntil: null  // For tracking 401 errors
            });
            console.log(`Added legacy key ${legacyKey} to available keys list`);
          }
        }
      }
    } catch (error) {
      console.warn("Environment variables not accessible, skipping key discovery:", error.message);
    }
    
    return allPossibleKeys;
  }

  /**
   * Initialize the manager by discovering available keys
   */
  initialize() {
    this.keys = this.discoverAvailableKeys();
    
    // Create a masked representation of the keys for logging
    const maskedKeys = this.keys.map(key => this.maskKey(key.key));
    console.log(`Discovered ${this.keys.length} keys: [${maskedKeys.join(', ')}]`);
  }
  
  /**
   * Mask the middle of the key for logging (e.g., ab1234cd becomes ab...cd)
   */
  maskKey(key) {
    if (key.length < 5) return key; // If key is too short, return as is
    return `${key.substring(0, 2)}...${key.substring(key.length - 2)}`;
  }

  /**
   * Get the total daily quota across all available keys
   */
  getTotalDailyQuota() {
    return this.keys.length * this.dailyQuota;
  }

  /**
   * Check if a key has exceeded its daily quota
   */
  isKeyExhausted(key) {
    return key.dailyUsage >= key.maxDailyUsage;
  }

  /**
   * Update key usage (call this after each API request)
   */
  updateKeyUsage(apiKey) {
    const key = this.keys.find(k => k.key === apiKey);
    if (key) {
      key.dailyUsage++;
      // Mark as exhausted if quota is reached
      if (this.isKeyExhausted(key)) {
        key.isActive = false;
        this.quotaExceededKeys.add(key.key);
        console.log(`Key ${key.index} has reached its daily quota`);
      }
    }
  }
  
  /**
   * Mark a key as inactive due to 401 error until UTC midnight
   */
  markKeyInactiveFor401(apiKey) {
    const key = this.keys.find(k => k.key === apiKey);
    if (key) {
      // Calculate time until next UTC midnight
      const now = new Date();
      const utcMidnight = new Date(now);
      utcMidnight.setUTCHours(24, 0, 0, 0); // Set to next midnight
      
      key.deactivatedUntil = utcMidnight.getTime();
      key.isActive = false;
      console.log(`Key ${key.index} deactivated due to 401 error. Will be reactivated at UTC midnight.`);
    }
  }
  
  /**
   * Check if a key is currently deactivated due to 401 error
   */
  isKeyDeactivatedFor401(key) {
    if (key.deactivatedUntil === null) {
      return false;
    }
    
    // Check if current time has passed the deactivation time
    if (Date.now() >= key.deactivatedUntil) {
      // Reactivate the key
      key.deactivatedUntil = null;
      key.isActive = true;
      console.log(`Key ${key.index} reactivated after UTC midnight.`);
      return false;
    }
    
    return true;
  }

  /**
   * Get the next available active key using round-robin
   */
  getNextActiveKey() {
    if (this.keys.length === 0) {
      throw new Error('No OMDb API keys available');
    }

    // Filter for active keys, considering both quota and 401 deactivation
    const activeKeys = this.keys.filter(key => 
      key.isActive && 
      !this.quotaExhaustedKeys.has(key.key) && 
      !this.isKeyDeactivatedFor401(key)
    );
    
    if (activeKeys.length === 0) {
      throw new Error('All OMDb API keys have exceeded their daily quota or are deactivated due to errors');
    }

    // Find the next active key in round-robin fashion
    let attempts = 0;
    const totalActiveKeys = activeKeys.length;
    
    while (attempts < totalActiveKeys) {
      const currentKey = this.keys[this.currentKeyIndex % this.keys.length];
      
      // Update the index for the next request
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
      
      // Check if this key is active, not quota-exhausted, and not 401-deactivated
      if (currentKey.isActive && 
          !this.quotaExhaustedKeys.has(currentKey.key) && 
          !this.isKeyDeactivatedFor401(currentKey)) {
        return currentKey.key;
      }
      
      attempts++;
    }
    
    // If we've exhausted all active keys in this iteration
    throw new Error('No active keys available for use');
  }

  /**
   * Get current usage statistics
   */
  getUsageStats() {
    const activeKeys = this.keys.filter(key => 
      key.isActive && 
      !this.quotaExceededKeys.has(key.key) && 
      !this.isKeyDeactivatedFor401(key)
    );
    
    return {
      totalKeys: this.keys.length,
      activeKeys: activeKeys.length,
      totalDailyQuota: this.getTotalDailyQuota(),
      usedQuota: this.keys.reduce((total, key) => total + key.dailyUsage, 0),
      remainingQuota: this.getTotalDailyQuota() - this.keys.reduce((total, key) => total + key.dailyUsage, 0)
    };
  }

  /**
   * Reset daily usage for all keys (typically done at the start of each day)
   */
  resetDailyUsage() {
    this.keys.forEach(key => {
      key.dailyUsage = 0;
      key.isActive = true;
    });
    this.quotaExceededKeys.clear();
    console.log('Daily usage for all keys has been reset');
  }

  /**
   * Get a key by its index for direct access (useful for debugging)
   */
  getKeyByIndex(index) {
    const key = this.keys.find(k => k.index === index);
    return key ? key.key : null;
  }
}

// Create a singleton instance
const dynamicOMDbManager = new DynamicOMDbManager();

export default dynamicOMDbManager;

// Export the class constructor as well if needed elsewhere
export { DynamicOMDbManager };