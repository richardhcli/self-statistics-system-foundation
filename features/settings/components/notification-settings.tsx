
import React from 'react';
import { Bell, Smartphone, Mail, Zap } from 'lucide-react';

const NotificationSettings: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Communication Prefs</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">How the system keeps you updated.</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { icon: Smartphone, label: 'Push Notifications', desc: 'Real-time updates on task completion and level-ups.', active: true },
            { icon: Mail, label: 'Weekly Summary', desc: 'Email reports detailing your growth and action map progress.', active: true },
            { icon: Zap, label: 'Instant Feedback', desc: 'Audio and haptic feedback during voice journaling.', active: true }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-xl text-slate-400 group-hover:text-amber-500 transition-colors">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.label}</h4>
                  <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${item.active ? 'bg-amber-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.active ? 'right-1' : 'left-1'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
