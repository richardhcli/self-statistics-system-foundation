/**
 * App Component (Root)
 * 
 * Application entry point that initializes persistence layer.
 * Routing and feature composition is now handled by URL-based routes in AppRoutes.
 * 
 * Responsibilities:
 * - Initialize IndexedDB persistence layer
 * - Display loading state during initialization
 * - Render routing structure via AppProvider
 * 
 * @returns JSX.Element App root or loading screen
 */

import React from "react";
import { usePersistence } from "@/hooks/use-persistence";
import { clearIndexedDB } from "@/testing";

/**
 * TEMPORARY: Clear IndexedDB on app load (debugging hydration issues)
 * @deprecated Remove this after debugging is complete
 */
console.warn("[App] Clearing IndexedDB for debugging purposes. Remove in final app.");
clearIndexedDB().catch(console.error);

const App: React.FC = () => {
  const { isInitialized } = usePersistence();

  // Show loading state until persistence is initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-700 dark:text-slate-300">Initializing application...</p>
        </div>
      </div>
    );
  }

  // Routing is now handled by AppProvider/AppRoutes (URL-based)
  return <></>;
};

export default App;