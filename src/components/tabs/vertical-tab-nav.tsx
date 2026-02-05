/**
 * Vertical tab navigation component for settings and sectioned navigation.
 * Used in settings view for sidebar tab selection with optional grouping.
 */

import React from "react";
import type { TabConfig } from "./use-tab-navigation";

interface TabSection<T extends string> {
  title: string;
  tabIds: T[];
}

interface VerticalTabNavProps<T extends string> {
  /** Array of tab configurations */
  tabs: TabConfig<T>[];
  /** Currently active tab ID */
  activeTab: T;
  /** Callback when tab is selected */
  onTabChange: (tab: T) => void;
  /** Optional section grouping for tabs */
  sections?: TabSection<T>[];
  /** Optional CSS class for container */
  className?: string;
}

/**
 * Vertical tab navigation sidebar component.
 * Displays tabs in a vertical layout, optionally grouped into sections.
 *
 * @template T - Tab identifier type
 * @param props - Component props
 * @returns JSX.Element
 */
export const VerticalTabNav = React.forwardRef<
  HTMLDivElement,
  VerticalTabNavProps<any>
>(function VerticalTabNav(
  { tabs, activeTab, onTabChange, sections, className },
  ref
) {
  // If no sections provided, group all tabs in a default section
  const tabSections = sections || [{ title: "", tabIds: tabs.map((t) => t.id) }];

  return (
    <aside
      ref={ref}
      className={`w-72 md:w-80 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-colors ${
        className || ""
      }`}
    >
      {/* Header */}
      <div className="p-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight px-2">
          Settings
        </h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 px-2">
          User Control Center
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {tabSections.map((section, sectionIdx) => (
          <div key={sectionIdx}>
            {section.title && (
              <div className={sectionIdx > 0 ? "mt-8 mb-4" : "mb-4"}>
                <span className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {section.title}
                </span>
              </div>
            )}

            {tabs
              .filter((tab) => section.tabIds.includes(tab.id))
              .map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`vertical-tab-item w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700 text-indigo-600"
                      : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title={tab.label}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-8">
        <div className="px-2">
          <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase opacity-60">
            System Ver 2.5.0-edge
          </p>
          <p className="text-[8px] font-medium text-slate-400 leading-relaxed uppercase mt-1">
            Data linked to Local-First IndexedDB
          </p>
        </div>
      </div>
    </aside>
  );
});

VerticalTabNav.displayName = "VerticalTabNav";
