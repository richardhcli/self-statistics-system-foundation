
import React from 'react';
import { Brain, Activity, User, Zap } from 'lucide-react';

interface AttributesGridProps {
  domains: Record<string, number>;
}

export const AttributesGrid: React.FC<AttributesGridProps> = ({ domains }) => {
  // Fix: Mapped attributes to the updated characteristic names used in the 3-layer AI pipeline
  const attributes = [
    { name: 'Intellect', val: Math.min(100, (domains.Intellect || 0) * 10 + 10), icon: Brain, color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Vitality', val: Math.min(100, (domains.Vitality || 0) * 10 + 10), icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { name: 'Charisma', val: Math.min(100, (domains.Social || 0) * 10 + 10), icon: User, color: 'text-violet-500', bg: 'bg-violet-50' },
    { name: 'Wisdom', val: Math.min(100, (domains.Wisdom || 0) * 10 + 10), icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {attributes.map(attr => (
        <div key={attr.name} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-6">
            <div className={`p-4 rounded-2xl ${attr.bg} ${attr.color} group-hover:scale-110 transition-transform`}>
              <attr.icon className="w-7 h-7" />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Power Level</span>
              <span className="text-3xl font-black text-slate-900">{attr.val}%</span>
            </div>
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">{attr.name} Path</h3>
          <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${attr.color.replace('text', 'bg')} transition-all duration-1000 ease-out`} 
              style={{ width: `${attr.val}%` }} 
            />
          </div>
        </div>
      ))}
    </div>
  );
};
