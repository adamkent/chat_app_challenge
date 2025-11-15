import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../backend/src/trpc/routers/index.js';

/**
 * tRPC React hooks with full type safety from backend.
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Creates the tRPC client with authentication and configuration.
 * 
 * @param getToken - Function to retrieve the current auth token
 * @returns Configured tRPC client
 */
export function createTRPCClient(getToken: () => string | null) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: import.meta.env.VITE_API_URL || 'http://172.20.7.150:3001/trpc',
        maxURLLength: 2083, // Force all requests as POST in this example to avoid query param batching issues
        headers() {
          const token = getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
