
import React from 'react';

/**
 * Component: GraphLegend
 * 
 * Functional Description:
 * Provides a UI overlay for the Network Visualization. It displays:
 * 1. The name of the graph visualization.
 * 2. A color legend identifying root domains, skills, and actions.
 * 3. User instructions (interaction cues).
 */
export const GraphLegend: React.FC = () => {
  return (
    <>
      {/* Top Left: Title and Legend */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-black uppercase rounded-lg shadow-xl border border-slate-700">
          Concept Graph
        </div>
        <div className="flex flex-col gap-1.5 px-1 mt-1">
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-indigo-600">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4f46e5]"/> Characteristic (Being)
          </span>
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-amber-600">
            <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"/> Skill (Knowing)
          </span>
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-600">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]"/> Action (Doing)
          </span>
          <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 border border-slate-300"/> Abstract
          </span>
        </div>
      </div>
      
      {/* Bottom Right: Interaction Cue */}
      <div className="absolute bottom-6 right-6 z-10 text-[9px] font-black uppercase tracking-widest text-slate-300 pointer-events-none">
        Drag to swap • AI-Categorized Network Topology
      </div>
    </>
  );
};
