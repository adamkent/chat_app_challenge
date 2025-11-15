import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context.js';

/**
 * Initialise tRPC instance.
 */
const t = initTRPC.context<Context>().create();

/**
 * Export reusable router and procedure helpers.
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Middleware to ensure user is authenticated.
 * Throws UNAUTHORISED error if no user is present in context.
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to perform this action',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now guaranteed to be non-null
    },
  });
});

/**
 * Protected procedure that requires authentication.
 * Use this for endpoints that need a logged-in user.
 */
export const protectedProcedure = t.procedure.use(isAuthed);
