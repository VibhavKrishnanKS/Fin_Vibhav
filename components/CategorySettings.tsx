
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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName.trim(), newType);
    setNewName('');
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    onUpdate(id, editName.trim());
    setEditingId(null);
  };

  const renderCategoryTag = (c: Category) => (
    <div key={c.id} className="group flex items-center justify-between px-4 py-3 bg-zinc-900 border border-white/5 rounded-2xl text-[11px] font-bold text-zinc-200 transition-all hover:border-[#d4af37]/20 hover:bg-zinc-800">
      {editingId === c.id ? (
        <div className="flex gap-2 w-full">
          <input 
            autoFocus
            className="flex-1 px-3 py-1.5 bg-zinc-950 border border-[#d4af37]/30 rounded-xl text-[10px] outline-none text-white font-bold"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => handleUpdate(c.id)}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate(c.id)}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className={`w-1.5 h-1.5 rounded-full ${c.type === 'income' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}></span>
            <span className="truncate">{c.name}</span>
          </div>
          <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => { setEditingId(c.id); setEditName(c.name); }} className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-[#d4af37] transition-colors"><i className="fa-solid fa-pen text-[9px]"></i></button>
            <button onClick={() => onDelete(c.id)} className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-rose-600 transition-colors"><i className="fa-solid fa-xmark text-[9px]"></i></button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="glass-card p-6 md:p-8 lg:p-10 rounded-[2.5rem] shadow-2xl max-w-full overflow-hidden border border-white/5">
      <div className="mb-8">
        <h3 className="text-[11px] font-bold text-[#d4af37] tracking-[0.3em] uppercase">Taxonomy Controls</h3>
        <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1 tracking-widest opacity-60">Classification and Ledger Labels</p>
      </div>
      
      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-10 p-4 md:p-5 bg-zinc-950/50 rounded-3xl border border-white/5">
        <input 
          type="text" 
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New Label Name..."
          className="col-span-1 sm:col-span-6 px-5 py-3.5 bg-zinc-900 border border-white/5 rounded-2xl outline-none font-bold text-white text-xs placeholder:text-zinc-700 focus:border-[#d4af37]/30 transition-all"
        />
        <div className="col-span-1 sm:col-span-6 flex gap-3">
          <select 
            value={newType}
            onChange={(e) => setNewType(e.target.value as any)}
            className="flex-1 px-5 py-3.5 bg-zinc-900 border border-white/5 rounded-2xl outline-none font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-400 appearance-none cursor-pointer hover:bg-zinc-800 transition-colors"
          >
            <option value="expense">DEBIT</option>
            <option value="income">CREDIT</option>
          </select>
          <button type="submit" className="px-8 py-3.5 bg-[#d4af37] text-[#0a0a0b] font-bold rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-yellow-900/10 whitespace-nowrap">
            REGISTER
          </button>
        </div>
      </form>

      <div className="space-y-12">
        <div>
          <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-6 flex items-center gap-3">
            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
            Income Clusters
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.filter(c => c.type === 'income').map(renderCategoryTag)}
          </div>
        </div>
        <div>
          <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-6 flex items-center gap-3">
            <span className="w-1 h-1 rounded-full bg-rose-500"></span>
            Expenditure Clusters
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.filter(c => c.type === 'expense').map(renderCategoryTag)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySettings;
