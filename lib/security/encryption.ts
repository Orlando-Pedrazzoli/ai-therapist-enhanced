// lib/security/encryption.ts
import CryptoJS from 'crypto-js';

interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
  timestamp: number;
}

interface EncryptionConfig {
  algorithm: 'AES-256' | 'AES-128';
  iterations: number;
  keySize: number;
}

export class DataEncryption {
  private readonly config: EncryptionConfig;
  private readonly masterKey: string;

  constructor(masterKey?: string) {
    this.config = {
      algorithm: 'AES-256',
      iterations: 10000,
      keySize: 256,
    };

    // Use environment variable or generate secure key
    this.masterKey = masterKey || process.env.ENCRYPTION_MASTER_KEY || '';
    
    if (!this.masterKey) {
      throw new Error('Encryption master key is required');
    }
  }

  /**
   * Encrypt sensitive data
   */
  public encrypt(plainText: string, userKey?: string): EncryptedData {
    try {
      // Generate random salt and IV
      const salt = CryptoJS.lib.WordArray.random(128 / 8);
      const iv = CryptoJS.lib.WordArray.random(128 / 8);

      // Derive key from master key and optional user key
      const key = this.deriveKey(userKey || '', salt);

      // Encrypt the data
      const encrypted = CryptoJS.AES.encrypt(plainText, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return {
        data: encrypted.toString(),
        iv: iv.toString(CryptoJS.enc.Base64),
        salt: salt.toString(CryptoJS.enc.Base64),
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  public decrypt(encryptedData: EncryptedData, userKey?: string): string {
    try {
      // Parse salt and IV from base64
      const salt = CryptoJS.enc.Base64.parse(encryptedData.salt);
      const iv = CryptoJS.enc.Base64.parse(encryptedData.iv);

      // Derive the same key
      const key = this.deriveKey(userKey || '', salt);

      // Decrypt the data
      const decrypted = CryptoJS.AES.decrypt(encryptedData.data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const plainText = decrypted.toString(CryptoJS.enc.Utf8);

      if (!plainText) {
        throw new Error('Failed to decrypt - invalid key or corrupted data');
      }

      return plainText;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Derive encryption key from master key and salt
   */
  private deriveKey(userKey: string, salt: CryptoJS.lib.WordArray): string {
    const combinedKey = this.masterKey + userKey;
    const key = CryptoJS.PBKDF2(combinedKey, salt, {
      keySize: this.config.keySize / 32,
      iterations: this.config.iterations,
    });
    return key.toString();
  }

  /**
   * Hash sensitive data for comparison (e.g., for searching without decrypting)
   */
  public hash(data: string): string {
    return CryptoJS.SHA256(data + this.masterKey).toString();
  }

  /**
   * Verify if plain text matches hashed value
   */
  public verifyHash(plainText: string, hash: string): boolean {
    return this.hash(plainText) === hash;
  }

  /**
   * Encrypt an entire object
   */
  public encryptObject<T extends object>(obj: T, userKey?: string): EncryptedData {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString, userKey);
  }

  /**
   * Decrypt an object
   */
  public decryptObject<T extends object>(
    encryptedData: EncryptedData,
    userKey?: string
  ): T {
    const jsonString = this.decrypt(encryptedData, userKey);
    return JSON.parse(jsonString) as T;
  }

  /**
   * Generate a secure random key
   */
  public static generateSecureKey(length: number = 32): string {
    const wordArray = CryptoJS.lib.WordArray.random(length);
    return wordArray.toString(CryptoJS.enc.Base64);
  }

  /**
   * Encrypt for client-side storage (less secure, for non-critical data)
   */
  public encryptForStorage(data: string): string {
    const encrypted = CryptoJS.AES.encrypt(data, this.masterKey);
    return encrypted.toString();
  }

  /**
   * Decrypt from client-side storage
   */
  public decryptFromStorage(encryptedData: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, this.masterKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}

// Session-specific encryption for chat messages
export class SessionEncryption {
  private sessionKey: string;
  private encryption: DataEncryption;

  constructor(sessionId: string) {
    // Generate session-specific key
    this.sessionKey = CryptoJS.SHA256(sessionId + Date.now()).toString();
    this.encryption = new DataEncryption(process.env.ENCRYPTION_MASTER_KEY);
  }

  public encryptMessage(message: string): EncryptedData {
    return this.encryption.encrypt(message, this.sessionKey);
  }

  public decryptMessage(encryptedData: EncryptedData): string {
    return this.encryption.decrypt(encryptedData, this.sessionKey);
  }

  public destroySession(): void {
    // Clear session key from memory
    this.sessionKey = '';
  }
}

// HIPAA-compliant audit logging
export class SecureAuditLog {
  private encryption: DataEncryption;

  constructor() {
    this.encryption = new DataEncryption(process.env.AUDIT_ENCRYPTION_KEY);
  }

  public logAccess(userId: string, action: string, resource: string): void {
    const logEntry = {
      userId: this.encryption.hash(userId), // Hash user ID for privacy
      action,
      resource: this.encryption.hash(resource),
      timestamp: new Date().toISOString(),
      ip: this.getClientIP(),
    };

    // In production, this would be sent to a secure audit log service
    console.log('[AUDIT]', logEntry);
  }

  private getClientIP(): string {
    // In production, get actual client IP
    return 'xxx.xxx.xxx.xxx';
  }
}

// Export singleton instances
let encryptionInstance: DataEncryption | null = null;
let auditLogInstance: SecureAuditLog | null = null;

export function getEncryption(): DataEncryption {
  if (!encryptionInstance) {
    encryptionInstance = new DataEncryption();
  }
  return encryptionInstance;
}

export function getAuditLog(): SecureAuditLog {
  if (!auditLogInstance) {
    auditLogInstance = new SecureAuditLog();
  }
  return auditLogInstance;
}

// Export types
export type { EncryptedData, EncryptionConfig };
