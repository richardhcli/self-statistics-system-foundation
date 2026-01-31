
import React from 'react';
import { Shield, Eye, Lock, Fingerprint } from 'lucide-react';

const PrivacySettings: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Privacy & Security</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage your data encryption and access.</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { icon: Lock, label: 'End-to-End Encryption', desc: 'All local data is encrypted before being stored in IndexedDB.', active: true },
            { icon: Eye, label: 'Visibility Mode', desc: 'Control who can view your action graph summaries.', active: false },
            { icon: Fingerprint, label: 'Biometric Unlock', desc: 'Require biometric authentication to open the app.', active: false }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-xl text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.label}</h4>
                  <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${item.active ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.active ? 'right-1' : 'left-1'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
