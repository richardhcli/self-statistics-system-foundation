import React, { useRef, useState } from 'react';
import { BookMarked, History, Network, CreditCard, BarChart3, Terminal, Settings, Edit3, Share2 } from 'lucide-react';

export type AppView = 'journal' | 'graph' | 'dev-graph' | 'statistics' | 'billing' | 'settings' | 'debug' | 'integrations';

interface HeaderProps {
  view: AppView;
  setView: (view: AppView) => void;
}

const Header: React.FC<HeaderProps> = ({ view, setView }) => {
  const navRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!navRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - navRef.current.offsetLeft);
    setScrollLeft(navRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !navRef.current) return;
    e.preventDefault();
    const x = e.pageX - navRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    navRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <header className="header-glass border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 select-none transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8 flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">Journaling <span className="text-indigo-600">AI</span></h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Growth Records</p>
            </div>
          </div>

          <nav 
            ref={navRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className={`flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0 transition-all cursor-grab header-nav-container ${isDragging ? 'cursor-grabbing' : ''}`}
          >
            {[
              { id: 'journal', icon: History, label: 'Journal' },
              { id: 'graph', icon: Network, label: 'Concept Graph' },
              { id: 'dev-graph', icon: Edit3, label: 'Dev Graph' },
              { id: 'statistics', icon: BarChart3, label: 'Statistics' },
              { id: 'integrations', icon: Share2, label: 'Integrations' },
              { id: 'billing', icon: CreditCard, label: 'Billing' },
              { id: 'settings', icon: Settings, label: 'Settings' },
              { id: 'debug', icon: Terminal, label: 'Debug' },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => !isDragging && setView(item.id as AppView)}
                className={`header-nav-item flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all whitespace-nowrap ${
                  view === item.id 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;