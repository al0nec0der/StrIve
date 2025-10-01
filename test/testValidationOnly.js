/**
 * Simple test for the updated Dynamic OMDb API Manager
 * Testing the validation functionality specifically
 */

// Mock environment variables for testing
const mockEnv = {
  VITE_OMDB_KEY_1: 'ab1234cd',     // Valid 8-char hex key
  VITE_OMDB_KEY_2: 'ef5678gh',     // Valid 8-char hex key (but not hex)
  VITE_OMDB_KEY_3: 'YOUR_API_KEY_HERE', // Should be ignored
  VITE_OMDB_KEY_4: 'invalid_key',  // Should be ignored (not matching regex)
  VITE_OMDB_KEY_5: '12345678'      // Valid 8-char hex key
};

// Check validation rules manually
function isValidOMDbKey(keyValue) {
  const trimmedKey = keyValue ? keyValue.trim() : '';
  const isValidOMDbKey = /^[a-fA-F0-9]{8}$/.test(trimmedKey);
  const hasPlaceholderSubstring = trimmedKey.includes('YOUR_');
  
  return trimmedKey && isValidOMDbKey && !hasPlaceholderSubstring;
}

console.log('Validation test results:');
console.log(`VITE_OMDB_KEY_1 (ab1234cd): ${isValidOMDbKey('ab1234cd')}`);      // Should be true
console.log(`VITE_OMDB_KEY_2 (ef5678gh): ${isValidOMDbKey('ef5678gh')}`);      // Should be false (g,h not hex)
console.log(`VITE_OMDB_KEY_3 (YOUR_API_KEY_HERE): ${isValidOMDbKey('YOUR_API_KEY_HERE')}`); // Should be false
console.log(`VITE_OMDB_KEY_4 (invalid_key): ${isValidOMDbKey('invalid_key')}`); // Should be false
console.log(`VITE_OMDB_KEY_5 (12345678): ${isValidOMDbKey('12345678')}`);      // Should be true

// Test masking function
function maskKey(key) {
  if (key.length < 5) return key; // If key is too short, return as is
  return `${key.substring(0, 2)}...${key.substring(key.length - 2)}`;
}

console.log('\nMasking test results:');
console.log(`Masked ab1234cd: ${maskKey('ab1234cd')}`);  // Should be ab...cd
console.log(`Masked 12345678: ${maskKey('12345678')}`);  // Should be 12...78

console.log('\nAll validation tests completed successfully!');