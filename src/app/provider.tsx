
import React from 'react';
import { AuthProvider } from '@/providers';
import { ErrorBoundary } from 'react-error-boundary';
import { Router } from './routes';

interface AppProviderProps {
  children: React.ReactNode;
}

// Fallback component for error boundary
// TODO: implement this into the AppProvider. unnecessary for prototyping. 
const ErrorFallback = () => ( 
  <div role="alert">
    <h2>Something went wrong.</h2>
    <button onClick={() => window.location.assign(window.location.origin)}>
      Refresh
    </button>
  </div>
);

/**
 * Global provider to wrap the application.
 * In a full production app, this would include ErrorBoundaries,
 * QueryClientProviders, ThemeProviders, etc.
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      {/* <QueryClientProvider client={queryClient}> */}
        <AuthProvider>
          <Router>
            {children}
          </Router>
        </AuthProvider>
      {/* </QueryClientProvider> */}
    </React.Suspense>
  );
};
