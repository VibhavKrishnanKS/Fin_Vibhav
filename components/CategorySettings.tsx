
import React, { useState } from 'react';
import { Category } from '../types';

interface CategorySettingsProps {
  categories: Category[];
  onAdd:    (name: string, type: 'income' | 'expense') => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const CategorySettings: React.FC<CategorySettingsProps> = ({ categories, onAdd, onUpdate, onDelete }) => {
  const [newName,   setNewName]   = useState('');
  const [newType,   setNewType]   = useState<'income' | 'expense'>('expense');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName,  setEditName]  = useState('');

  const handleAdd    = (e: React.FormEvent) => { e.preventDefault(); if (!newName.trim()) return; onAdd(newName.trim(), newType); setNewName(''); };
  const handleUpdate = (id: string) => { if (!editName.trim()) return; onUpdate(id, editName.trim()); setEditingId(null); };

  const inp  = "w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-white outline-none transition-all placeholder:text-[var(--text-3)]";
  const inpS = { background: 'var(--surface-2)', border: '1px solid var(--border)' } as React.CSSProperties;

  const GROUP_COLOR: Record<string, string> = { income: '#5ecb8a', expense: '#e8685e' };
  const GROUP_ICON:  Record<string, string> = { income: 'fa-arrow-trend-up', expense: 'fa-arrow-trend-down' };

  return (
    <div className="rounded-[22px] p-5 sm:p-7 relative overflow-hidden"
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', animation: 'fadeUp 0.4s ease 0.1s both' }}>

      {/* Section header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(94,203,138,0.12)', color: '#5ecb8a' }}>
          <i className="fa-solid fa-tags text-[11px]" />
        </div>
        <div>
          <h2 className="font-display font-bold text-white text-base tracking-tight">Manage Categories</h2>
          <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>Income &amp; expense labels</p>
        </div>
      </div>

      {/* ── Add form ── */}
      <form onSubmit={handleAdd}
        className="flex flex-col sm:flex-row gap-3 mb-7 p-4 rounded-[18px]"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-3)' }}>Category Name</p>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Groceries, Freelance…"
            className={inp} style={inpS} />
        </div>
        <div className="sm:w-40">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-3)' }}>Type</p>
          <select value={newType} onChange={e => setNewType(e.target.value as any)}
            className={inp} style={{ ...inpS, appearance: 'none' as any }}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-[11px] font-semibold text-white btn-primary-glow active:scale-95 shine-hover">
            Add
          </button>
        </div>
      </form>

      {/* ── Category columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(['income', 'expense'] as const).map(type => {
          const items = categories.filter(c => c.type === type);
          const color = GROUP_COLOR[type];
          const icon  = GROUP_ICON[type];

          return (
            <div key={type} className="space-y-3">
              {/* Group header */}
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}14`, color }}>
                    <i className={`fa-solid ${icon} text-[10px]`} />
                  </div>
                  <h3 className="text-[12px] font-semibold capitalize" style={{ color: 'var(--text-1)' }}>
                    {type} Categories
                  </h3>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                  style={{ background: `${color}10`, color }}>
                  {items.length}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                {items.map((cat, i) => (
                  <div key={cat.id}
                    className="group flex items-center justify-between px-4 py-3 rounded-[14px] relative overflow-hidden transition-all duration-150"
                    style={{ animation: `fadeUp 0.3s ease ${i * 0.04}s both`, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>

                    {/* Hover accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: color }} />

                    {editingId === cat.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onBlur={() => handleUpdate(cat.id)}
                          onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)}
                          className={`${inp} flex-1 py-2`}
                          style={inpS}
                        />
                        <button onClick={() => handleUpdate(cat.id)}
                          className="px-3.5 py-2 rounded-xl text-[10px] font-semibold transition-all"
                          style={{ background: 'rgba(108,158,248,0.1)', color: 'var(--primary)' }}>
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-[13px] font-medium text-white truncate">{cat.name}</span>
                        </div>
                        <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                            <i className="fa-solid fa-pen text-[9px]" />
                          </button>
                          <button
                            onClick={() => onDelete(cat.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                            <i className="fa-solid fa-xmark text-[10px]" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="flex items-center justify-center py-8 rounded-[14px]"
                    style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)' }}>
                    <p className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>No {type} categories yet</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySettings;
