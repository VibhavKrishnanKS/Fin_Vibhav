
import React, { useState } from 'react';
import { Category } from '../types';

interface CategorySettingsProps {
  categories: Category[];
  onAdd: (name: string, type: 'income' | 'expense') => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const CategorySettings: React.FC<CategorySettingsProps> = ({ categories, onAdd, onUpdate, onDelete }) => {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = (e: React.FormEvent) => { e.preventDefault(); if (!newName.trim()) return; onAdd(newName.trim(), newType); setNewName(''); };
  const handleUpdate = (id: string) => { if (!editName.trim()) return; onUpdate(id, editName.trim()); setEditingId(null); };

  const inputClass = "w-full glass bg-white/[0.02] border-white/5 rounded-2xl px-5 py-3.5 text-xs font-bold text-white focus:border-[#4285F4]/40 focus:bg-white/[0.08] outline-none transition-all placeholder:text-gray-700";
  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1";

  return (
    <div className="glass rounded-[36px] p-6 sm:p-10 relative overflow-hidden" style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}>
      <div className="mb-10 flex items-center gap-2">
         <i className="fa-solid fa-tags text-[#4285F4] text-xs"></i>
         <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Sector Taxonomy</h3>
      </div>

      {/* Protocol Injector Form */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 mb-10 p-6 rounded-[28px] glass relative overflow-hidden border-white/5">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/20"></div>
        <div className="flex-1 space-y-2">
           <label className={labelClass}>Sector Descriptor</label>
           <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Assign sector name..."
             className={inputClass} />
        </div>
        <div className="sm:w-48 space-y-2">
           <label className={labelClass}>Classification</label>
           <div className="relative">
              <select value={newType} onChange={(e) => setNewType(e.target.value as any)}
                className={inputClass}>
                <option value="expense" className="bg-[#121214]">Outflow Sector</option>
                <option value="income" className="bg-[#121214]">Revenue Sector</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none text-xs"></i>
           </div>
        </div>
        <div className="flex items-end">
           <button type="submit" className="w-full sm:w-auto px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-white btn-primary-glow shadow-xl active:scale-95 transition-all">
             Deploy
           </button>
        </div>
      </form>

      {/* Taxonomy Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {(['income', 'expense'] as const).map(type => {
          const items = categories.filter(c => c.type === type);
          const color = type === 'income' ? '#34A853' : '#EA4335';
          return (
            <div key={type} className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ color, background: color }}></div>
                  <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">{type} Matrix</h4>
                </div>
                <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">{items.length} Units</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {items.map((c, i) => (
                  <div key={c.id} className="group flex items-center justify-between px-5 py-4 rounded-2xl glass border-white/5 transition-all duration-300 relative overflow-hidden"
                    style={{ animation: `fadeUp 0.5s ease-out ${i * 0.05}s both` }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: color, boxShadow: `0 0 10px ${color}` }}></div>
                    
                    {editingId === c.id ? (
                      <div className="flex-1 flex gap-3">
                         <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                           onBlur={() => handleUpdate(c.id)} onKeyDown={(e) => e.key === 'Enter' && handleUpdate(c.id)}
                           className={`${inputClass} !py-2`} />
                         <button onClick={() => handleUpdate(c.id)} className="px-4 py-2 glass text-[9px] font-black text-[#4285F4] uppercase tracking-widest">Commit</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-4 min-w-0">
                          <i className={`fa-solid ${type === 'income' ? 'fa-plus-hexagon' : 'fa-minus-hexagon'} text-[10px]`} style={{ color }}></i>
                          <span className="text-sm font-bold text-gray-200 tracking-tight transition-colors group-hover:text-white">{c.name}</span>
                        </div>
                        <div className="flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                          <button onClick={() => { setEditingId(c.id); setEditName(c.name); }}
                            className="w-9 h-9 rounded-xl glass flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#4285F4]/20 transition-all">
                            <i className="fa-solid fa-pen-nib text-[10px]"></i>
                          </button>
                          <button onClick={() => onDelete(c.id)}
                            className="w-9 h-9 rounded-xl glass flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/20 transition-all">
                            <i className="fa-solid fa-xmark text-xs"></i>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 glass rounded-3xl opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Matrix Empty</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

export default CategorySettings;
