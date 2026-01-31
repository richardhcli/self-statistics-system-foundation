import React, { useState } from 'react';
import { Database, Sparkles, UserCheck, Loader2, Trash2, Network, Brain } from 'lucide-react';
import { AppData } from '@/types';
import { injectTestData, injectTopologyData, injectBrainTopologyData } from '../api/test-injections';
import { clearAllTables } from '@/lib/db';
import { WipeConfirmationModal } from './wipe-confirmation-modal';
import { INITIAL_APP_DATA } from '@/stores/user-data/constants';

interface DataInjectionPanelProps {
  data: AppData;
  setData: (fn: (prev: AppData) => AppData) => void;
}

const DataInjectionPanel: React.FC<DataInjectionPanelProps> = ({ data, setData }) => {
  const [loading, setLoading] = useState<'ai' | 'manual' | 'clear' | 'topology' | 'brain' | null>(null);
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  
  const handleInject = async (isAI: boolean) => { 
    setLoading(isAI ? 'ai' : 'manual'); 
    // Pass current data to injectTestData as required by its updated signature
    try { await injectTestData(data, setData, isAI); } finally { setLoading(null); } 
  };
  
  const handleTopologyInject = async () => {
    setLoading('topology');
    try { 
      await injectTopologyData(setData); 
      alert("Complex Neural Topology Injected.");
    } finally { setLoading(null); }
  };

  const handleBrainInject = async () => {
    setLoading('brain');
    try { 
      await injectBrainTopologyData(setData); 
      alert("Brain Topology Injected.");
    } finally { setLoading(null); }
  };
  
  const handleClear = async () => { 
    setLoading('clear'); 
    try { 
      await clearAllTables(); 
      setData(() => ({ ...INITIAL_APP_DATA })); 
      setIsWipeModalOpen(false);
    } finally { setLoading(null); } 
  };
  
  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-2xl transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg"><Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
          <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">Batch Injection</h3>
        </div>
        <button 
          onClick={() => setIsWipeModalOpen(true)} 
          disabled={loading !== null} 
          className="p-2 text-slate-400 hover:text-red-500 transition-colors" 
          title="Factory Reset Brain"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => handleInject(true)} 
          disabled={loading !== null} 
          className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl hover:border-indigo-500 transition-colors group"
        >
          {loading === 'ai' ? <Loader2 className="animate-spin w-6 h-6 text-indigo-600" /> : <Sparkles className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />}
          <span className="text-[10px] font-black uppercase mt-2 dark:text-slate-300">AI Records</span>
        </button>
        
        <button 
          onClick={() => handleInject(false)} 
          disabled={loading !== null} 
          className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl hover:border-emerald-500 transition-colors group"
        >
          {loading === 'manual' ? <Loader2 className="animate-spin w-6 h-6 text-emerald-600" /> : <UserCheck className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />}
          <span className="text-[10px] font-black uppercase mt-2 dark:text-slate-300">Manual Records</span>
        </button>

        <button 
          onClick={handleTopologyInject} 
          disabled={loading !== null} 
          className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl hover:border-amber-500 transition-colors group"
        >
          {loading === 'topology' ? <Loader2 className="animate-spin w-6 h-6 text-amber-600" /> : <Network className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform" />}
          <span className="text-[10px] font-black uppercase mt-2 dark:text-slate-300">Complex Set</span>
        </button>

        <button 
          onClick={handleBrainInject} 
          disabled={loading !== null} 
          className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-xl hover:border-purple-500 transition-colors group"
        >
          {loading === 'brain' ? <Loader2 className="animate-spin w-6 h-6 text-purple-600" /> : <Brain className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />}
          <span className="text-[10px] font-black uppercase mt-2 dark:text-slate-300">Brain Set</span>
        </button>
      </div>

      <WipeConfirmationModal 
        isOpen={isWipeModalOpen}
        onClose={() => setIsWipeModalOpen(false)}
        onConfirm={handleClear}
        isWiping={loading === 'clear'}
      />
    </div>
  );
};

export default DataInjectionPanel;