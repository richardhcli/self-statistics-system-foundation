
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/providers';
import { ErrorBoundary } from 'react-error-boundary';
import { AppRoutes } from './routes';

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
 * Provides routing context, authentication state, and error boundaries.
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes>
            {children}
          </AppRoutes>
        </AuthProvider>
      </BrowserRouter>
    </React.Suspense>
  );
};
