
import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface WipeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isWiping: boolean;
}

/**
 * Component: WipeConfirmationModal
 * 
 * High-fidelity safety gate for the Neural Wipe feature.
 * Requires user to type 'DELETE' to enable the destructive action.
 */
export const WipeConfirmationModal: React.FC<WipeConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  isWiping 
}) => {
  const [confirmationText, setConfirmationText] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmationText === 'DELETE';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-black text-red-900 uppercase tracking-tight">Catastrophic Reset</h3>
          </div>
          <button onClick={onClose} className="p-1 text-red-400 hover:text-red-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-700 leading-relaxed">
              You are about to permanently erase all local journaling data, graph topology, and player statistics.
            </p>
            <p className="text-xs font-medium text-slate-500 italic">
              This action is irreversible and will reset the brain to factory defaults.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Type 'DELETE' to confirm
            </label>
            <input 
              type="text"
              autoFocus
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-slate-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none transition-all placeholder:text-slate-300"
              placeholder="DELETE"
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 text-slate-600 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              disabled={!isConfirmed || isWiping}
              className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
            >
              {isWiping ? 'Wiping...' : 'Neural Wipe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
