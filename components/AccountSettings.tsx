
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
      name: newName.trim(), balance: parseFloat(newBalance), type: newType,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      creditLimit: newType === 'credit' ? parseFloat(newLimit) : undefined
    });
    setNewName(''); setNewBalance(''); setIsAdding(false);
  };

  const startEditing = (acc: Account) => {
    setEditingId(acc.id); setEditName(acc.name); setEditBalance(acc.balance.toString());
    setEditType(acc.type); setEditLimit(acc.creditLimit?.toString() || '0');
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim() || !editBalance) return;
    onUpdate(id, { name: editName.trim(), balance: parseFloat(editBalance), type: editType, creditLimit: editType === 'credit' ? parseFloat(editLimit) : undefined });
    setEditingId(null);
  };

  const inputClass = "w-full glass bg-white/[0.02] border-white/5 rounded-2xl px-4 py-3 text-[13px] font-bold text-white focus:border-[#4285F4]/40 focus:bg-white/[0.08] outline-none transition-all placeholder:text-gray-700";
  const labelClass = "block text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2 ml-1";

  return (
    <div className="glass rounded-[36px] p-6 sm:p-10 relative overflow-hidden" style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
       {/* Acccent Orb */}
       <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#4285F4]/5 blur-[80px] rounded-full pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <i className="fa-solid fa-vault text-[#4285F4] text-xs"></i>
             <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Manage Accounts</h3>
          </div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Set up your bank accounts and cards</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)}
          className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 active:scale-95 flex items-center gap-3 justify-center shine-hover ${isAdding ? 'glass text-white' : 'btn-primary-glow text-white shadow-xl'}`}
        >
          <i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'} text-xs`}></i>
          {isAdding ? 'Decline' : 'Add Account'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-10 p-6 sm:p-8 rounded-[32px] glass space-y-6 relative z-10" style={{ animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelClass}>Account Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Primary Reserve"
                className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Account Type</label>
              <div className="relative">
                <select value={newType} onChange={(e) => setNewType(e.target.value as any)}
                  className={inputClass}>
                  <option value="bank" className="bg-[#121214]">Bank Account</option>
                  <option value="credit" className="bg-[#121214]">Credit Card</option>
                  <option value="cash" className="bg-[#121214]">Cash</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none text-xs"></i>
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Initial Balance</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold">₹</span>
                <input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} placeholder="0.00"
                  className={`${inputClass} pl-10`} />
              </div>
            </div>
            {newType === 'credit' && (
              <div className="space-y-1">
                <label className={labelClass}>Credit Limit</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold">₹</span>
                   <input type="number" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} placeholder="500000"
                     className={`${inputClass} pl-10`} />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white btn-primary-glow shadow-xl active:scale-95 transition-all">
              Save Account
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3 relative z-10">
        {accounts.map((acc, i) => (
          <div key={acc.id} className="group p-5 sm:p-6 rounded-[28px] glass border-white/5 transition-all duration-300 relative overflow-hidden"
            style={{ animation: `fadeUp 0.5s ease-out ${i * 0.08}s both` }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[4px] opacity-20 group-hover:opacity-100 transition-opacity" style={{ background: acc.color, boxShadow: `0 0 15px ${acc.color}` }}></div>
            
            {editingId === acc.id ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <input className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} />
                <input className={inputClass} value={editBalance} onChange={(e) => setEditBalance(e.target.value)} type="number" />
                <div className="relative">
                  <select className={inputClass} value={editType} onChange={(e) => setEditType(e.target.value as any)}>
                    <option value="bank" className="bg-[#121214]">Bank</option><option value="credit" className="bg-[#121214]">Credit</option><option value="cash" className="bg-[#121214]">Cash</option>
                  </select>
                </div>
                <button onClick={() => handleUpdate(acc.id)} className="py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white btn-primary-glow">Save</button>
                <button onClick={() => setEditingId(null)} className="py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest glass text-gray-400">Cancel</button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-[15deg] group-hover:scale-110 shrink-0"
                    style={{ background: `${acc.color}10`, color: acc.color, border: `1px solid ${acc.color}20` }}>
                    <i className={`fa-solid ${acc.type === 'credit' ? 'fa-credit-card-front' : acc.type === 'cash' ? 'fa-wallet' : 'fa-building-columns'} text-lg`}></i>
                  </div>
                  <div>
                    <p className="text-base font-black text-white tracking-tight uppercase">{acc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="w-1.5 h-1.5 rounded-full" style={{ background: acc.color }}></span>
                       <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">{acc.type === 'bank' ? 'Bank' : acc.type === 'credit' ? 'Credit' : 'Cash'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-10">
                  <div className="text-right">
                    <p className="text-2xl font-black text-white tracking-tighter">
                       <span className="text-xs text-gray-600 mr-1">{CURRENCY_SYMBOL}</span>
                       {acc.balance.toLocaleString()}
                    </p>
                    {acc.type === 'credit' && <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Limit: {CURRENCY_SYMBOL}{acc.creditLimit?.toLocaleString()}</p>}
                  </div>
                  <div className="flex gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                    <button onClick={() => startEditing(acc)} className="w-10 h-10 rounded-xl glass flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#4285F4]/20 transition-all active:scale-90">
                      <i className="fa-solid fa-pen-field text-[11px]"></i>
                    </button>
                    <button onClick={() => onDelete(acc.id)} className="w-10 h-10 rounded-xl glass flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/20 transition-all active:scale-90">
                      <i className="fa-solid fa-trash-undo text-[11px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

export default AccountSettings;
