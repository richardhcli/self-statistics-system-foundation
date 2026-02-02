
import React from 'react';
import Header, { AppView } from './header';

interface MainLayoutProps {
  children: React.ReactNode;
  view: AppView;
  setView: (view: AppView) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, view, setView }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans text-slate-900 dark:text-white transition-colors">
      <Header view={view} setView={setView} />
      <main className="flex-1 w-full px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;