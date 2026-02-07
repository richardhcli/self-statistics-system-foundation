import React from "react";
import { Outlet } from "react-router-dom";
import { Bell, Layout, Shield, Sparkles, User } from "lucide-react";
import { VerticalTabNav, useTabNavigation } from "@/components/tabs";
import type { TabConfig } from "@/components/tabs";

type SettingsTab = "status" | "profile" | "privacy" | "notifications" | "ai-features";

const SettingsView: React.FC = () => {
  const tabs: TabConfig<SettingsTab>[] = [
    { id: "status", label: "Status Display", icon: Layout, path: "status" },
    { id: "profile", label: "Account Profile", icon: User, path: "profile" },
    { id: "ai-features", label: "AI Features", icon: Sparkles, path: "ai-features" },
    { id: "privacy", label: "Privacy & Security", icon: Shield, path: "privacy" },
    { id: "notifications", label: "Notifications", icon: Bell, path: "notifications" },
  ];

  const { activeTab, setActiveTab } = useTabNavigation(tabs, "status", "/app/settings");

  return (
    <div className="w-full max-w-[1400px] mx-auto settings-main-container flex animate-neural-in">
      <VerticalTabNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sections={[
          { title: "User Settings", tabIds: ["status", "profile"] },
          { title: "App Settings", tabIds: ["ai-features", "privacy", "notifications"] },
        ]}
        className="settings-sidebar-nav"
      />

      <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 transition-colors settings-content-area">
        <div className="max-w-4xl p-10 md:p-16 mx-auto">
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsView;