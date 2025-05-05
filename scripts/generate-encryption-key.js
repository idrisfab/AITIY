const crypto = require('crypto');

// Generate a random 32-byte (256-bit) key
const key = crypto.randomBytes(32);

console.log('\nGenerated Encryption Key:');
console.log('------------------------');
console.log('Hex format (recommended):');
console.log(key.toString('hex'));
console.log('\nBase64 format (alternative):');
console.log(key.toString('base64'));
console.log('\nAdd this to your .env file as:');
console.log(`ENCRYPTION_KEY=${key.toString('hex')}`);
console.log('\nMake sure to keep this key secure and never commit it to version control!\n'); 