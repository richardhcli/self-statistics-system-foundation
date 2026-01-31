
import React from 'react';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Global provider to wrap the application.
 * In a full production app, this would include ErrorBoundaries,
 * QueryClientProviders, ThemeProviders, etc.
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      {children}
    </React.Suspense>
  );
};
