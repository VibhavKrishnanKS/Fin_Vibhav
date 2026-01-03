
import React, { useState } from 'react';
import { Transaction, TransactionType, Account, Category } from '../types';

interface AddTransactionModalProps {
  accounts: Account[];
  categories: Category[];
  initialData?: Transaction;
  onSave: (transaction: Omit<Transaction, 'id'>, existingId?: string) => void;
  onClose: () => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ accounts, categories, initialData, onSave, onClose }) => {
  const [type, setType] = useState<TransactionType>(initialData?.type || 'expense');
  const [inputAmount, setInputAmount] = useState(initialData?.amount.toString() || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [fromAccountId, setFromAccountId] = useState(initialData?.fromAccountId || accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(initialData?.toAccountId || (accounts.length > 1 ? accounts[1].id : ''));
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialData?.categoryId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAmount || !description || !fromAccountId) return;
    if (type !== 'transfer' && !selectedCategoryId) {
      alert("Please select a category.");
      return;
    }
    
    onSave({
      amount: parseFloat(inputAmount),
      description,
      categoryId: type === 'transfer' ? 'cat-transfer' : selectedCategoryId,
      date,
      type,
      fromAccountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined
    }, initialData?.id);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0b]/80 backdrop-blur-md p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#121214] border border-white/10 w-full max-w-md rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh] md:max-h-[80vh] relative overflow-hidden">
        
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-[#121214]/80 backdrop-blur-md z-20 shrink-0">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#d4af37]">
              {initialData ? 'Edit Entry' : 'New Entry'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 text-zinc-500 hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-6 space-y-5 pb-10">
            
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/5">
              {(['expense', 'income', 'transfer'] as const).map(t => (
                <button 
                  key={t} type="button" onClick={() => setType(t)}
                  className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${type === t ? 'bg-[#d4af37] text-[#0a0a0b]' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2 block ml-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 font-black text-lg">₹</span>
                  <input 
                    type="number" required value={inputAmount} 
                    onChange={e => setInputAmount(e.target.value)} 
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl pl-10 pr-4 py-3.5 font-black text-white text-xl focus:border-[#d4af37]/40 outline-none transition-all placeholder:text-zinc-800" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2 block ml-1">Description</label>
                <input 
                  type="text" required value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-bold text-white focus:border-[#d4af37]/40 outline-none transition-all" 
                  placeholder="e.g. Shopping, Rent, Salary" 
                />
              </div>

              {type !== 'transfer' ? (
                <div>
                  <label className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2 block ml-1">Category</label>
                  <select 
                    value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} 
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense')).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2 block ml-1">Transfer To</label>
                  <select 
                    value={toAccountId} onChange={e => setToAccountId(e.target.value)} 
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-300 outline-none appearance-none cursor-pointer"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2 block ml-1">Account</label>
                  <select 
                    value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} 
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-[0.1em] text-zinc-300 outline-none appearance-none cursor-pointer"
                  >
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2 block ml-1">Date</label>
                  <input 
                    type="date" value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-[9px] font-black text-zinc-300 outline-none" 
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-[#d4af37] text-[#0a0a0b] font-black rounded-xl text-[9px] uppercase tracking-[0.4em] shadow-lg hover:brightness-110 active:scale-[0.98] transition-all mt-6"
            >
              SAVE ENTRY
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
