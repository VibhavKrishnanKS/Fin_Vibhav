
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
    if (type !== 'transfer' && !selectedCategoryId) return;
    
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

  const inputClass = "w-full glass bg-white/[0.02] border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:border-[#4285F4]/40 focus:bg-white/[0.08] outline-none transition-all placeholder:text-gray-700";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-3 block ml-1";

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ animation: 'fadeIn 0.4s ease-out' }}
    >
      <div className="glass w-full max-w-xl rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] relative overflow-hidden"
        style={{ 
          animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
        
        {/* Animated Background */}
        <div className="absolute top-[0%] left-[-10%] w-[100%] h-[100%] bg-gradient-to-br from-[#4285F4]/5 to-transparent blur-[120px] pointer-events-none"></div>

        {/* Header */}
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between shrink-0 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <i className={`fa-solid ${initialData ? 'fa-pen-to-square' : 'fa-plus-circle'} text-[#4285F4] text-xs`}></i>
               <h3 className="text-2xl font-black text-white tracking-tighter">
                 {initialData ? 'Edit Entry' : 'Add Transaction'}
               </h3>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Enter your details below</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl glass text-gray-400 hover:text-white flex items-center justify-center transition-all hover:rotate-90">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            
            {/* Classification Matrix */}
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
              {(['expense', 'income', 'transfer'] as const).map(t => (
                <button 
                  key={t} type="button" onClick={() => setType(t)}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${type === t ? 'bg-[#4285F4] text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className={labelClass}>Amount</label>
                <div className="relative group">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-black text-xl group-focus-within:text-[#4285F4] transition-colors">₹</span>
                  <input 
                    type="number" required value={inputAmount} 
                    onChange={e => setInputAmount(e.target.value)} 
                    className={`${inputClass} pl-12 text-2xl font-black tracking-tighter`} 
                    placeholder="0.00" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Date</label>
                <div className="relative">
                  <input 
                    type="date" value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className={inputClass} 
                  />
                </div>
              </div>
            </div>

            {/* Context Narrative */}
            <div className="space-y-2">
              <label className={labelClass}>Description</label>
              <div className="relative">
                <input 
                  type="text" required value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className={inputClass} 
                  placeholder="What was this for?" 
                />
              </div>
            </div>

            {/* System Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className={labelClass}>{type === 'transfer' ? 'From Account' : 'Account'}</label>
                <div className="relative">
                  <select 
                    value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} 
                    className={inputClass}
                  >
                    {accounts.map(acc => <option key={acc.id} value={acc.id} className="bg-[#121214]">{acc.name}</option>)}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"></i>
                </div>
              </div>

              {type !== 'transfer' ? (
                <div className="space-y-2">
                  <label className={labelClass}>Category</label>
                  <div className="relative">
                    <select 
                      value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} 
                      className={inputClass}
                    >
                      <option value="" className="bg-[#121214]">Select Category</option>
                      {categories.filter(c => c.type === (type === 'income' ? 'income' : 'expense')).map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-[#121214]">{cat.name}</option>
                      ))}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"></i>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className={labelClass}>To Account</label>
                  <div className="relative">
                    <select 
                      value={toAccountId} onChange={e => setToAccountId(e.target.value)} 
                      className={inputClass}
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId} className="bg-[#121214]">{acc.name}</option>
                      ))}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"></i>
                  </div>
                </div>
              )}
            </div>

            {/* Action Hub */}
            <div className="pt-6">
              <button 
                type="submit" 
                className="w-full py-5 rounded-[24px] text-xs font-black uppercase tracking-[0.4em] btn-primary-glow shine-hover shadow-2xl transition-all flex items-center justify-center gap-4"
              >
                <i className={`fa-solid ${initialData ? 'fa-pencil' : 'fa-plus'}`}></i>
                {initialData ? 'Update Entry' : 'Add Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
};

export default AddTransactionModal;
