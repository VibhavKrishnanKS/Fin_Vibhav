
import React, { useState, useMemo } from 'react';
import { Transaction, Category, Account } from '../types';
import { CATEGORY_COLORS, CURRENCY_SYMBOL } from '../constants';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onOpenExport: () => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, accounts, onDelete, onEdit, onOpenExport }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      return matchesSearch && matchesType;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search, filterType]);

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(t => { if (!groups[t.date]) groups[t.date] = []; groups[t.date].push(t); });
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-6 max-w-full container-responsive pb-10">
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="flex-1 relative">
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-xs"></i>
          <input 
            type="text" placeholder="Search narrative..."
            className="w-full pl-10 pr-4 py-3 bg-zinc-900/50 border border-white/5 rounded-xl text-xs font-semibold focus:border-[#d4af37]/30 transition-all outline-none"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${isFilterOpen ? 'bg-[#d4af37] text-[#0a0a0b]' : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white'}`}>
            Filters
          </button>
          <button onClick={onOpenExport} className="px-5 py-3 bg-zinc-800 border border-white/5 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest hover:bg-zinc-700 transition-all">
            Export Vault
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="glass-card p-6 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2">
          {['all', 'expense', 'income', 'transfer'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={`py-2 text-[9px] font-bold uppercase rounded-lg border transition-all ${filterType === t ? 'bg-[#d4af37]/10 border-[#d4af37]/50 text-[#d4af37]' : 'border-white/5 text-zinc-500 hover:border-white/10'}`}>
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-10 mt-8">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date} className="space-y-3">
            <h5 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] px-2 flex items-center gap-3">
              <span className="flex-shrink-0">{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <div className="flex-1 h-[1px] bg-white/5"></div>
            </h5>
            <div className="grid grid-cols-1 gap-2">
              {txs.map(t => {
                const acc = accounts.find(a => a.id === t.fromAccountId);
                const toAcc = t.type === 'transfer' ? accounts.find(a => a.id === t.toAccountId) : null;
                const cat = categories.find(c => c.id === t.categoryId);
                return (
                  <div key={t.id} className="glass-card p-4 rounded-2xl flex items-center justify-between group transition-all hover:bg-white/[0.02] hover:border-white/10">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] transition-transform group-hover:scale-105 ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : t.type === 'transfer' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        <i className={`fa-solid ${t.type === 'income' ? 'fa-arrow-up-long' : t.type === 'transfer' ? 'fa-right-left' : 'fa-arrow-down-long'}`}></i>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-bold text-zinc-100 mb-1 line-clamp-1">{t.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{acc?.name} {t.type === 'transfer' ? `→ ${toAcc?.name}` : ''}</span>
                          {t.type !== 'transfer' && <span className="text-[8px] px-2 py-0.5 bg-zinc-800/80 border border-white/5 rounded text-zinc-400 uppercase font-bold">{cat?.name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className={`text-sm md:text-base font-bold tracking-tight ${t.type === 'income' ? 'text-emerald-500' : t.type === 'transfer' ? 'text-blue-500' : 'text-zinc-100'}`}>
                        {t.type === 'expense' ? '-' : ''}{CURRENCY_SYMBOL}{t.amount.toLocaleString()}
                      </p>
                      <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-all gap-1">
                        <button onClick={() => onEdit(t)} className="p-2 text-zinc-600 hover:text-white transition-colors"><i className="fa-solid fa-pen-nib text-xs"></i></button>
                        <button onClick={() => onDelete(t.id)} className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"><i className="fa-solid fa-trash-can text-xs"></i></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
