
import React, { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, FileJson, Loader2, CheckCircle2 } from 'lucide-react';
import { AppData } from '@/types';
import { exportAppState, parseAndValidateBackup } from '@/stores/app-data';

interface DataPortabilityProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

/**
 * Component: DataPortability
 * 
 * Functional Description:
 * Provides the UI for manual data backup and restoration.
 * Delegating core logic to 'stores/user-data/utils/data-portability'.
 */
export const DataPortability: React.FC<DataPortabilityProps> = ({ data, setData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Triggers the backup export process via utility.
   */
  const handleExport = () => {
    try {
      exportAppState(data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  /**
   * Triggers file selection dialog.
   */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handles file reading and validation using centralized utilities.
   */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    setStatus('importing');

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const validatedData = parseAndValidateBackup(content);

        if (confirm("WARNING: This will overwrite your current local state. This action cannot be undone. Proceed?")) {
          setData(validatedData);
          setStatus('success');
          setTimeout(() => setStatus('idle'), 3000);
        } else {
          setStatus('idle');
        }
      } catch (err: any) {
        console.error("Import failed:", err);
        setErrorMessage(err.message || "An unknown error occurred during import.");
        setStatus('error');
        setTimeout(() => setStatus('idle'), 5000);
      }
    };

    reader.onerror = () => {
      setErrorMessage("Failed to read the selected file.");
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    };

    reader.readAsText(file);
    
    // Clear the input value so the same file can be re-selected if an error occurred
    if (e.target) e.target.value = '';
  };

  return (
    <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
          <FileJson className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">Data Portability</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Backup & Restore Neural State</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Column */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between group hover:border-indigo-200 transition-colors">
          <div className="mb-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1 flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Export Neural State
            </h4>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Download your entire Second Brain as a portable JSON file.
            </p>
          </div>
          <button 
            onClick={handleExport}
            className="w-full py-3 bg-white border border-slate-200 text-slate-900 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
          >
            Generate Backup
          </button>
        </div>

        {/* Import Column */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between group hover:border-amber-200 transition-colors">
          <div className="mb-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1 flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" /> Import Neural State
            </h4>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
              Restore a backup file. Note: This will <span className="text-red-500 font-bold uppercase">overwrite</span> local data.
            </p>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileChange} 
            accept=".json" 
            className="hidden" 
          />

          <button 
            onClick={handleImportClick}
            disabled={status === 'importing'}
            className={`w-full py-3 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${
              status === 'success' 
                ? 'bg-emerald-500 text-white border-emerald-500' 
                : status === 'error'
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white border border-slate-200 text-slate-900 hover:bg-amber-500 hover:text-white hover:border-amber-500'
            }`}
          >
            {status === 'importing' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : status === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : status === 'error' ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              'Upload JSON File'
            )}
            {status === 'success' ? 'Import Complete' : status === 'error' ? 'Import Failed' : 'Select File'}
          </button>
        </div>
      </div>

      {status === 'error' && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in shake duration-500">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight">
            {errorMessage}
          </p>
        </div>
      )}

      <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl flex gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
          <strong>Security Note:</strong> Backup files contain your raw journal entries and personal data. Store exported JSON files in a secure location and never upload untrusted backups.
        </p>
      </div>
    </section>
  );
};
