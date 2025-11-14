import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * JWT payload structure containing user identification.
 */
export interface JwtPayload {
  userId: number;
  username: string;
}

/**
 * Generates a JWT token for the given user.
 * 
 * @param userId - The unique identifier of the user
 * @param username - The username of the user
 * @returns A signed JWT token valid for 7 days
 */
export function generateToken(userId: number, username: string): string {
  const secret = process.env.JWT_SECRET || 'secret-key-in-prod';
  
  return jwt.sign(
    { userId, username } as JwtPayload,
    secret,
    { expiresIn: '7d' }
  );
}

/**
 * Verifies and decodes a JWT token.
 * 
 * @param token - The JWT token to verify
 * @returns The decoded JWT payload if valid
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET || 'secret-key-in-prod';
  
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Hashes a plain text password using bcrypt.
 * 
 * @param password - The plain text password to hash
 * @returns A promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compares a plain text password with a hashed password.
 * 
 * @param password - The plain text password
 * @param hash - The hashed password to compare against
 * @returns A promise resolving to true if passwords match, false otherwise
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
