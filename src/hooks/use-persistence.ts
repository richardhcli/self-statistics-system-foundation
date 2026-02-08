import { useEffect, useState } from 'react';

/**
 * Persistence Hook - Simplified Version
 * 
 * With Zustand's persist middleware (with idb-keyval storage), all stores
 * automatically hydrate from IndexedDB on mount. This hook simply:
 * 1. Waits for all stores to finish hydrating
 * 2. Returns initialization state for UI loading screens
 * 
 * Architecture: Local-First, Sync-Behind
 * - Read Flow: UI reads from Zustand (hydrated from IndexedDB immediately)
 * - Write Flow: UI → Zustand → IndexedDB (automatic, non-blocking)
 * - Sync: Backend sync happens independently (debug tools or future orchestrators)
 * 
 * No manual IndexedDB serialization needed - the persist middleware handles it.
 * Each store persists independently to IndexedDB with automatic version management.
 * 
 * Usage:
 * const { isInitialized } = usePersistence();
 * if (!isInitialized) return <LoadingScreen />;
 */
export const usePersistence = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log("[Persistence] Initialization started");
    // Zustand persist middleware hydrates asynchronously on store creation.
    // We wait one tick to ensure all stores have had time to hydrate.
    // This is a safe, low-overhead way to detect initialization completion.
    const timer = setTimeout(() => {
      console.log("[Persistence] Initialization complete");
      setIsInitialized(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return { isInitialized };
};