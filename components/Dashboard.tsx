
import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Transaction, Category, Account } from '../types';
import { CURRENCY_SYMBOL, formatCurrency } from '../constants';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, categories, accounts }) => {
  const [selectedCategory, setSelectedCategory] = useState<{ name: string, type: string, catId: string } | null>(null);

  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense' || t.type === 'cc_action').reduce((s, t) => s + t.amount, 0), [transactions]);

  const globalBalance = useMemo(() => {
    return accounts.reduce((s, a) => {
      if (a.type !== 'credit') return s + a.balance;
      const spent = (a.creditLimit || 0) - a.balance;
      return s - spent;
    }, 0);
  }, [accounts]);

  const chartData = useMemo(() => {
    const last15 = Array.from({ length: 15 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    return last15.map(date => ({
      date: date.split('-').slice(1).join('/'),
      income: transactions.filter(t => t.date === date && t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: transactions.filter(t => t.date === date && (t.type === 'expense' || t.type === 'cc_action')).reduce((s, t) => s + t.amount, 0),
    }));
  }, [transactions]);

  const expensePieData = useMemo(() => {
    const catTotals: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense' || t.type === 'cc_action').forEach(t => {
      const name = categories.find(c => c.id === t.categoryId)?.name || 'Other';
      catTotals[name] = (catTotals[name] || 0) + t.amount;
    });
    return Object.entries(catTotals).map(([name, value]) => ({ name, value }));
  }, [transactions, categories]);

  const incomePieData = useMemo(() => {
    const catTotals: Record<string, number> = {};
    transactions.filter(t => t.type === 'income').forEach(t => {
      const name = categories.find(c => c.id === t.categoryId)?.name || 'Other';
      catTotals[name] = (catTotals[name] || 0) + t.amount;
    });
    return Object.entries(catTotals).map(([name, value]) => ({ name, value }));
  }, [transactions, categories]);

  const CATEGORY_STATS = useMemo(() => {
    const stats: { name: string, amount: number, type: string, color: string, catId: string, txCount: number }[] = [];
    categories.forEach(cat => {
      const catTxs = transactions.filter(t => t.categoryId === cat.id);
      const total = catTxs.reduce((sum, t) => sum + t.amount, 0);
      if (total > 0) stats.push({
        name: cat.name, amount: total, type: cat.type, catId: cat.id, txCount: catTxs.length,
        color: cat.type === 'income' ? '#81c995' : '#8ab4f8'
      });
    });
    return stats.sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  // Get transactions for the selected category popup
  const selectedCategoryTxs = useMemo(() => {
    if (!selectedCategory) return [];
    return transactions
      .filter(t => t.categoryId === selectedCategory.catId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedCategory]);

  const EXPENSE_COLORS = ['#8ab4f8', '#f28b82', '#fdd663', '#81c995', '#c58af9', '#78d9ec'];
  const INCOME_COLORS = ['#81c995', '#34d399', '#6ee7b7', '#a7f3d0'];

  const renderCustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="px-4 py-3 rounded-2xl shadow-xl space-y-2" style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }}></span>
              <span className="text-[10px] text-text-muted font-semibold uppercase tracking-widest">{p.dataKey}</span>
            </div>
            <span className="text-sm font-bold text-white">{CURRENCY_SYMBOL}{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 md:pb-10">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Income', value: totalIncome, color: '#81c995', icon: 'fa-arrow-trend-up' },
          { label: 'Total Expense', value: totalExpense, color: '#f28b82', icon: 'fa-arrow-trend-down' },
          { label: 'Net Balance', value: globalBalance, color: '#8ab4f8', icon: 'fa-wallet' },
          { label: 'Transactions', value: transactions.length, color: '#c58af9', icon: 'fa-receipt', isCnt: true },
        ].map((s, i) => (
          <div key={i} className="p-4 sm:p-5 rounded-card relative group overflow-hidden transition-all duration-200 hover:translate-y-[-2px]" style={{
            animation: `fadeUp 0.4s ease ${i * 0.07}s both`,
            background: 'var(--surface-1)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}10`, color: s.color }}>
                <i className={`fa-solid ${s.icon} text-base`}></i>
              </div>
            </div>
            <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {s.isCnt ? s.value : <>{CURRENCY_SYMBOL}{formatCurrency(s.value)}</>}
            </p>
          </div>
        ))}
      </div>

      {/* Primary Analytical Graph */}
      <div className="p-5 sm:p-7 rounded-card relative overflow-hidden" style={{ animation: 'fadeUp 0.5s ease 0.15s both', background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h4 className="text-base font-bold text-white tracking-tight">Cash Flow</h4>
            <span className="text-[10px] text-text-muted font-medium">Last 15 Days</span>
          </div>
          <div className="flex items-center gap-5">
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#8ab4f8' }}></div>
                <span className="text-[10px] text-text-secondary font-semibold">Income</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f28b82' }}></div>
                <span className="text-[10px] text-text-secondary font-semibold">Expense</span>
             </div>
          </div>
        </div>
        <div className="w-full h-[240px] sm:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8ab4f8" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#8ab4f8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="criticalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f28b82" stopOpacity={0.08}/>
                  <stop offset="95%" stopColor="#f28b82" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#5f6368' }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#5f6368' }} tickFormatter={(val) => formatCurrency(val)} />
              <Tooltip content={renderCustomTooltip} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="income" stroke="#8ab4f8" fill="url(#primaryGrad)" strokeWidth={2.5} dot={{ r: 3, fill: '#8ab4f8', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: '#8ab4f8' }} />
              <Area type="monotone" dataKey="expense" stroke="#f28b82" fill="url(#criticalGrad)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sector Allocation (Pie Charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {[
          { title: 'Income Sources', subtitle: 'Where your money comes from', data: incomePieData, colors: INCOME_COLORS, accent: '#81c995' },
          { title: 'Expenses', subtitle: 'Where your money goes', data: expensePieData, colors: EXPENSE_COLORS, accent: '#f28b82' },
        ].map((chart, ci) => (
          <div key={ci} className="p-5 sm:p-7 rounded-card relative" style={{
            animation: `fadeUp 0.5s ease ${0.25 + ci * 0.07}s both`,
            background: 'var(--surface-1)',
            border: '1px solid rgba(255,255,255,0.04)'
          }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">{chart.title}</h4>
                <p className="text-[10px] text-text-muted font-medium mt-0.5">{chart.subtitle}</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${chart.accent}10`, color: chart.accent }}>
                <i className={`fa-solid ${ci === 0 ? 'fa-chart-pie' : 'fa-chart-line'} text-base`}></i>
              </div>
            </div>
            <div className="w-full h-[260px]">
              {chart.data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chart.data} innerRadius="65%" outerRadius="88%" paddingAngle={4} dataKey="value" animationBegin={100} animationDuration={800}>
                      {chart.data.map((_, i) => <Cell key={i} fill={chart.colors[i % chart.colors.length]} stroke="none" />)}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 600, paddingTop: '16px', color: '#9aa0a6' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="px-4 py-2 rounded-xl shadow-xl" style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <p className="text-[10px] font-semibold text-text-muted mb-0.5">{payload[0].name}</p>
                              <p className="text-sm font-bold text-white">{CURRENCY_SYMBOL}{formatCurrency(payload[0].value)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full flex-col gap-2 opacity-30">
                  <i className="fa-solid fa-chart-pie text-3xl"></i>
                  <p className="text-[10px] font-semibold">No data yet</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Category Breakdown — Clickable Cards */}
      {CATEGORY_STATS.length > 0 && (
        <div style={{ animation: 'fadeUp 0.5s ease 0.35s both' }}>
          <div className="flex items-center justify-between mb-5 px-1">
            <h4 className="text-xs font-bold uppercase text-text-muted tracking-widest">Category Breakdown</h4>
            <div className="h-px flex-1 mx-5" style={{ background: 'rgba(255,255,255,0.04)' }}></div>
            <span className="text-[10px] text-text-muted font-medium">Click to view details</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {CATEGORY_STATS.map((stat, i) => {
              const maxAmount = CATEGORY_STATS[0]?.amount || 1;
              return (
                <div key={i}
                  className="p-4 rounded-card group relative overflow-hidden cursor-pointer transition-all duration-200 hover:translate-y-[-3px]"
                  style={{
                    animation: `fadeUp 0.3s ease ${0.4 + i * 0.03}s both`,
                    background: 'var(--surface-1)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                  onClick={() => setSelectedCategory({ name: stat.name, type: stat.type, catId: stat.catId })}
                >
                  {/* Hover indicator */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-t-card" style={{ background: stat.color }} />
                  
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: stat.color }}>{stat.type}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted">
                      <i className="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-text-secondary truncate mb-1">{stat.name}</p>
                  <p className="text-base sm:text-lg font-bold tracking-tight" style={{ color: stat.color }}>
                     <span className="text-[10px] mr-0.5 opacity-50">{CURRENCY_SYMBOL}</span>
                     {formatCurrency(stat.amount)}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex-1 h-[3px] rounded-full mr-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(stat.amount / maxAmount) * 100}%`, background: stat.color, opacity: 0.6 }} />
                    </div>
                    <span className="text-[9px] text-text-muted font-medium">{stat.txCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* CATEGORY DETAIL POPUP MODAL                   */}
      {/* ============================================= */}
      {/* Category Detail Modal — rendered via portal to body */}
      {selectedCategory && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          style={{ animation: 'backdropIn 0.2s ease both' }}
          onClick={() => setSelectedCategory(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />

          {/* Modal */}
          <div
            className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-card"
            style={{
              background: 'var(--surface-1)',
              border: '1px solid rgba(255,255,255,0.08)',
              animation: 'modalIn 0.3s ease both',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 pb-4" style={{ background: 'var(--surface-1)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: selectedCategory.type === 'income' ? '#81c995' : '#8ab4f8' }}>
                  {selectedCategory.type}
                </p>
                <h3 className="text-lg font-bold text-white">{selectedCategory.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-white transition-colors"
                style={{ background: 'var(--surface-2)' }}
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Summary */}
            <div className="px-5 py-3 flex items-center gap-4" style={{ background: 'var(--surface-2)' }}>
              <div className="flex-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-0.5">Total</p>
                <p className="text-lg font-bold" style={{ color: selectedCategory.type === 'income' ? '#81c995' : '#8ab4f8' }}>
                  {CURRENCY_SYMBOL}{formatCurrency(selectedCategoryTxs.reduce((s, t) => s + t.amount, 0))}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-0.5">Entries</p>
                <p className="text-lg font-bold text-white">{selectedCategoryTxs.length}</p>
              </div>
            </div>

            {/* Transaction List */}
            <div className="p-4 space-y-1.5">
              {selectedCategoryTxs.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs text-text-muted font-medium">No transactions in this category</p>
                </div>
              ) : (
                selectedCategoryTxs.map((t, i) => {
                  const acc = accounts.find(a => a.id === t.fromAccountId);
                  const typeColor = t.type === 'income' ? '#81c995' : '#f28b82';
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-pill transition-all duration-200 hover:translate-x-1" style={{
                      background: 'var(--surface-2)',
                      border: '1px solid rgba(255,255,255,0.03)',
                      animation: `fadeUp 0.25s ease ${i * 0.03}s both`
                    }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{t.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-text-muted font-medium">{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          {acc && <span className="text-[9px] text-text-muted font-medium">• {acc.name}</span>}
                        </div>
                      </div>
                      <p className="text-sm font-bold ml-3 shrink-0" style={{ color: typeColor }}>
                        {t.type === 'expense' || t.type === 'cc_action' ? '−' : '+'}{CURRENCY_SYMBOL}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;
