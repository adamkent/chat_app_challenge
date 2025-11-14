import { PrismaClient } from '@prisma/client';
import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { verifyToken, JwtPayload } from '../utils/auth.js';

const prisma = new PrismaClient();

/**
 * Authenticated user information extracted from JWT token.
 */
export interface AuthUser {
  userId: number;
  username: string;
}

/**
 * Creates the tRPC context for each request.
 * Extracts and verifies JWT token from Authorization header if present.
 * 
 * @param opts - Express context options containing request and response
 * @returns Context object with Prisma client and optional authenticated user
 */
export async function createContext({ req, res }: CreateExpressContextOptions) {
  // Extract token from Authorisation header
  const authHeader = req.headers.authorization;
  let user: AuthUser | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const payload: JwtPayload = verifyToken(token);
      user = {
        userId: payload.userId,
        username: payload.username,
      };
    } catch (error) {
      // Invalid token - user remains null
      console.warn('Invalid token provided:', error);
    }
  }

  return {
    prisma,
    user,
    req,
    res,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
