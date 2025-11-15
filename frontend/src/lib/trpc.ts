import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, splitLink, wsLink, createWSClient } from '@trpc/client';
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
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://172.20.7.150:3001/trpc';
  
  // Create WebSocket client for subscriptions with auth
  const wsClient = createWSClient({
    url: wsUrl,
    lazy: true, // Only connect when subscription is active
    connectionParams: () => {
      const token = getToken();
      return token ? { authorization: `Bearer ${token}` } : {};
    },
  });

  return trpc.createClient({
    links: [
      splitLink({
        condition: (op: any) => op.type === 'subscription',
        true: wsLink({ client: wsClient }),
        false: httpBatchLink({
          url: import.meta.env.VITE_API_URL || 'http://172.20.7.150:3001/trpc',
          maxURLLength: 2083,
          headers() {
            const token = getToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      }),
    ],
  });
}
