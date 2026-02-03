
import React, { useRef, useEffect } from 'react';
import { TranscriptionSegment } from '../types';

interface TranscriptionListProps {
  history: TranscriptionSegment[];
  interimText: string;
}

export const TranscriptionList: React.FC<TranscriptionListProps> = ({ history, interimText }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, interimText]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
      {history.length === 0 && !interimText && (
        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
          <svg className="w-12 h-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <p className="font-medium">Ready for your voice input...</p>
        </div>
      )}

      {history.map(item => (
        <div key={item.id} className="max-w-3xl animate-in fade-in slide-in-from-bottom-2">
          <p className="text-xl leading-relaxed text-slate-800 font-light">{item.text}</p>
          <div className="flex items-center gap-2 mt-2">
            <time className="text-[10px] text-slate-400 font-mono tracking-tighter">
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </time>
          </div>
        </div>
      ))}

      {interimText && (
        <div className="max-w-3xl border-l-4 border-blue-500 pl-6 py-2 bg-blue-50/30 rounded-r-xl">
          <p className="text-xl text-blue-700 leading-relaxed italic">{interimText}</p>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-2 block">Live Processing</span>
        </div>
      )}
      
      <div ref={bottomRef} className="h-12" />
    </div>
  );
};
