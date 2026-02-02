import React from 'react';
import { Terminal, Network, Edit3 } from 'lucide-react';

/**
 * Debug subtab type definition
 * Defines available tabs within the debug console
 */
export type DebugTab = 'console' | 'graph' | 'manual-journal-entry';

/**
 * Props for DebugTabs component
 * @property {DebugTab} activeTab - Currently selected tab
 * @property {(tab: DebugTab) => void} onTabChange - Callback when user switches tabs
 */
interface DebugTabsProps {
  activeTab: DebugTab;
  onTabChange: (tab: DebugTab) => void;
}

/**
 * DebugTabs Component
 * 
 * Provides tabbed navigation within the debug feature.
 * Allows switching between debug console tools and graph visualization.
 * 
 * Follows the composition pattern - tabs control which slot content is displayed.
 * 
 * @param {DebugTabsProps} props - Component props
 * @returns {JSX.Element} Tab navigation UI
 */
const DebugTabs: React.FC<DebugTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'console' as DebugTab, icon: Terminal, label: 'Debug Console' },
    { id: 'graph' as DebugTab, icon: Network, label: 'Graph Editor' },
    { id: 'manual-journal-entry' as DebugTab, icon: Edit3, label: 'Manual Journal Entry' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-b-2 border-slate-900 dark:border-slate-700 px-6 py-3">
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DebugTabs;
