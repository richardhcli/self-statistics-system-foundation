
import React, { useState, useEffect } from 'react';
// Added Loader2 to the lucide-react imports
import { Save, Sparkles, Layout, Eye, EyeOff, Moon, Sun, Loader2 } from 'lucide-react';
import { AppData } from '@/types';

interface StatusDisplaySettingsProps {
  data: AppData;
  setData: (fn: (prev: AppData) => AppData) => void;
}

const StatusDisplaySettings: React.FC<StatusDisplaySettingsProps> = ({ data, setData }) => {
  const [formData, setFormData] = useState({
    name: data.userInformation.name || '',
    userClass: data.userInformation.userClass || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setData(prev => ({
      ...prev,
      userInformation: {
        ...prev.userInformation,
        name: formData.name,
        userClass: formData.userClass
      }
    }));
    
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white transition-all"
                placeholder="e.g. Neural Pioneer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Character Class</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.userClass}
                  onChange={(e) => setFormData(prev => ({ ...prev, userClass: e.target.value }))}
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-900 dark:text-white transition-all pl-12"
                  placeholder="e.g. Master Architect"
                />
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Player Status Visibility</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Show Cumulative EXP', active: true },
                { label: 'Show Mastery Levels', active: true },
                { label: 'Show Recent Action', active: true },
                { label: 'Animate Progress Bars', active: true },
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">{pref.label}</span>
                  <button type="button" className="text-indigo-600">
                    {pref.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
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
