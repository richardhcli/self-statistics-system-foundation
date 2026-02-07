
import React, { useEffect, useState } from "react";
import { Bell, Mail, Smartphone, Zap } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { loadNotificationSettings, updateNotificationSettings } from "@/lib/firebase/user-profile";
import type { NotificationSettings } from "@/types/firestore";

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  weeklySummaryEnabled: true,
  instantFeedbackEnabled: true,
};

const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await loadNotificationSettings(user.uid);
        setSettings(data);
      } catch (err) {
        console.error("[NotificationSettings] Failed to load notification settings", err);
        setSettings(DEFAULT_NOTIFICATION_SETTINGS);
        try {
          await updateNotificationSettings(user.uid, DEFAULT_NOTIFICATION_SETTINGS);
        } catch (updateError) {
          console.error("[NotificationSettings] Failed to seed notification settings", updateError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const updateSetting = async (updates: Partial<NotificationSettings>) => {
    if (!user) {
      setError("Please sign in again to update notifications.");
      return;
    }

    const next = { ...settings, ...updates };
    setSettings(next);

    try {
      await updateNotificationSettings(user.uid, updates);
    } catch (err) {
      console.error("[NotificationSettings] Failed to update notifications", err);
      setError("Failed to update notification settings.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Communication Prefs</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              How the system keeps you updated.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <div className="space-y-4">
          {[
            {
              icon: Smartphone,
              label: "Push Notifications",
              desc: "Real-time updates on task completion and level-ups.",
              key: "pushEnabled",
            },
            {
              icon: Mail,
              label: "Weekly Summary",
              desc: "Email reports detailing your growth and action map progress.",
              key: "weeklySummaryEnabled",
            },
            {
              icon: Zap,
              label: "Instant Feedback",
              desc: "Audio and haptic feedback during voice journaling.",
              key: "instantFeedbackEnabled",
            },
          ].map((item) => {
            const active = settings[item.key as keyof NotificationSettings];
            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-200 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl text-slate-400 group-hover:text-amber-500 transition-colors">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.label}</h4>
                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={`w-10 h-5 rounded-full relative transition-colors ${active ? "bg-amber-600" : "bg-slate-300"}`}
                  onClick={() => updateSetting({ [item.key]: !active } as Partial<NotificationSettings>)}
                  disabled={isLoading}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                      active ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
