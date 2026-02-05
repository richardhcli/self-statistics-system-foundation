/**
 * Main application header with global navigation.
 * Displays app branding, feature tabs, and user profile.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { BookMarked, History, Network, CreditCard, BarChart3, Terminal, Settings, Share2 } from "lucide-react";
import { HorizontalTabNav, useTabNavigation } from "@/components/tabs";
import { ProfileButton } from "./profile-button";
import type { TabConfig } from "@/components/tabs";

/**
 * Global application tab type
 */
type GlobalTab = "journal" | "graph" | "statistics" | "integrations" | "billing" | "settings" | "debug";

/**
 * Header Component
 * 
 * Main navigation header with:
 * - Application branding on left
 * - Horizontal scrollable tabs in center
 * - User profile picture on right
 * 
 * Navigation is URL-based using the useTabNavigation hook.
 * Clicking profile picture navigates to /app/settings/profile
 * 
 * @returns JSX.Element Application header
 */
const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Tab configuration for global navigation
  const tabs: TabConfig<GlobalTab>[] = [
    { id: "journal", icon: History, label: "Journal", path: "/app/journal" },
    { id: "graph", icon: Network, label: "Concept Graph", path: "/app/graph" },
    { id: "statistics", icon: BarChart3, label: "Statistics", path: "/app/statistics" },
    { id: "integrations", icon: Share2, label: "Integrations", path: "/app/integrations" },
    { id: "billing", icon: CreditCard, label: "Billing", path: "/app/billing" },
    { id: "settings", icon: Settings, label: "Settings", path: "/app/settings" },
    { id: "debug", icon: Terminal, label: "Debug", path: "/app/debug" },
  ];

  // Determine active tab from current URL pathname
  const getActiveTab = (): GlobalTab => {
    const pathname = location.pathname;
    
    // Extract first feature segment after /app/ (e.g., "/app/settings/profile" → "settings")
    const match = pathname.match(/^\/app\/([^/]+)/);
    if (!match) return "journal";
    
    const segment = match[1] as GlobalTab;
    return tabs.some(t => t.id === segment) ? segment : "journal";
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tabId: GlobalTab) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.path) navigate(tab.path);
  };

  return (
    <header className="header-glass border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 select-none transition-colors">
      <div className="max-w-full mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo / Branding */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
              Journaling <span className="text-indigo-600">AI</span>
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Growth Records
            </p>
          </div>
        </div>

        {/* Horizontal Tab Navigation - Centered */}
        <HorizontalTabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isDraggable={true}
        />

        {/* Profile Picture - Right */}
        <ProfileButton />
      </div>
      <div className="header-progress-bar"></div>
    </header>
  );
};

export default Header;