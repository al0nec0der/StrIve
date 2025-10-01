/**
 * Environment Validator Utility
 * Checks if all required OMDb API keys exist in Firebase Functions environment
 */

/**
 * Validates that all required OMDb API keys exist in environment variables
 * @returns {boolean} - True if all keys exist, false otherwise
 */
function validateOmdbApiKeys() {
  // Try to access Firebase Functions config
  let config;
  try {
    const functions = require('firebase-functions');
    config = functions.config();
  } catch (e) {
    console.error('❌ Could not access Firebase Functions config');
    return false;
  }
  
  const requiredKeys = [
    { key: 'omdb.key1', value: config?.omdb?.key1 },
    { key: 'omdb.key2', value: config?.omdb?.key2 },
    { key: 'omdb.key3', value: config?.omdb?.key3 },
    { key: 'omdb.key4', value: config?.omdb?.key4 }
  ];

  const missingKeys = requiredKeys.filter(item => !item.value);

  if (missingKeys.length > 0) {
    console.error('❌ Missing required OMDb API keys in environment variables:');
    missingKeys.forEach(item => {
      console.error(`   - ${item.key}`);
    });

    console.warn(`⚠️  Warning: Some functionality will be limited without all API keys.`);
    console.warn(`💡 To set these keys, run:`);
    console.warn(`   firebase functions:config:set omdb.key1="your_key1" omdb.key2="your_key2" omdb.key3="your_key3" omdb.key4="your_key4"`);
    
    return false;
  }

  console.log('✅ All OMDb API keys are properly configured');
  return true;
}

/**
 * Validates environment variables on app startup
 * Logs any missing keys with clear error messages
 * @returns {boolean} - True if all required environment variables exist, false otherwise
 */
function validateEnvironment() {
  console.log('🔍 Validating environment variables on startup...');
  
  // Validate OMDb API keys
  const allValid = validateOmdbApiKeys();
  
  if (!allValid) {
    console.error('🚨 Environment validation failed - some required variables are missing!');
  } else {
    console.log('✅ Environment validation passed - all required variables are present');
  }
  
  return allValid;
}

// Run validation on module load (app startup)
const environmentValid = validateEnvironment();

module.exports = {
  validateOmdbApiKeys,
  validateEnvironment,
  environmentValid
};