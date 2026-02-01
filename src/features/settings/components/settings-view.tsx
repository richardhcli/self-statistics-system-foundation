import React, { useState } from 'react';
import { User, Shield, Bell, Layout, Sparkles } from 'lucide-react';
import StatusDisplaySettings from './status-display-settings';
import ProfileSettings from './profile-settings';
import PrivacySettings from './privacy-settings';
import NotificationSettings from './notification-settings';
import AIFeaturesSettings from './ai-features-settings';

type SettingsTab = 'status' | 'profile' | 'privacy' | 'notifications' | 'ai-features';

const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('status');

  const tabs = [
    { id: 'status' as const, label: 'Status Display', icon: Layout, color: 'text-indigo-600', activeBg: 'bg-white dark:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700' },
    { id: 'profile' as const, label: 'Account Profile', icon: User, color: 'text-violet-600', activeBg: 'bg-white dark:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700' },
    { id: 'ai-features' as const, label: 'AI Features', icon: Sparkles, color: 'text-blue-600', activeBg: 'bg-white dark:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700' },
    { id: 'privacy' as const, label: 'Privacy & Security', icon: Shield, color: 'text-emerald-600', activeBg: 'bg-white dark:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700' },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell, color: 'text-amber-600', activeBg: 'bg-white dark:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700' },
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto settings-main-container flex animate-neural-in">
        
        {/* Navigation Sidebar */}
        <aside className="w-72 md:w-80 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-colors settings-sidebar-nav">
          <div className="p-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight px-2">Settings</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 px-2">User Control Center</p>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            <div className="mb-4">
              <span className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">User Settings</span>
            </div>
            {tabs.slice(0, 2).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`settings-nav-button w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? `${tab.activeBg} ${tab.color}`
                    : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}

            <div className="mt-8 mb-4">
              <span className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">App Settings</span>
            </div>
            {tabs.slice(2).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`settings-nav-button w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? `${tab.activeBg} ${tab.color}`
                    : 'text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

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

        {/* View Area */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 transition-colors settings-content-area">
          <div className="max-w-4xl p-10 md:p-16 mx-auto">
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              {activeTab === 'status' && <StatusDisplaySettings />}
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'ai-features' && <AIFeaturesSettings />}
              {activeTab === 'privacy' && <PrivacySettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
            </div>
          </div>
        </main>
    </div>
  );
};

export default SettingsView;