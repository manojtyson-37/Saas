import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

/**
 * scrypt-based secret hashing (passwords and POS PINs).
 * Format: `scrypt:<hex salt>:<hex hash>` — versioned by prefix so the
 * algorithm can be upgraded (e.g. to argon2id) with transparent rehash.
 */
@Injectable()
export class PasswordService {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = await scryptAsync(plain, salt, 64);
    return `scrypt:${salt}:${derived.toString('hex')}`;
  }

  async verify(plain: string, stored: string | null | undefined): Promise<boolean> {
    if (!stored) return false;
    const [scheme, salt, expectedHex] = stored.split(':');
    if (scheme !== 'scrypt' || !salt || !expectedHex) return false;
    const derived = await scryptAsync(plain, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    return expected.length === derived.length && timingSafeEqual(derived, expected);
  }
}
