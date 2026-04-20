
import React, { useState, useMemo, useRef } from 'react';
import { Transaction, Category, Account } from '../types';
import { CURRENCY_SYMBOL, formatCurrency } from '../constants';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onOpenExport: (filteredData: Transaction[]) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, categories, accounts, onDelete, onEdit, onOpenExport }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Advanced filter states
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterType !== 'all') count++;
    if (filterCategory !== 'all') count++;
    if (filterAccount !== 'all') count++;
    if (filterDateFrom) count++;
    if (filterDateTo) count++;
    if (filterAmountMin) count++;
    if (filterAmountMax) count++;
    return count;
  }, [filterType, filterCategory, filterAccount, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax]);

  const clearAllFilters = () => {
    setFilterType('all');
    setFilterCategory('all');
    setFilterAccount('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterAmountMin('');
    setFilterAmountMax('');
    setSearch('');
    setSortBy('date');
    setSortOrder('desc');
  };

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesCategory = filterCategory === 'all' || t.categoryId === filterCategory;
      const matchesAccount = filterAccount === 'all' || t.fromAccountId === filterAccount || t.toAccountId === filterAccount;

      let matchesDateFrom = true;
      if (filterDateFrom) {
        matchesDateFrom = new Date(t.date) >= new Date(filterDateFrom);
      }
      let matchesDateTo = true;
      if (filterDateTo) {
        matchesDateTo = new Date(t.date) <= new Date(filterDateTo);
      }

      let matchesAmountMin = true;
      if (filterAmountMin && !isNaN(Number(filterAmountMin))) {
        matchesAmountMin = t.amount >= Number(filterAmountMin);
      }
      let matchesAmountMax = true;
      if (filterAmountMax && !isNaN(Number(filterAmountMax))) {
        matchesAmountMax = t.amount <= Number(filterAmountMax);
      }

      return matchesSearch && matchesType && matchesCategory && matchesAccount && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (cmp === 0) {
          const timeA = a.createdAt?.seconds || (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.createdAt?.seconds || (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0);
          cmp = timeB - timeA;
        }
      } else if (sortBy === 'amount') {
        cmp = b.amount - a.amount;
      } else if (sortBy === 'name') {
        cmp = a.description.localeCompare(b.description);
      }
      return sortOrder === 'asc' ? -cmp : cmp;
    });
  }, [transactions, search, filterType, filterCategory, filterAccount, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax, sortBy, sortOrder]);

  const grouped = useMemo<Record<string, Transaction[]>>(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach(t => { if (!groups[t.date]) groups[t.date] = []; groups[t.date].push(t); });
    return groups;
  }, [filtered]);

  // Summary bar
  const filteredIncome = useMemo(() => filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [filtered]);
  const filteredExpense = useMemo(() => filtered.filter(t => t.type === 'expense' || t.type === 'cc_action').reduce((s, t) => s + t.amount, 0), [filtered]);

  const typeColors: Record<string, string> = {
    income: '#81c995',
    expense: '#f28b82',
    transfer: '#8ab4f8',
    cc_action: '#fdd663',
  };

  return (
    <div className="space-y-5 max-w-full pb-20" style={{ animation: 'fadeUp 0.5s ease both' }}>
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="flex-1 relative group">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm group-focus-within:text-primary transition-colors duration-200"></i>
          <input
            type="text" placeholder="Search transactions..."
            className="w-full pl-11 pr-4 py-3.5 rounded-pill text-xs font-semibold outline-none transition-all duration-200 text-white placeholder:text-text-muted focus:ring-1 focus:ring-primary/30"
            style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.06)' }}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex-1 sm:flex-none px-5 py-3.5 rounded-pill text-[10px] font-bold uppercase tracking-widest transition-all duration-200 flex items-center gap-2.5 justify-center relative"
            style={{
              background: isFilterOpen ? 'rgba(66,133,244,0.1)' : 'var(--surface-2)',
              color: isFilterOpen ? '#8ab4f8' : '#9aa0a6',
              border: isFilterOpen ? '1px solid rgba(66,133,244,0.2)' : '1px solid rgba(255,255,255,0.06)'
            }}
          >
            <i className="fa-solid fa-sliders text-xs"></i> Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center text-white" style={{ background: '#4285F4' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          <button onClick={() => onOpenExport(filtered)}
            className="flex-1 sm:flex-none px-5 py-3.5 rounded-pill text-[10px] font-bold uppercase tracking-widest transition-all duration-200 flex items-center gap-2.5 justify-center text-white btn-primary-glow"
          >
            <i className="fa-solid fa-paper-plane text-xs"></i> Export
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {isFilterOpen && (
        <div className="rounded-card p-5 relative overflow-hidden" style={{
          animation: 'slideDown 0.3s ease both',
          background: 'var(--surface-2)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Type Filter Row */}
          <div className="mb-5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2.5">Transaction Type</p>
            <div className="flex flex-wrap gap-2">
              {['all', 'expense', 'income', 'transfer', 'cc_action'].map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className="px-4 py-2 rounded-pill text-[9px] font-bold uppercase tracking-widest transition-all duration-200"
                  style={{
                    background: filterType === t ? '#4285F4' : 'var(--surface-3)',
                    color: filterType === t ? 'white' : '#9aa0a6',
                    border: filterType === t ? '1px solid transparent' : '1px solid rgba(255,255,255,0.04)'
                  }}
                >
                  {t === 'cc_action' ? 'Credit Card' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Category + Account Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">Category</p>
              <select
                value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-pill text-xs font-semibold text-white outline-none cursor-pointer"
                style={{ background: 'var(--surface-3)', border: '1px solid rgba(255,255,255,0.06)', appearance: 'none' }}
              >
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">Account</p>
              <select
                value={filterAccount} onChange={e => setFilterAccount(e.target.value)}
                className="w-full px-4 py-2.5 rounded-pill text-xs font-semibold text-white outline-none cursor-pointer"
                style={{ background: 'var(--surface-3)', border: '1px solid rgba(255,255,255,0.06)', appearance: 'none' }}
              >
                <option value="all">All Accounts</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {/* Date Range Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">Date From</p>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full px-4 py-2.5 rounded-pill text-xs font-semibold text-white outline-none"
                style={{ background: 'var(--surface-3)', border: '1px solid rgba(255,255,255,0.06)', colorScheme: 'dark' }}
              />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">Date To</p>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-pill text-xs font-semibold text-white outline-none"
                style={{ background: 'var(--surface-3)', border: '1px solid rgba(255,255,255,0.06)', colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Amount Range Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">Min Amount</p>
              <input type="number" placeholder="₹ 0" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-pill text-xs font-semibold text-white outline-none placeholder:text-text-muted"
                style={{ background: 'var(--surface-3)', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">Max Amount</p>
              <input type="number" placeholder="₹ ∞" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value)}
                className="w-full px-4 py-2.5 rounded-pill text-xs font-semibold text-white outline-none placeholder:text-text-muted"
                style={{ background: 'var(--surface-3)', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            </div>
          </div>

          {/* Sort + Actions Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mr-1">Sort by</p>
              {(['date', 'amount', 'name'] as const).map(s => (
                <button key={s} onClick={() => { if (sortBy === s) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortBy(s); setSortOrder('desc'); } }}
                  className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5"
                  style={{
                    background: sortBy === s ? 'rgba(66,133,244,0.1)' : 'transparent',
                    color: sortBy === s ? '#8ab4f8' : '#5f6368'
                  }}
                >
                  {s}
                  {sortBy === s && <i className={`fa-solid fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'} text-[8px]`}></i>}
                </button>
              ))}
            </div>
            <button onClick={clearAllFilters}
              className="px-4 py-2 rounded-pill text-[9px] font-bold uppercase tracking-widest transition-all"
              style={{ color: activeFilterCount > 0 ? '#f28b82' : '#5f6368', background: activeFilterCount > 0 ? 'rgba(234,67,53,0.08)' : 'transparent' }}
            >
              <i className="fa-solid fa-xmark mr-1.5"></i> Clear All
            </button>
          </div>
        </div>
      )}

      {/* Results Summary Bar */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
        <div className="h-3 w-px bg-white/10"></div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#81c995]"></span>
          <span className="text-[10px] font-semibold text-[#81c995]">{CURRENCY_SYMBOL}{formatCurrency(filteredIncome)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f28b82]"></span>
          <span className="text-[10px] font-semibold text-[#f28b82]">{CURRENCY_SYMBOL}{formatCurrency(filteredExpense)}</span>
        </div>
      </div>

      {/* Chronological Ledger */}
      <div className="space-y-8">
        {Object.entries(grouped).map(([date, txs]: [string, Transaction[]], gi) => (
          <div key={date} className="space-y-2.5" style={{ animation: `fadeUp 0.4s ease ${gi * 0.05}s both` }}>
            {/* Date Header */}
            <div className="flex items-center gap-3 px-1">
              <div className="w-1 h-5 rounded-full" style={{ background: 'var(--surface-3)' }}></div>
              <h5 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </h5>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }}></div>
              <span className="text-[9px] text-text-muted font-semibold">{txs.length} entries</span>
            </div>

            {/* Transaction Cards */}
            <div className="space-y-1.5">
              {txs.map((t, ti) => {
                const acc = accounts.find(a => a.id === t.fromAccountId);
                const toAcc = t.type === 'transfer' ? accounts.find(a => a.id === t.toAccountId) : null;
                const cat = categories.find(c => c.id === t.categoryId);
                const typeColor = typeColors[t.type] || '#8ab4f8';
                const isExpanded = expandedId === t.id;

                return (
                  <div key={t.id} style={{ animation: `fadeUp 0.3s ease ${ti * 0.03}s both` }}>
                    {/* Main Card */}
                    <div
                      className="group flex items-center justify-between p-3.5 sm:p-4 rounded-card transition-all duration-200 cursor-pointer relative"
                      style={{
                        background: isExpanded ? 'var(--surface-2)' : 'var(--surface-1)',
                        border: isExpanded ? '1px solid rgba(138,180,248,0.12)' : '1px solid rgba(255,255,255,0.04)',
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : t.id)}
                    >
                      {/* Type Indicator Line */}
                      <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full transition-opacity duration-200"
                        style={{ background: typeColor, opacity: isExpanded ? 1 : 0 }} />

                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300"
                          style={{ background: `${typeColor}10`, color: typeColor }}>
                          <i className={`fa-solid ${t.type === 'income' ? 'fa-arrow-up-right' : t.type === 'transfer' ? 'fa-right-left' : t.type === 'cc_action' ? 'fa-credit-card' : 'fa-arrow-down-left'} text-sm`}></i>
                        </div>
                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-white truncate">{t.description}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <div className="flex items-center gap-1.5">
                               <div className="w-1.5 h-1.5 rounded-full" style={{ background: acc?.color || '#555' }}></div>
                               <span className="text-[9px] text-text-muted font-semibold uppercase tracking-wider">{acc?.name}{t.type === 'transfer' ? ` → ${toAcc?.name}` : ''}</span>
                            </div>
                            {t.type !== 'transfer' && cat && (
                              <span className="text-[8px] px-2 py-0.5 rounded-lg font-semibold uppercase tracking-wider text-text-muted"
                                style={{ background: 'var(--surface-3)' }}>
                                {cat.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount + Actions */}
                      <div className="flex items-center gap-3 ml-3 shrink-0">
                        <div className="text-right">
                          <p className="text-base sm:text-lg font-bold tracking-tight" style={{ color: typeColor }}>
                            {t.type === 'expense' || t.type === 'cc_action' ? '−' : t.type === 'income' ? '+' : ''}
                            <span className="text-[10px] mr-0.5 opacity-60">{CURRENCY_SYMBOL}</span>
                            {formatCurrency(t.amount)}
                          </p>
                        </div>
                        <i className={`fa-solid fa-chevron-down text-[9px] text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="mx-2 rounded-b-card p-4 space-y-3" style={{
                        background: 'var(--surface-2)',
                        borderTop: 'none',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        animation: 'slideDown 0.2s ease both',
                      }}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1">Type</p>
                            <p className="text-xs font-semibold capitalize" style={{ color: typeColor }}>{t.type === 'cc_action' ? 'Credit Card' : t.type}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1">Date</p>
                            <p className="text-xs font-semibold text-white">{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1">Account</p>
                            <p className="text-xs font-semibold text-white">{acc?.name || '—'}</p>
                          </div>
                          {cat && (
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-1">Category</p>
                              <p className="text-xs font-semibold text-white">{cat.name}</p>
                            </div>
                          )}
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <button onClick={(e) => { e.stopPropagation(); onEdit(t); }}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-pill text-[9px] font-bold uppercase tracking-widest text-primary transition-all"
                            style={{ background: 'rgba(66,133,244,0.08)' }}
                          >
                            <i className="fa-solid fa-pen text-[9px]"></i> Edit
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-pill text-[9px] font-bold uppercase tracking-widest transition-all"
                            style={{ color: '#f28b82', background: 'rgba(234,67,53,0.08)' }}
                          >
                            <i className="fa-solid fa-trash text-[9px]"></i> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-card" style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'var(--surface-2)' }}>
               <i className="fa-solid fa-inbox text-3xl text-text-muted"></i>
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">No transactions found</p>
            <p className="text-[10px] text-text-muted font-medium mt-1.5">Try adjusting your filters or add a new entry</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
