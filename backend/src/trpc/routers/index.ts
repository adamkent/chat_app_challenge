import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { threadRouter } from './thread.js';
import { messageRouter } from './message.js';

/**
 * Main application router combining all sub-routers.
 * This is the single source of truth for the API schema.
 */
export const appRouter = router({
  auth: authRouter,
  thread: threadRouter,
  message: messageRouter,
});

/**
 * Export type definition for use in frontend.
 */
export type AppRouter = typeof appRouter;
