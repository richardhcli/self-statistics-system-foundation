
import React from 'react';

export const Footer: React.FC = () => (
  <footer className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
    <div className="flex gap-4">
      <span>Gemini 2.5 Flash</span>
      <span className="opacity-40">|</span>
      <span>16kHz PCM Audio</span>
    </div>
    <span>Low-Latency Transcription Engine</span>
  </footer>
);
