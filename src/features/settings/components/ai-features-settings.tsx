import React, { useEffect, useState } from "react";
import { Cpu, Gauge, Save, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { loadAISettings, updateAISettings } from "@/lib/firebase/user-profile";
import { useAiConfig, useAiConfigActions } from "@/stores/ai-config";
import type { AISettings } from "@/types/firestore";

const DEFAULT_AI_SETTINGS: AISettings = {
  provider: "gemini",
  model: {
    voiceTranscriptionModel: "gemini-2-flash",
    abstractionModel: "gemini-3-flash",
  },
  temperature: 0,
  maxTokens: 2048,
};

const AIFeaturesSettings: React.FC = () => {
  const { user } = useAuth();
  const aiConfig = useAiConfig();
  const { setConfig } = useAiConfigActions();
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await loadAISettings(user.uid);
        setSettings(data);
        setConfig({
          ...aiConfig,
          ...data,
          apiKey: data.apiKey ?? aiConfig.apiKey ?? "",
        });
      } catch (err) {
        console.error("[AIFeaturesSettings] Failed to load AI settings", err);
        setSettings(DEFAULT_AI_SETTINGS);
        try {
          await updateAISettings(user.uid, DEFAULT_AI_SETTINGS);
          setConfig({
            ...aiConfig,
            ...DEFAULT_AI_SETTINGS,
            apiKey: aiConfig.apiKey ?? "",
          });
        } catch (updateError) {
          console.error("[AIFeaturesSettings] Failed to seed AI settings", updateError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Please sign in again to update AI settings.");
      return;
    }

    try {
      setError(null);
      setIsSaving(true);
      await updateAISettings(user.uid, settings);
      setConfig({
        ...aiConfig,
        ...settings,
        apiKey: settings.apiKey ?? aiConfig.apiKey ?? "",
      });
    } catch (err) {
      console.error("[AIFeaturesSettings] Failed to update AI settings", err);
      setError("Failed to save AI settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
      >
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Neural Processing</h3>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 ml-8">
            Tune the cognitive engine and classification behavior.
          </p>
        </div>

        <div className="p-8 space-y-8">
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-tight">API Management</h4>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  Service connected via secure system-level environment.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-200 dark:shadow-none">
              Authenticated
            </span>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" /> Provider
            </label>
            <select
              value={settings.provider}
              onChange={(e) => setSettings((prev) => ({ ...prev, provider: e.target.value as AISettings["provider"] }))}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white"
            >
              <option value="gemini">Gemini</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5" /> Voice Transcription Model
              </label>
              <select
                value={settings.model.voiceTranscriptionModel}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    model: { ...prev.model, voiceTranscriptionModel: e.target.value },
                  }))
                }
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white"
              >
                <option value="gemini-2-flash">Gemini 2 Flash</option>
                <option value="gemini-3-flash">Gemini 3 Flash</option>
                <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                <option value="gemini-3-pro-preview">Gemini 3 Pro Preview</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5" /> Abstraction Model
              </label>
              <select
                value={settings.model.abstractionModel}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    model: { ...prev.model, abstractionModel: e.target.value },
                  }))
                }
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white"
              >
                <option value="gemini-2-flash">Gemini 2 Flash</option>
                <option value="gemini-3-flash">Gemini 3 Flash</option>
                <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                <option value="gemini-3-pro-preview">Gemini 3 Pro Preview</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5" /> Temperature
              </label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={settings.temperature}
                onChange={(e) => setSettings((prev) => ({ ...prev, temperature: Number(e.target.value) }))}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5" /> Max Tokens
              </label>
              <input
                type="number"
                min={256}
                max={8192}
                step={256}
                value={settings.maxTokens}
                onChange={(e) => setSettings((prev) => ({ ...prev, maxTokens: Number(e.target.value) }))}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white"
              />
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
              Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AIFeaturesSettings;