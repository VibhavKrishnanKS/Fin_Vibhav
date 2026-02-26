
import React, { useState, useMemo } from 'react';
import { Transaction, Category, Account } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

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

  const grouped = useMemo<Record<string, Transaction[]>>(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(t => { if (!groups[t.date]) groups[t.date] = []; groups[t.date].push(t); });
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-6 max-w-full pb-20" style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch">
        <div className="flex-1 relative group">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm group-focus-within:text-[#4285F4] transition-colors"></i>
          <input
            type="text" placeholder="Search transactions..."
            className="w-full pl-11 pr-4 py-4 rounded-2xl glass text-xs font-bold uppercase tracking-widest outline-none transition-all duration-300 text-white placeholder:text-gray-700 placeholder:font-bold focus:ring-2 focus:ring-[#4285F4]/20"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex-1 sm:flex-none px-6 py-4 rounded-2xl glass text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-3 justify-center shine-hover"
            style={{
              color: isFilterOpen ? '#8ab4f8' : '#6b7280',
              borderColor: isFilterOpen ? 'rgba(66,133,244,0.3)' : 'rgba(255,255,255,0.05)'
            }}
          >
            <i className="fa-solid fa-filter-list text-xs"></i> Filter
          </button>
          <button onClick={onOpenExport}
            className="flex-1 sm:flex-none px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-3 justify-center text-white btn-primary-glow shine-hover shadow-xl"
          >
            <i className="fa-solid fa-paper-plane text-xs"></i> Export
          </button>
        </div>
      </div>

      {/* Taxonomy Matrix */}
      {isFilterOpen && (
        <div className="glass p-5 rounded-[28px] flex flex-wrap gap-2.5 relative overflow-hidden" style={{ animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="absolute top-0 left-0 w-1 h-full bg-[#4285F4]"></div>
          {['all', 'expense', 'income', 'transfer'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${filterType === t ? 'bg-[#4285F4] text-white shadow-lg' : 'glass text-gray-500 hover:text-gray-200'}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Chronological Ledger */}
      <div className="space-y-10">
        {Object.entries(grouped).map(([date, txs]: [string, Transaction[]], gi) => (
          <div key={date} className="space-y-4" style={{ animation: `fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${gi * 0.1}s both` }}>
            <div className="flex items-center gap-4 px-2">
              <div className="w-1.5 h-6 rounded-full bg-white/5"></div>
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </h5>
              <div className="flex-1 h-[1px] bg-white/5"></div>
              <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{txs.length} Transactions</span>
            </div>
            <div className="space-y-2.5">
              {txs.map((t, ti) => {
                const acc = accounts.find(a => a.id === t.fromAccountId);
                const toAcc = t.type === 'transfer' ? accounts.find(a => a.id === t.toAccountId) : null;
                const cat = categories.find(c => c.id === t.categoryId);
                const typeColor = t.type === 'income' ? '#34A853' : t.type === 'transfer' ? '#4285F4' : '#EA4335';

                return (
                  <div key={t.id}
                    className="glass group flex items-center justify-between p-4 sm:p-5 rounded-[24px] transition-all duration-300 hover:translate-x-2 relative overflow-hidden"
                    style={{
                      animation: `fadeUp 0.4s ease-out ${ti * 0.05}s both`,
                    }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: typeColor, boxShadow: `0 0 10px ${typeColor}` }}></div>
                    
                    <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[18px] flex items-center justify-center shrink-0 text-lg transition-transform duration-500 group-hover:scale-110"
                        style={{ background: `${typeColor}10`, color: typeColor, border: `1px solid ${typeColor}20` }}>
                        <i className={`fa-solid ${t.type === 'income' ? 'fa-arrow-up-right' : t.type === 'transfer' ? 'fa-shuffle' : 'fa-arrow-down-left'}`}></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-white truncate tracking-tight">{t.description}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full" style={{ background: acc?.color || '#555' }}></div>
                             <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest leading-none">{acc?.name}{t.type === 'transfer' ? ` → ${toAcc?.name}` : ''}</span>
                          </div>
                          {t.type !== 'transfer' && cat && (
                            <span className="text-[8px] px-2 py-0.5 rounded-lg glass font-black uppercase tracking-widest text-gray-500">
                              {cat.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 ml-4 shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-black tracking-tight" style={{ color: t.type === 'income' ? '#34A853' : t.type === 'transfer' ? '#8ab4f8' : 'white' }}>
                          {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : ''}
                          <span className="text-xs text-gray-500 mr-0.5 font-medium">{CURRENCY_SYMBOL}</span>
                          {t.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                        <button onClick={() => onEdit(t)} className="w-9 h-9 flex items-center justify-center rounded-xl glass text-gray-500 hover:text-white hover:bg-[#4285F4]/20 transition-all active:scale-90">
                          <i className="fa-solid fa-pen-paintbrush text-[10px]"></i>
                        </button>
                        <button onClick={() => onDelete(t.id)} className="w-9 h-9 flex items-center justify-center rounded-xl glass text-gray-500 hover:text-red-400 hover:bg-red-500/20 transition-all active:scale-90">
                          <i className="fa-solid fa-trash-can text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center glass rounded-[40px] border border-white/5">
            <div className="w-24 h-24 rounded-[32px] glass flex items-center justify-center mb-8 relative group shine-hover overflow-hidden">
               <i className="fa-solid fa-cloud-binary text-4xl text-gray-700 group-hover:scale-110 transition-transform duration-700"></i>
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-500">No Transactions</p>
            <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest mt-2">Start by adding a new transaction!</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

export default TransactionList;
