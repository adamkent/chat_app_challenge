import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { comparePassword } from '../../utils/auth.js';
import { generateToken } from '../../utils/auth.js';
import { TRPCError } from '@trpc/server';

/**
 * Authentication router handling user login.
 */
export const authRouter = router({
  /**
   * Login endpoint.
   * Validates username and password, returns JWT token on success.
   * 
   * @input username - User's username
   * @input password - User's password (plain text)
   * @returns JWT token and user information
   * @throws UNAUTHORIZED if credentials are invalid
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, 'Username is required'),
        password: z.string().min(1, 'Password is required'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { username, password } = input;

      // Find user by username
      const user = await ctx.prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid username or password',
        });
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.passwordHash);

      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid username or password',
        });
      }

      // Generate JWT token
      const token = generateToken(user.id, user.username);

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
        },
      };
    }),
});
