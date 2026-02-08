import React from "react";
import { Outlet } from "react-router-dom";
import { Database, Edit3, Network, ShieldCheck, Terminal } from "lucide-react";
import { HorizontalTabNav, useTabNavigation } from "@/components/tabs";
import type { TabConfig } from "@/components/tabs";

/**
 * DebugView Component
 * 
 * Debug feature layout with URL-driven sub-navigation.
 * 
 * Responsibilities:
 * 1. Renders URL-based debug tabs
 * 2. Hosts nested routes via Outlet
 * @returns {JSX.Element} Debug view with tabbed interface
 */
const DebugView: React.FC = () => {
  const tabs: TabConfig<"console" | "graph" | "manual-journal-entry" | "datastores" | "authentication">[] = [
    { id: "console", icon: Terminal, label: "Debug Console", path: "console" },
    { id: "graph", icon: Network, label: "Graph Editor", path: "graph" },
    { id: "manual-journal-entry", icon: Edit3, label: "Manual Journal Entry", path: "manual-journal-entry" },
    { id: "datastores", icon: Database, label: "Datastores", path: "datastores" },
    { id: "authentication", icon: ShieldCheck, label: "Authentication", path: "authentication" },
  ];

  const { activeTab, setActiveTab } = useTabNavigation(tabs, "console", "/app/debug");

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-slate-900 border-b-2 border-slate-900 dark:border-slate-700 px-6 py-3">
        <HorizontalTabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isDraggable={false}
          className="bg-transparent p-0"
        />
      </div>

      <Outlet />
    </div>
  );
};

export default DebugView;
