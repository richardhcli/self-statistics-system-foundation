
import React from 'react';
import Header, { AppView } from './header';

interface MainLayoutProps {
  children: React.ReactNode;
  view: AppView;
  setView: (view: AppView) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, view, setView }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header view={view} setView={setView} />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
