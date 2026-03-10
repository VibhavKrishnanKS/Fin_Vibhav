
/**
 * Security Service
 * Provides AES-GCM encryption and decryption using the Web Crypto API.
 */

const ENCRYPTION_KEY_NAME = 'fin_secure_key';

async function getEncryptionKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('vibhav-wealth-salt'), // In a real app, use a unique salt per user
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Simple deterministic key for demonstration (In production, derive from user secret)
const MASTER_SECRET = 'vibhav-wealth-master-key-2024';

const PREFIX = 'ENC:';

export async function encryptData(data: any): Promise<string> {
  if (!data) return data;
  const key = await getEncryptionKey(MASTER_SECRET);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(JSON.stringify(data));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );
  
  // Combine IV and Encrypted Data for storage
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return PREFIX + btoa(String.fromCharCode(...combined));
}

export async function decryptData(encryptedString: string): Promise<any> {
  if (!encryptedString || typeof encryptedString !== 'string' || !encryptedString.startsWith(PREFIX)) {
    return encryptedString; // Return as is if not encrypted or not a string
  }
  
  try {
    const key = await getEncryptionKey(MASTER_SECRET);
    const base64Data = encryptedString.substring(PREFIX.length);
    const combined = new Uint8Array(atob(base64Data).split('').map(c => c.charCodeAt(0)));
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (error) {
    console.error("Decryption failed:", error);
    return encryptedString; // Fallback to raw data if decryption fails
  }
}
