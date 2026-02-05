/**
 * Tab navigation hook for URL-based tab management.
 * Shared logic between horizontal and vertical tab components.
 * Parses active tab from URL and provides navigation handlers.
 */

import { useLocation, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

/**
 * Configuration for a single tab
 */
export interface TabConfig<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
  path?: string; // Relative path segment (e.g., "status" or "ai-features")
}

/**
 * Hook for managing tab navigation based on URL
 * Automatically parses active tab from current pathname
 *
 * @template T - Tab identifier type (must be string literal union)
 * @param tabs - Array of tab configurations
 * @param defaultTab - Default tab ID if URL doesn't match any tab
 * @param basePath - Base URL path (e.g., "/app/settings") - if provided, navigation uses relative paths
 * @returns Object with activeTab and setActiveTab function
 */
export const useTabNavigation = <T extends string>(
  tabs: TabConfig<T>[],
  defaultTab: T,
  basePath?: string
) => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Determines active tab from current URL pathname
   */
  const getActiveTabFromUrl = (): T => {
    const pathname = location.pathname;
    
    if (!basePath) {
      return defaultTab;
    }

    // Extract the last segment of the path (after basePath)
    // e.g., "/app/settings/profile" with basePath="/app/settings" → "profile"
    const pathAfterBase = pathname.replace(basePath, "").replace(/^\//, "");
    
    // Find matching tab by ID or path
    const activeTab = tabs.find(
      (t) => t.id === (pathAfterBase as T) || t.path === pathAfterBase
    );

    return (activeTab?.id as T) || defaultTab;
  };

  const activeTab = getActiveTabFromUrl();

  /**
   * Navigates to a different tab
   * If basePath is provided, uses absolute navigation
   * Otherwise, just returns the tab ID (caller handles navigation)
   */
  const setActiveTab = (tabId: T) => {
    if (basePath) {
      const tab = tabs.find((t) => t.id === tabId);
      const path = tab?.path ?? tabId;
      navigate(`${basePath}/${path}`);
    }
  };

  return { activeTab, setActiveTab };
};
