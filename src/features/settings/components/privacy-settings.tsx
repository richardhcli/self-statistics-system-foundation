
import React, { useEffect, useState } from "react";
import { Eye, Fingerprint, Lock, Shield } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { loadPrivacySettings, updatePrivacySettings } from "@/lib/firebase/user-profile";
import type { PrivacySettings } from "@/types/firestore";

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  encryptionEnabled: true,
  visibilityMode: "private",
  biometricUnlock: false,
};

const PrivacySettings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await loadPrivacySettings(user.uid);
        setSettings(data);
      } catch (err) {
        console.error("[PrivacySettings] Failed to load privacy settings", err);
        setSettings(DEFAULT_PRIVACY_SETTINGS);
        try {
          await updatePrivacySettings(user.uid, DEFAULT_PRIVACY_SETTINGS);
        } catch (updateError) {
          console.error("[PrivacySettings] Failed to seed privacy settings", updateError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const updateSetting = async (updates: Partial<PrivacySettings>) => {
    if (!user) {
      setError("Please sign in again to update privacy settings.");
      return;
    }

    const next = { ...settings, ...updates };
    setSettings(next);

    try {
      await updatePrivacySettings(user.uid, updates);
    } catch (err) {
      console.error("[PrivacySettings] Failed to update privacy settings", err);
      setError("Failed to update privacy settings.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Privacy & Security</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Manage your data encryption and access.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <div className="space-y-4">
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-xl text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">End-to-End Encryption</h4>
                <p className="text-xs text-slate-500 font-medium">Encrypt local data before storage.</p>
              </div>
            </div>
            <button
              type="button"
              className={`w-10 h-5 rounded-full relative transition-colors ${settings.encryptionEnabled ? "bg-indigo-600" : "bg-slate-300"}`}
              onClick={() => updateSetting({ encryptionEnabled: !settings.encryptionEnabled })}
              disabled={isLoading}
            >
              <div
                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                  settings.encryptionEnabled ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white rounded-xl text-slate-400">
                <Eye className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Visibility Mode</h4>
                <p className="text-xs text-slate-500 font-medium">Control who can view your summaries.</p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "private", label: "Private" },
                    { id: "team", label: "Team" },
                    { id: "public", label: "Public" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => updateSetting({ visibilityMode: option.id as PrivacySettings["visibilityMode"] })}
                      disabled={isLoading}
                      className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                        settings.visibilityMode === option.id
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-xl text-slate-400">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Biometric Unlock</h4>
                <p className="text-xs text-slate-500 font-medium">Require biometric auth to open the app.</p>
              </div>
            </div>
            <button
              type="button"
              className={`w-10 h-5 rounded-full relative transition-colors ${settings.biometricUnlock ? "bg-indigo-600" : "bg-slate-300"}`}
              onClick={() => updateSetting({ biometricUnlock: !settings.biometricUnlock })}
              disabled={isLoading}
            >
              <div
                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                  settings.biometricUnlock ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
