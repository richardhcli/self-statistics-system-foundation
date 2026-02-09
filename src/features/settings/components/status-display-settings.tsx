
import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Layout, Loader2, Moon, Save, Sparkles, Sun } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useUserInformation, useUserInformationActions } from "@/stores/user-information";
import {
  loadProfileDisplay,
  loadUIPreferences,
  loadUserProfile,
  updateProfileDisplay,
  updateUIPreferences,
  updateUserProfile,
} from "@/lib/firebase/user-profile";
import type { ProfileDisplaySettings, UIPreferences } from "@/types/firestore";

const DEFAULT_PREFERENCES: UIPreferences = {
  theme: "dark",
  language: "en",
  showCumulativeExp: true,
  showMasteryLevels: true,
  showRecentAction: true,
  animateProgressBars: true,
};

const StatusDisplaySettings: React.FC = () => {
  const { user } = useAuth();
  const userInformation = useUserInformation();
  const { setInfo } = useUserInformationActions();
  const [displayName, setDisplayName] = useState("");
  const [userClass, setUserClass] = useState("");
  const [uiPreferences, setUiPreferences] = useState<UIPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains("dark"));

  const applyTheme = (nextTheme: "light" | "dark") => {
    setIsDark(nextTheme === "dark");
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    localStorage.setItem("theme", nextTheme);
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (storedTheme) {
      applyTheme(storedTheme);
    }
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const [profileResult, preferencesResult, profileDisplayResult] = await Promise.allSettled([
          loadUserProfile(user.uid),
          loadUIPreferences(user.uid),
          loadProfileDisplay(user.uid),
        ]);

        if (profileResult.status === "fulfilled") {
          setDisplayName(profileResult.value.displayName ?? "");
        }

        if (preferencesResult.status === "fulfilled") {
          setUiPreferences(preferencesResult.value);
          const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
          if (!storedTheme) {
            applyTheme(preferencesResult.value.theme);
          }
        } else {
          await updateUIPreferences(user.uid, DEFAULT_PREFERENCES);
          setUiPreferences(DEFAULT_PREFERENCES);
        }

        if (profileDisplayResult.status === "fulfilled") {
          setUserClass(profileDisplayResult.value.class ?? "");
        } else {
          await updateProfileDisplay(user.uid, { class: "" });
          setUserClass("");
        }

        setInfo({
          ...userInformation,
          name:
            profileResult.status === "fulfilled"
              ? profileResult.value.displayName ?? userInformation.name
              : userInformation.name,
          userClass:
            profileDisplayResult.status === "fulfilled"
              ? profileDisplayResult.value.class ?? userInformation.userClass
              : userInformation.userClass,
        });
      } catch (err) {
        console.error("[StatusDisplaySettings] Failed to load settings", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const toggleTheme = async () => {
    if (!user) {
      setError("Please sign in again to update your theme.");
      return;
    }

    const nextTheme: UIPreferences["theme"] = isDark ? "light" : "dark";
    applyTheme(nextTheme);
    setUiPreferences((prev) => ({ ...prev, theme: nextTheme }));

    try {
      await updateUIPreferences(user.uid, { theme: nextTheme });
    } catch (err) {
      console.error("[StatusDisplaySettings] Failed to update theme", err);
      setError("Failed to update theme.");
    }
  };

  const toggleVisibility = async (key: keyof UIPreferences) => {
    if (!user) {
      setError("Please sign in again to update visibility settings.");
      return;
    }

    const nextValue = !uiPreferences[key];
    setUiPreferences((prev) => ({ ...prev, [key]: nextValue }));

    try {
      await updateUIPreferences(user.uid, { [key]: nextValue } as Partial<UIPreferences>);
    } catch (err) {
      console.error("[StatusDisplaySettings] Failed to update visibility", err);
      setError("Failed to update visibility settings.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Please sign in again to update your profile.");
      return;
    }

    try {
      setError(null);
      setIsSaving(true);
      await Promise.all([
        updateUserProfile(user.uid, { displayName }),
        updateProfileDisplay(user.uid, { class: userClass } as ProfileDisplaySettings),
      ]);
      setInfo({
        ...userInformation,
        name: displayName,
        userClass,
      });
    } catch (err) {
      console.error("[StatusDisplaySettings] Failed to save status display", err);
      setError("Failed to save status display settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Layout className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Theme & Display</h3>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 ml-8">Customize the visual appearance of your brain.</p>
        </div>
        <div className="p-8">
           <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-indigo-600">
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Dark Mode</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Toggle between light and dark visual themes.</p>
                </div>
              </div>
              <button 
                onClick={toggleTheme}
                className={`w-14 h-7 rounded-full relative transition-all duration-300 ${isDark ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${isDark ? 'left-8' : 'left-1'}`} />
              </button>
           </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Status Display</h3>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 ml-8">Customize how you appear in the neural network.</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                  placeholder="e.g. Neural Pioneer"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Character Class</label>
                <div className="relative">
                  <input
                    type="text"
                    value={userClass}
                    onChange={(e) => setUserClass(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white transition-all pl-12"
                    placeholder="e.g. Master Architect"
                    disabled={isLoading}
                  />
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                </div>
              </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Player Status Visibility</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "showCumulativeExp", label: "Show Cumulative EXP" },
                { key: "showMasteryLevels", label: "Show Mastery Levels" },
                { key: "showRecentAction", label: "Show Recent Action" },
                { key: "animateProgressBars", label: "Animate Progress Bars" },
              ].map((pref) => {
                const active = uiPreferences[pref.key as keyof UIPreferences];
                return (
                  <div
                    key={pref.key}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"
                  >
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                      {pref.label}
                    </span>
                    <button
                      type="button"
                      className="text-indigo-600"
                      onClick={() => toggleVisibility(pref.key as keyof UIPreferences)}
                      disabled={isLoading}
                    >
                      {active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Updating...' : 'Apply Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StatusDisplaySettings;
