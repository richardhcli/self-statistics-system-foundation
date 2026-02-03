
import React from 'react';
import { ConnectionStatus } from './types';
import { useTranscription } from './hooks/useTranscription';
import { Header } from './components/Header';
import { TranscriptionList } from './components/TranscriptionList';
import { Footer } from './components/Footer';

/**
 * Main App Component
 * Orchestrates the transcription lifecycle and UI modularization.
 */
export default function App() {
  const { status, history, interimText, start, stop } = useTranscription();

  const handleToggle = () => {
    if (status === ConnectionStatus.ACTIVE) {
      stop();
    } else {
      start();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white selection:bg-blue-100">
      <Header status={status} onToggle={handleToggle} />
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-white to-slate-50/30">
        <TranscriptionList history={history} interimText={interimText} />
      </main>
      <Footer />
    </div>
  );
}
