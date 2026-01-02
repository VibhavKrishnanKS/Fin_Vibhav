
import React, { useState } from 'react';
import { Account, AccountType } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

interface AccountSettingsProps {
  accounts: Account[];
  onAdd: (account: Omit<Account, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Account>) => void;
  onDelete: (id: string) => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ accounts, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [newLimit, setNewLimit] = useState('500000');
  const [newType, setNewType] = useState<AccountType>('bank');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [editType, setEditType] = useState<AccountType>('bank');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newBalance) return;
    onAdd({
      name: newName.trim(),
      balance: parseFloat(newBalance),
      type: newType,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`, 
      creditLimit: newType === 'credit' ? parseFloat(newLimit) : undefined
    });
    setNewName('');
    setNewBalance('');
    setIsAdding(false);
  };

  const startEditing = (acc: Account) => {
    setEditingId(acc.id);
    setEditName(acc.name);
    setEditBalance(acc.balance.toString());
    setEditType(acc.type);
    setEditLimit(acc.creditLimit?.toString() || '0');
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim() || !editBalance) return;
    onUpdate(id, { 
      name: editName.trim(), 
      balance: parseFloat(editBalance),
      type: editType,
      creditLimit: editType === 'credit' ? parseFloat(editLimit) : undefined
    });
    setEditingId(null);
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 p-6 md:p-8 lg:p-10 rounded-[2.5rem] shadow-2xl overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h3 className="text-[11px] font-bold text-[#d4af37] tracking-[0.3em] uppercase">Asset Controls</h3>
          <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1 tracking-widest opacity-60">Institutional and Personal Accounts</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black transition-all text-[10px] tracking-widest uppercase shadow-xl hover:scale-[1.05] active:scale-95 ${isAdding ? 'bg-zinc-800 text-white' : 'bg-[#d4af37] text-[#0a0a0b]'}`}
        >
          {isAdding ? 'CANCEL' : 'REGISTER NEW ASSET'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-10 p-6 bg-zinc-950/50 rounded-[2rem] border border-white/5 space-y-6 animate-slide-down shadow-inner">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-3 ml-1">Asset Identity</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Neo Bank Savings" className="w-full px-5 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-white font-bold text-sm focus:border-[#d4af37]/50" />
            </div>
            <div>
              <label className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-3 ml-1">Asset Category</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className="w-full px-5 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-white font-bold text-sm focus:border-[#d4af37]/50 appearance-none">
                <option value="bank">Bank Account</option>
                <option value="credit">Credit Line</option>
                <option value="cash">Vault Liquid</option>
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-3 ml-1">Verified Balance</label>
              <input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} placeholder="0.00" className="w-full px-5 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-white font-bold text-sm focus:border-[#d4af37]/50" />
            </div>
            {newType === 'credit' && (
              <div>
                <label className="block text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-3 ml-1">Authorized Limit</label>
                <input type="number" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} placeholder="500000" className="w-full px-5 py-4 bg-zinc-900 border border-white/5 rounded-2xl text-white font-bold text-sm focus:border-[#d4af37]/50" />
              </div>
            )}
            <div className="col-span-1 md:col-span-2 flex justify-end">
              <button type="submit" className="w-full sm:w-auto px-12 py-4 bg-white text-zinc-900 font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-2xl hover:scale-[1.05] active:scale-95 transition-all">EXECUTE REGISTRATION</button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3">
        {accounts.map((acc, idx) => (
          <div key={acc.id} 
               className="p-6 bg-zinc-950/30 border border-white/5 rounded-[2rem] transition-all duration-300 hover:bg-zinc-800/40 hover:border-[#d4af37]/20 group">
            {editingId === acc.id ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input className="px-4 py-3 bg-zinc-900 border border-[#d4af37]/50 rounded-xl font-bold text-white text-xs" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" />
                <input className="px-4 py-3 bg-zinc-900 border border-[#d4af37]/50 rounded-xl font-bold text-white text-xs" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} placeholder="Value" />
                <select className="px-4 py-3 bg-zinc-900 border border-[#d4af37]/50 rounded-xl font-bold text-white text-xs" value={editType} onChange={(e) => setEditType(e.target.value as any)}>
                  <option value="bank">Bank</option><option value="credit">Credit</option><option value="cash">Cash</option>
                </select>
                {editType === 'credit' && <input className="px-4 py-3 bg-zinc-900 border border-[#d4af37]/50 rounded-xl font-bold text-white text-xs" value={editLimit} onChange={(e) => setEditLimit(e.target.value)} placeholder="Limit" />}
                <div className="flex gap-2">
                   <button onClick={() => handleUpdate(acc.id)} className="flex-1 bg-[#d4af37] text-[#0a0a0b] rounded-xl font-black text-[9px] uppercase tracking-widest">SAVE</button>
                   <button onClick={() => setEditingId(null)} className="flex-1 bg-zinc-800 text-slate-300 rounded-xl font-black text-[9px] uppercase tracking-widest">EXIT</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-inner transition-transform group-hover:scale-110" style={{ backgroundColor: `${acc.color}15`, color: acc.color, border: `1px solid ${acc.color}25` }}>
                    <i className={`fa-solid ${acc.type === 'credit' ? 'fa-credit-card' : acc.type === 'cash' ? 'fa-wallet' : 'fa-building-columns'} text-base`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100 group-hover:text-[#d4af37] transition-colors">{acc.name}</p>
                    <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Verified Asset Identifier</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-8">
                  <div className="text-right">
                    <p className="text-xl font-black text-white tracking-tighter">{CURRENCY_SYMBOL}{acc.balance.toLocaleString()}</p>
                    <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-1">
                      {acc.type === 'credit' ? `Limit: ${CURRENCY_SYMBOL}${acc.creditLimit?.toLocaleString()}` : 'Institutional Balance'}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <button onClick={() => startEditing(acc)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-zinc-500 hover:text-white transition-colors"><i className="fa-solid fa-pen text-[10px]"></i></button>
                    <button onClick={() => onDelete(acc.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-zinc-500 hover:text-rose-500 transition-colors"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountSettings;
