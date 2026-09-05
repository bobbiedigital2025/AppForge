/**
 * AES-256-GCM encryption for user API keys at rest.
 * Reads ENCRYPTION_KEY from environment — a 32-byte hex string (64 hex chars).
 *
 * Generate one with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * If ENCRYPTION_KEY is not set, falls back to base64 (development only)
 * and logs a warning. Never deploy to production without a real key.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey(): Buffer | null {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) return null;
  return Buffer.from(hex, 'hex');
}

export function encrypt(plaintext: string): string {
  const key = getKey();

  if (!key) {
    // Dev fallback — NOT secure for production
    if (process.env.NODE_ENV === 'production') {
      console.error('ENCRYPTION_KEY not set in production! Keys are stored as base64 only.');
    }
    return `b64:${Buffer.from(plaintext).toString('base64')}`;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: aes:<iv_hex>:<authTag_hex>:<ciphertext_hex>
  return `aes:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(stored: string): string {
  // Base64 fallback (dev mode or legacy rows)
  if (stored.startsWith('b64:')) {
    return Buffer.from(stored.slice(4), 'base64').toString('utf-8');
  }

  // Legacy plain base64 (no prefix) — from the initial implementation
  if (!stored.startsWith('aes:')) {
    return Buffer.from(stored, 'base64').toString('utf-8');
  }

  const key = getKey();
  if (!key) {
    throw new Error('Cannot decrypt: ENCRYPTION_KEY not set');
  }

  const parts = stored.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted value format');
  }

  const [, ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf-8');
}
