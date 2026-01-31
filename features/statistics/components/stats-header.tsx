
import React from 'react';
import { UserCircle, Sparkles, Zap, CalendarDays } from 'lucide-react';
import { AppData, UserInformation } from '@/types';

interface StatsHeaderProps {
  userInformation: UserInformation;
  totalExp: number;
  expToday: number;
  expYesterday: number;
  playerExpProgress: number;
  setData?: React.Dispatch<React.SetStateAction<AppData>>;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ 
  userInformation, 
  totalExp, 
  expToday, 
  expYesterday, 
  playerExpProgress 
}) => {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
          <UserCircle className="w-12 h-12" />
        </div>
        <div className="flex-1">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{userInformation?.name || 'Neural Pioneer'}</h2>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Class: {userInformation?.userClass || 'None'}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight flex items-center gap-1.5">
                <Zap className="w-2.5 h-2.5 text-amber-500" /> Recent: {userInformation?.mostRecentAction || 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end">
        <div className="text-right mb-2">
          <div className="flex items-baseline gap-2 justify-end">
            <span className="text-3xl font-black text-slate-900 tracking-tighter">{totalExp.toFixed(1)}</span>
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total EXP</span>
          </div>
          <div className="mt-1 space-y-0.5">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Gained Today:</span>
              <span className="text-[11px] font-black text-indigo-600">+{expToday.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Gained Yesterday:</span>
              <span className="text-[11px] font-black text-slate-600">+{expYesterday.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div 
            className="h-full bg-indigo-600 transition-all duration-1000 shadow-[0_0_8px_rgba(79,70,229,0.4)]" 
            style={{ width: `${playerExpProgress}%` }} 
          />
        </div>
      </div>
    </div>
  );
};
