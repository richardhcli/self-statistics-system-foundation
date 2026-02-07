/**
 * ProfileSettings component allows users to view and update their display name, 
 * see their linked Google account information, 
 * and log out of their session. 
 * 
 * It fetches the user's profile data from Firestore on mount and provides 
 * a form for updating the display name. 
 * The component also includes error handling and loading states for a smooth user experience.
 */

import React, { useEffect, useState } from "react";
import { UserCircle, Mail, MapPin, Save, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/providers/auth-provider";
import { loadUserProfile, updateUserProfile } from "@/lib/firebase/user-profile";
import type { UserProfile } from "@/types/firestore";

const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await loadUserProfile(user.uid);
        setProfile(data);
        setDisplayName(data.displayName ?? "");
      } catch (err) {
        console.error("[ProfileSettings] Failed to load profile", err);
        setError("Unable to load profile information.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Please sign in again to update your profile.");
      return;
    }

    try {
      setError(null);
      setIsSaving(true);
      await updateUserProfile(user.uid, { displayName });
      setProfile((prev) => (prev ? { ...prev, displayName } : prev));
    } catch (err) {
      console.error("[ProfileSettings] Failed to update profile", err);
      setError("Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <UserCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-black text-slate-900">Account Profile</h3>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 ml-8">
            Manage your display name and view your Google account details.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-900 transition-all"
              placeholder="Neural Pioneer"
              disabled={isLoading}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Account</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200">
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 font-black">
                    {profile?.displayName?.charAt(0) ?? "?"}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    {profile?.email || user?.email || "Not available"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Linked via Google Sign-In</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving || isLoading}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Profile
            </button>
          </div>
        </div>
      </form>

      <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 text-slate-700">
            <LogOut className="w-4 h-4" />
            <p className="text-xs font-black uppercase tracking-widest">Session</p>
          </div>
          <p className="text-sm text-slate-500">Log out of this device. You can sign back in anytime.</p>
          <button
            onClick={() => navigate("/auth/logout")}
            className="px-6 py-2 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
