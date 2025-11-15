import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';
import { trpc, createTRPCClient } from './lib/trpc';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { MessagingPage } from './pages/MessagingPage';

const queryClient = new QueryClient();

/**
 * Protected route wrapper that redirects to login if not authenticated.
 * 
 * @param props - Component props
 * @param props.children - Child components to render if authenticated
 * @returns Protected route component
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

/**
 * Main application component.
 * Sets up routing, authentication, and tRPC client.
 * 
 * @returns Application component
 */
function App() {
  const { token } = useAuth();
  const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
  const trpcClient = useMemo(
    () =>
      createTRPCClient(() => {
        return authToken;
      }),
    [authToken]
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagingPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/messages" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
