
/**
 * Global provider component for application.
 * Sets up routing context, authentication, and error boundaries.
 */

import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/providers";
import { ErrorBoundary } from "react-error-boundary";
import { AppRoutes } from "./routes";

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
 * - Suspense fallback for lazy-loaded components
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading application...</p>
          </div>
        </div>
      }
    >
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.Suspense>
  );
};
