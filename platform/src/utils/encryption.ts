import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 310000; // Increased from 100,000 to meet OWASP recommendations

// Get the encryption key from environment variables
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable must be set');
  }
  
  // If the key is a hex string, convert it to buffer
  if (/^[0-9a-f]{64}$/i.test(key)) {
    return Buffer.from(key, 'hex');
  }
  
  // If it's a string, derive a key using PBKDF2
  const salt = crypto.createHash('sha256').update('static-salt-for-key-derivation').digest();
  return crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

// Version tag for encryption format
const CURRENT_VERSION = 1;

export function encryptApiKey(text: string): string {
  try {
    // Get the encryption key
    const masterKey = getEncryptionKey();
    
    // Generate a random salt for this encryption
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Create a unique key for this encryption using PBKDF2
    const key = crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
    
    // Generate a random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine version, salt, IV, auth tag, and encrypted text
    const versionBuffer = Buffer.alloc(1);
    versionBuffer.writeUInt8(CURRENT_VERSION);
    
    return Buffer.concat([
      versionBuffer,
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]).toString('base64');
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

export function decryptApiKey(encryptedText: string): string {
  try {
    // Get the encryption key
    const masterKey = getEncryptionKey();
    
    // Convert the combined string back to a buffer
    const buffer = Buffer.from(encryptedText, 'base64');
    
    // Extract the version and validate it
    const version = buffer.readUInt8(0);
    if (version !== CURRENT_VERSION) {
      throw new Error('Unsupported encryption version');
    }
    
    // Extract the salt, IV, auth tag, and encrypted text
    const salt = buffer.subarray(1, 1 + SALT_LENGTH);
    const iv = buffer.subarray(1 + SALT_LENGTH, 1 + SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.subarray(1 + SALT_LENGTH + IV_LENGTH, 1 + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buffer.subarray(1 + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    
    // Recreate the key using PBKDF2
    const key = crypto.pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

// Function to validate encryption key format
export function validateEncryptionKey(key: string): boolean {
  try {
    // Check if key is present
    if (!key) return false;
    
    // If it's a hex string, it should be 64 characters (32 bytes)
    if (/^[0-9a-f]{64}$/i.test(key)) return true;
    
    // If it's a string, it should be at least 32 characters
    return key.length >= 32;
  } catch {
    return false;
  }
} 