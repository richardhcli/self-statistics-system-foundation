/**
 * Horizontal tab navigation component for global application navigation.
 * Used in header for main feature tabs (journal, graph, statistics, etc.).
 * Features drag-to-scroll for better mobile/tablet support.
 */

import React, { useRef, useState } from "react";
import type { TabConfig } from "./use-tab-navigation";

interface HorizontalTabNavProps<T extends string> {
  /** Array of tab configurations */
  tabs: TabConfig<T>[];
  /** Currently active tab ID */
  activeTab: T;
  /** Callback when tab is selected */
  onTabChange: (tab: T) => void;
  /** Enable drag-to-scroll (default: true) */
  isDraggable?: boolean;
  /** Optional CSS class for container */
  className?: string;
}

/**
 * Horizontal tab navigation component with drag-to-scroll support.
 *
 * @template T - Tab identifier type
 * @param props - Component props
 * @returns JSX.Element
 */
export const HorizontalTabNav = React.forwardRef<
  HTMLDivElement,
  HorizontalTabNavProps<any>
>(function HorizontalTabNav(
  { tabs, activeTab, onTabChange, isDraggable = true, className },
  ref
) {
  const navRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable || !navRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - navRef.current.offsetLeft);
    setScrollLeft(navRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !navRef.current) return;
    e.preventDefault();
    const x = e.pageX - navRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    navRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <nav
      ref={navRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      className={`flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0 transition-all ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      } ${className || ""}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => !isDragging && onTabChange(tab.id)}
          className={`horizontal-tab-item flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all whitespace-nowrap ${
            activeTab === tab.id
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title={tab.label}
        >
          <tab.icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
});

HorizontalTabNav.displayName = "HorizontalTabNav";
