
import React from 'react';
import { ConnectionStatus } from '../types';

interface HeaderProps {
  status: ConnectionStatus;
  onToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onToggle }) => (
  <header className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
    <div>
      <h1 className="text-xl font-bold tracking-tight text-slate-900">Gemini Live Transcribe</h1>
      <div className="flex items-center gap-2 mt-1">
        <span className={`h-2 w-2 rounded-full ${status === ConnectionStatus.ACTIVE ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{status}</p>
      </div>
    </div>
    <button 
      onClick={onToggle}
      disabled={status === ConnectionStatus.CONNECTING}
      className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 shadow-sm ${
        status === ConnectionStatus.ACTIVE 
          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
          : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200'
      }`}
    >
      {status === ConnectionStatus.ACTIVE ? 'Stop Listening' : status === ConnectionStatus.CONNECTING ? 'Connecting...' : 'Start Session'}
    </button>
  </header>
);
