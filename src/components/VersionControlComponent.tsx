import React, { useState } from 'react';
import { ResumeData } from '../types';
import { History, Save, RotateCcw, Trash2, Calendar, FileText } from 'lucide-react';

interface VersionSnapshot {
  id: string;
  name: string;
  timestamp: string;
  data: ResumeData;
}

interface VersionControlProps {
  currentData: ResumeData;
  onRestore: (data: ResumeData) => void;
}

export default function VersionControl({ currentData, onRestore }: VersionControlProps) {
  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>([
    {
      id: 'snap-1',
      name: 'Baseline alex_morgan_cv (Preloaded)',
      timestamp: new Date().toLocaleString(),
      data: currentData
    }
  ]);
  const [saveName, setSaveName] = useState('');

  const handleSave = () => {
    if (!saveName.trim()) return;
    const newSnap: VersionSnapshot = {
      id: `snap-${Date.now()}`,
      name: saveName.trim(),
      timestamp: new Date().toLocaleString(),
      data: JSON.parse(JSON.stringify(currentData)) // deep copy
    };
    setSnapshots([newSnap, ...snapshots]);
    setSaveName('');
  };

  const handleRestore = (snap: VersionSnapshot) => {
    onRestore(JSON.parse(JSON.stringify(snap.data)));
  };

  const handleDelete = (id: string) => {
    setSnapshots(snapshots.filter(s => s.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-950 text-xs sm:text-sm">Sandbox Version Control</h3>
            <p className="text-[10px] text-slate-500 font-medium">Backup & restore tailor drafts locally</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* Create new snapshot */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Save Current Draft Snapshot</span>
          <div className="flex gap-2">
            <input 
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. McKinsey tailor / AI polished..."
              className="flex-1 text-xs p-2.5 bg-white border border-slate-250 rounded-xl focus:outline-none"
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-extrabold px-3.5 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-3xs"
            >
              <Save className="w-3.5 h-3.5" /> Save Version
            </button>
          </div>
        </div>

        {/* Snapshots history list */}
        <div className="space-y-3">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Local Snapshot History</span>
          
          {snapshots.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              No saved resume versions found.
            </div>
          ) : (
            <div className="space-y-2.5">
              {snapshots.map((snap) => (
                <div key={snap.id} className="flex justify-between items-center p-3.5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-all hover:shadow-3xs">
                  <div className="space-y-1 pr-4">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      {snap.name}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <Calendar className="w-3 h-3" /> {snap.timestamp}
                    </div>
                  </div>

                  <div className="flex gap-1.5 items-center shrink-0">
                    <button
                      onClick={() => handleRestore(snap)}
                      className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                      title="Load this version"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Restore</span>
                    </button>
                    <button
                      onClick={() => handleDelete(snap.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-all"
                      title="Delete snapshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
