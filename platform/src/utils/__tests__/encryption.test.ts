import { encryptApiKey, decryptApiKey, validateEncryptionKey } from '../encryption';

describe('Encryption System', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Generate a test encryption key
    process.env.ENCRYPTION_KEY = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('encryptApiKey', () => {
    it('should encrypt a string successfully', () => {
      const plaintext = 'test-api-key-123';
      const encrypted = encryptApiKey(plaintext);
      
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toEqual(plaintext);
      
      // Should be base64 encoded
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    });

    it('should generate different ciphertexts for same plaintext', () => {
      const plaintext = 'test-api-key-123';
      const encrypted1 = encryptApiKey(plaintext);
      const encrypted2 = encryptApiKey(plaintext);
      
      expect(encrypted1).not.toEqual(encrypted2);
    });

    it('should handle empty strings', () => {
      const encrypted = encryptApiKey('');
      expect(encrypted).toBeTruthy();
    });

    it('should throw error without encryption key', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encryptApiKey('test')).toThrow('ENCRYPTION_KEY environment variable must be set');
    });
  });

  describe('decryptApiKey', () => {
    it('should decrypt to original plaintext', () => {
      const plaintext = 'test-api-key-123';
      const encrypted = encryptApiKey(plaintext);
      const decrypted = decryptApiKey(encrypted);
      
      expect(decrypted).toEqual(plaintext);
    });

    it('should handle empty strings', () => {
      const encrypted = encryptApiKey('');
      const decrypted = decryptApiKey(encrypted);
      expect(decrypted).toEqual('');
    });

    it('should throw error for invalid ciphertext', () => {
      expect(() => decryptApiKey('invalid-base64!')).toThrow('Decryption failed');
    });

    it('should throw error for tampered ciphertext', () => {
      const encrypted = encryptApiKey('test');
      const tampered = encrypted.slice(0, -1) + 'X';
      expect(() => decryptApiKey(tampered)).toThrow('Decryption failed');
    });
  });

  describe('validateEncryptionKey', () => {
    it('should validate correct hex format', () => {
      const validKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(validateEncryptionKey(validKey)).toBe(true);
    });

    it('should validate long string format', () => {
      const validKey = 'a'.repeat(32);
      expect(validateEncryptionKey(validKey)).toBe(true);
    });

    it('should reject short strings', () => {
      const invalidKey = 'a'.repeat(31);
      expect(validateEncryptionKey(invalidKey)).toBe(false);
    });

    it('should reject invalid hex strings', () => {
      const invalidKey = 'g'.repeat(64); // 'g' is not a hex character
      expect(validateEncryptionKey(invalidKey)).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(validateEncryptionKey('')).toBe(false);
      expect(validateEncryptionKey(null as any)).toBe(false);
      expect(validateEncryptionKey(undefined as any)).toBe(false);
    });
  });

  describe('End-to-End Encryption Flow', () => {
    it('should handle various string lengths', () => {
      const testCases = [
        'short',
        'a'.repeat(100),
        'special!@#$%^&*()',
        '1234567890',
        'unicode-⚡️-emoji'
      ];

      testCases.forEach(testCase => {
        const encrypted = encryptApiKey(testCase);
        const decrypted = decryptApiKey(encrypted);
        expect(decrypted).toEqual(testCase);
      });
    });
  });
}); 