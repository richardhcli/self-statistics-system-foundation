
/**
 * Global provider component for application.
 * Sets up routing context, authentication, and error boundaries.
 */

import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/providers";
import { ErrorBoundary } from "react-error-boundary";

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * Error fallback component for error boundary
 */
const ErrorFallback = () => (
  <div role="alert" className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong.</h2>
      <button
        onClick={() => window.location.assign(window.location.origin)}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Refresh
      </button>
    </div>
  </div>
);

/**
 * Global provider wrapping the entire application.
 * Provides:
 * - BrowserRouter for URL-based routing
 * - AuthProvider for authentication state
 * - ErrorBoundary for error handling
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};
