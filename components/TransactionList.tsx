
import React, { useState, useMemo } from 'react';
import { Transaction, Category, Account } from '../types';
import { CURRENCY_SYMBOL, formatCurrency } from '../constants';

interface TransactionListProps {
  transactions: Transaction[];
  categories:   Category[];
  accounts:     Account[];
  onDelete:     (id: string) => void;
  onEdit:       (transaction: Transaction) => void;
  onOpenExport: (filteredData: Transaction[]) => void;
}

const TX_COLORS: Record<string, string> = {
  income:    '#5ecb8a',
  expense:   '#e8685e',
  transfer:  '#6c9ef8',
  cc_action: '#f5c842',
};

const TransactionList: React.FC<TransactionListProps> = ({
  transactions, categories, accounts, onDelete, onEdit, onOpenExport,
}) => {
  const [search,          setSearch]          = useState('');
  const [filterType,      setFilterType]      = useState('all');
  const [isFilterOpen,    setIsFilterOpen]    = useState(false);
  const [expandedId,      setExpandedId]      = useState<string | null>(null);
  const [filterCategory,  setFilterCategory]  = useState('all');
  const [filterAccount,   setFilterAccount]   = useState('all');
  const [filterDateFrom,  setFilterDateFrom]  = useState('');
  const [filterDateTo,    setFilterDateTo]    = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [sortBy,          setSortBy]          = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder,       setSortOrder]       = useState<'asc' | 'desc'>('desc');

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filterType !== 'all') n++;
    if (filterCategory !== 'all') n++;
    if (filterAccount  !== 'all') n++;
    if (filterDateFrom)  n++;
    if (filterDateTo)    n++;
    if (filterAmountMin) n++;
    if (filterAmountMax) n++;
    return n;
  }, [filterType, filterCategory, filterAccount, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax]);

  const clearAllFilters = () => {
    setFilterType('all'); setFilterCategory('all'); setFilterAccount('all');
    setFilterDateFrom(''); setFilterDateTo('');
    setFilterAmountMin(''); setFilterAmountMax('');
    setSearch(''); setSortBy('date'); setSortOrder('desc');
  };

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (!t.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== 'all'     && t.type        !== filterType)     return false;
      if (filterCategory !== 'all' && t.categoryId  !== filterCategory) return false;
      if (filterAccount  !== 'all' && t.fromAccountId !== filterAccount && t.toAccountId !== filterAccount) return false;
      if (filterDateFrom && new Date(t.date) < new Date(filterDateFrom)) return false;
      if (filterDateTo   && new Date(t.date) > new Date(filterDateTo))   return false;
      if (filterAmountMin && !isNaN(Number(filterAmountMin)) && t.amount < Number(filterAmountMin)) return false;
      if (filterAmountMax && !isNaN(Number(filterAmountMax)) && t.amount > Number(filterAmountMax)) return false;
      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (cmp === 0) {
          const tA = a.createdAt?.seconds || (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0);
          const tB = b.createdAt?.seconds || (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0);
          cmp = tB - tA;
        }
      } else if (sortBy === 'amount') {
        cmp = b.amount - a.amount;
      } else {
        cmp = a.description.localeCompare(b.description);
      }
      return sortOrder === 'asc' ? -cmp : cmp;
    });
  }, [transactions, search, filterType, filterCategory, filterAccount, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax, sortBy, sortOrder]);

  const grouped = useMemo<Record<string, Transaction[]>>(() => {
    const g: Record<string, Transaction[]> = {};
    filtered.forEach(t => { if (!g[t.date]) g[t.date] = []; g[t.date].push(t); });
    return g;
  }, [filtered]);

  const filteredIncome  = useMemo(() => filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [filtered]);
  const filteredExpense = useMemo(() => filtered.filter(t => t.type === 'expense' || t.type === 'cc_action').reduce((s, t) => s + t.amount, 0), [filtered]);

  /* ── Shared style helpers ── */
  const inputCls = "w-full px-3.5 py-2.5 rounded-xl text-[12px] font-medium text-white outline-none transition-all placeholder:text-[var(--text-3)] focus:border-[var(--border-focus)]";
  const inputStyle = { background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-1)' };

  return (
    <div className="space-y-4 max-w-full pb-20" style={{ animation: 'fadeUp 0.4s ease both' }}>

      {/* ── Search + Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search */}
        <div className="flex-1 relative group">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)] text-sm transition-colors group-focus-within:text-[var(--primary)]" />
          <input
            type="text"
            placeholder="Search transactions…"
            className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] font-medium outline-none transition-all text-white placeholder:text-[var(--text-3)]"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {/* Filters toggle */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex-1 sm:flex-none px-4 py-3 rounded-xl text-[11px] font-semibold flex items-center gap-2 justify-center relative transition-all"
            style={{
              background: isFilterOpen ? 'rgba(108,158,248,0.1)' : 'var(--surface-1)',
              color:      isFilterOpen ? 'var(--primary)'         : 'var(--text-2)',
              border:     isFilterOpen ? '1px solid rgba(108,158,248,0.25)' : '1px solid var(--border)',
            }}>
            <i className="fa-solid fa-sliders text-xs" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: 'var(--primary-deep)' }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Export */}
          <button
            onClick={() => onOpenExport(filtered)}
            className="flex-1 sm:flex-none px-4 py-3 rounded-xl text-[11px] font-semibold flex items-center gap-2 justify-center text-white btn-primary-glow shine-hover">
            <i className="fa-solid fa-paper-plane text-xs" />
            Export
          </button>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      {isFilterOpen && (
        <div className="rounded-[18px] p-5 space-y-5"
          style={{ animation: 'slideDown 0.25s ease both', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>

          {/* Type pills */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2.5" style={{ color: 'var(--text-3)' }}>Type</p>
            <div className="flex flex-wrap gap-2">
              {['all', 'expense', 'income', 'transfer', 'cc_action'].map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className="px-3.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all"
                  style={{
                    background: filterType === t ? 'var(--primary-deep)' : 'var(--surface-3)',
                    color:      filterType === t ? '#fff'                 : 'var(--text-2)',
                    border:     filterType === t ? '1px solid transparent' : '1px solid var(--border)',
                  }}>
                  {t === 'cc_action' ? 'Credit Card' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Category + Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-3)' }}>Category</p>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                className={inputCls} style={{ ...inputStyle, appearance: 'none' as any }}>
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-3)' }}>Account</p>
              <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)}
                className={inputCls} style={{ ...inputStyle, appearance: 'none' as any }}>
                <option value="all">All Accounts</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-3)' }}>From date</p>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className={inputCls} style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-3)' }}>To date</p>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className={inputCls} style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
          </div>

          {/* Amount range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-3)' }}>Min amount</p>
              <input type="number" placeholder="₹ 0" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2" style={{ color: 'var(--text-3)' }}>Max amount</p>
              <input type="number" placeholder="₹ ∞" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
          </div>

          {/* Sort + clear */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mr-1" style={{ color: 'var(--text-3)' }}>Sort</p>
              {(['date', 'amount', 'name'] as const).map(s => (
                <button key={s}
                  onClick={() => { if (sortBy === s) setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); else { setSortBy(s); setSortOrder('desc'); } }}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all flex items-center gap-1.5"
                  style={{
                    background: sortBy === s ? 'rgba(108,158,248,0.1)' : 'transparent',
                    color:      sortBy === s ? 'var(--primary)'         : 'var(--text-3)',
                  }}>
                  {s}
                  {sortBy === s && <i className={`fa-solid fa-arrow-${sortOrder === 'asc' ? 'up' : 'down'} text-[8px]`} />}
                </button>
              ))}
            </div>
            <button onClick={clearAllFilters}
              className="px-3.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all flex items-center gap-1.5"
              style={{ color: activeFilterCount > 0 ? 'var(--danger)' : 'var(--text-3)', background: activeFilterCount > 0 ? 'rgba(232,104,94,0.08)' : 'transparent' }}>
              <i className="fa-solid fa-xmark text-[10px]" /> Clear all
            </button>
          </div>
        </div>
      )}

      {/* ── Summary bar ── */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
        <div className="h-3 w-px" style={{ background: 'var(--border)' }} />
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#5ecb8a' }} />
          <span className="text-[11px] font-semibold" style={{ color: '#5ecb8a' }}>{CURRENCY_SYMBOL}{formatCurrency(filteredIncome)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#e8685e' }} />
          <span className="text-[11px] font-semibold" style={{ color: '#e8685e' }}>{CURRENCY_SYMBOL}{formatCurrency(filteredExpense)}</span>
        </div>
      </div>

      {/* ── Ledger ── */}
      <div className="space-y-7">
        {Object.entries(grouped).map(([date, txs]: [string, Transaction[]], gi) => (
          <div key={date} className="space-y-2" style={{ animation: `fadeUp 0.35s ease ${gi * 0.05}s both` }}>

            {/* Date header */}
            <div className="flex items-center gap-3 px-1 mb-2">
              <div className="w-1 h-4 rounded-full" style={{ background: 'var(--surface-3)' }} />
              <h5 className="text-[11px] font-semibold" style={{ color: 'var(--text-2)' }}>
                {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </h5>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>{txs.length} entries</span>
            </div>

            {/* Transaction rows */}
            <div className="space-y-1.5">
              {txs.map((t, ti) => {
                const acc     = accounts.find(a => a.id === t.fromAccountId);
                const toAcc   = t.type === 'transfer' ? accounts.find(a => a.id === t.toAccountId) : null;
                const cat     = categories.find(c => c.id === t.categoryId);
                const tColor  = TX_COLORS[t.type] || '#6c9ef8';
                const isOpen  = expandedId === t.id;

                return (
                  <div key={t.id} style={{ animation: `fadeUp 0.25s ease ${ti * 0.03}s both` }}>
                    {/* Main row */}
                    <div
                      className="flex items-center justify-between px-4 py-3.5 rounded-[16px] cursor-pointer transition-all duration-150 relative overflow-hidden group"
                      style={{
                        background: isOpen ? 'var(--surface-2)' : 'var(--surface-1)',
                        border: isOpen ? `1px solid ${tColor}22` : '1px solid var(--border)',
                        borderBottomLeftRadius:  isOpen ? 0 : undefined,
                        borderBottomRightRadius: isOpen ? 0 : undefined,
                      }}
                      onClick={() => setExpandedId(isOpen ? null : t.id)}>

                      {/* Active left stripe */}
                      {isOpen && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{ background: tColor }} />
                      )}

                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                          style={{ background: `${tColor}14`, color: tColor }}>
                          <i className={`fa-solid ${
                            t.type === 'income'   ? 'fa-arrow-up-right'   :
                            t.type === 'transfer' ? 'fa-right-left'       :
                            t.type === 'cc_action'? 'fa-credit-card'      : 'fa-arrow-down-left'
                          } text-sm`} />
                        </div>
                        {/* Description + meta */}
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-white truncate leading-tight">{t.description}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: acc?.color || 'var(--text-3)' }} />
                              <span className="text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>
                                {acc?.name}{t.type === 'transfer' ? ` → ${toAcc?.name}` : ''}
                              </span>
                            </div>
                            {t.type !== 'transfer' && cat && (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md"
                                style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}>
                                {cat.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount + chevron */}
                      <div className="flex items-center gap-2.5 ml-3 shrink-0">
                        <p className="text-[15px] font-bold text-right" style={{ color: tColor, letterSpacing: '-0.02em' }}>
                          {t.type === 'expense' || t.type === 'cc_action' ? '−' : t.type === 'income' ? '+' : ''}
                          <span className="text-[10px] mr-0.5 opacity-50">{CURRENCY_SYMBOL}</span>
                          {formatCurrency(t.amount)}
                        </p>
                        <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          style={{ color: 'var(--text-3)' }} />
                      </div>
                    </div>

                    {/* Expanded panel */}
                    {isOpen && (
                      <div className="px-4 py-4 rounded-b-[16px] space-y-4"
                        style={{ background: 'var(--surface-2)', border: `1px solid ${tColor}22`, borderTop: 'none', animation: 'slideDown 0.18s ease both' }}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { l: 'Type',     v: t.type === 'cc_action' ? 'Credit Card' : t.type, col: tColor },
                            { l: 'Date',     v: new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), col: undefined },
                            { l: 'Account',  v: acc?.name || '—', col: undefined },
                            ...(cat ? [{ l: 'Category', v: cat.name, col: undefined }] : []),
                          ].map(({ l, v, col }) => (
                            <div key={l}>
                              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] mb-1" style={{ color: 'var(--text-3)' }}>{l}</p>
                              <p className="text-[12px] font-semibold capitalize text-white" style={{ color: col }}>{v}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                          <button onClick={e => { e.stopPropagation(); onEdit(t); }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all"
                            style={{ color: 'var(--primary)', background: 'rgba(108,158,248,0.08)' }}>
                            <i className="fa-solid fa-pen text-[9px]" /> Edit
                          </button>
                          <button onClick={e => { e.stopPropagation(); onDelete(t.id); }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all"
                            style={{ color: 'var(--danger)', background: 'rgba(232,104,94,0.08)' }}>
                            <i className="fa-solid fa-trash text-[9px]" /> Delete
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

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 rounded-[22px]"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'var(--surface-2)' }}>
              <i className="fa-solid fa-inbox text-2xl" style={{ color: 'var(--text-3)' }} />
            </div>
            <p className="text-[13px] font-semibold text-white mb-1">No transactions found</p>
            <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>Try adjusting your filters or add a new entry</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;
