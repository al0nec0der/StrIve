/**
 * OMDb Integration Test
 * Self-test function to verify discovered keys and their functionality
 */

import dynamicOMDbManager from '../util/dynamicOMDbManager.js';
import OmdbService from '../util/omdbService.js';

/**
 * Self-test function that logs each discovered key (masked) and performs a 1-shot fetch
 * for known IDs to verify functionality
 */
async function testOMDbIntegration() {
  console.log('=== OMDb Integration Test ===');
  
  // Get usage stats to see discovered keys
  const stats = dynamicOMDbManager.getUsageStats();
  console.log(`Total keys discovered: ${stats.totalKeys}`);
  console.log(`Active keys available: ${stats.activeKeys}`);
  
  // Log each discovered key (masked)
  console.log('\nDiscovered keys (masked):');
  dynamicOMDbManager.keys.forEach(key => {
    const maskedKey = dynamicOMDbManager.maskKey(key.key);
    console.log(`- Key ${key.index}: ${maskedKey} (Usage: ${key.dailyUsage}/${key.maxDailyUsage})`);
  });
  
  // Test with known IMDb IDs
  const testIds = ['tt3896198', 'tt0111161']; // These are known valid IDs: Black Panther and The Shawshank Redemption
  
  for (const testId of testIds) {
    console.log(`\n--- Testing fetch for ${testId} ---`);
    
    try {
      // Create a new service instance (this will use the dynamic key manager)
      const service = new OmdbService();
      
      // Perform fetch - this will use the key rotation logic
      const result = await service.fetchByImdbId(testId);
      
      console.log(`✓ Successfully fetched data for ${testId}`);
      console.log(`Title: ${result.Title}`);
      console.log(`Year: ${result.Year}`);
      
      // Print ratings summary
      if (result.Ratings && Array.isArray(result.Ratings) && result.Ratings.length > 0) {
        const ratingsSummary = result.Ratings.map(r => `${r.Source}: ${r.Value}`).join(', ');
        console.log(`Ratings: ${ratingsSummary}`);
      } else {
        console.log('Ratings: No ratings available');
      }
      
      // If we got a 200 response but no data, check if there was an error message
      if (result.Response === 'False') {
        console.log(`✗ API reported error: ${result.Error}`);
      }
      
    } catch (error) {
      console.log(`✗ Error fetching ${testId}: ${error.message}`);
      
      // Check if it's a 401 error (invalid key)
      if (error.message.includes('401')) {
        console.log('⚠️  This indicates an invalid or expired API key - flag "replace this key"');
      } else if (error.message.includes('All OMDb API keys have been exhausted')) {
        console.log('⚠️  All keys have been exhausted or deactivated due to errors');
      }
    }
  }
  
  console.log('\n=== End of Integration Test ===');
}

// Run the test
testOMDbIntegration().catch(console.error);

export default testOMDbIntegration;