
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

const EXPENSE_COLORS = ['#6c9ef8', '#e8685e', '#f5c842', '#5ecb8a', '#c084fc', '#67e8f9'];
const INCOME_COLORS  = ['#5ecb8a', '#34d399', '#6ee7b7', '#a7f3d0'];

const Dashboard: React.FC<DashboardProps> = ({ transactions, categories, accounts }) => {
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; type: string; catId: string } | null>(null);

  // Lock body scroll when category modal is open
  React.useEffect(() => {
    if (selectedCategory) {
      document.body.style.overflow = 'hidden';
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }, [selectedCategory]);

  const totalIncome  = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense' || t.type === 'cc_action').reduce((s, t) => s + t.amount, 0), [transactions]);
  const globalBalance = useMemo(() => accounts.reduce((s, a) => {
    if (a.type !== 'credit') return s + a.balance;
    return s - ((a.creditLimit || 0) - a.balance);
  }, 0), [accounts]);

  const chartData = useMemo(() => {
    const last15 = Array.from({ length: 15 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    return last15.map(date => ({
      date: date.split('-').slice(1).join('/'),
      income:  transactions.filter(t => t.date === date && t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: transactions.filter(t => t.date === date && (t.type === 'expense' || t.type === 'cc_action')).reduce((s, t) => s + t.amount, 0),
    }));
  }, [transactions]);

  const expensePieData = useMemo(() => {
    const c: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense' || t.type === 'cc_action').forEach(t => {
      const name = categories.find(c => c.id === t.categoryId)?.name || 'Other';
      c[name] = (c[name] || 0) + t.amount;
    });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [transactions, categories]);

  const incomePieData = useMemo(() => {
    const c: Record<string, number> = {};
    transactions.filter(t => t.type === 'income').forEach(t => {
      const name = categories.find(c => c.id === t.categoryId)?.name || 'Other';
      c[name] = (c[name] || 0) + t.amount;
    });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  }, [transactions, categories]);

  const CATEGORY_STATS = useMemo(() => {
    const stats: { name: string; amount: number; type: string; color: string; catId: string; txCount: number }[] = [];
    categories.forEach(cat => {
      const catTxs = transactions.filter(t => t.categoryId === cat.id);
      const total  = catTxs.reduce((sum, t) => sum + t.amount, 0);
      if (total > 0) stats.push({
        name: cat.name, amount: total, type: cat.type, catId: cat.id, txCount: catTxs.length,
        color: cat.type === 'income' ? '#5ecb8a' : '#6c9ef8',
      });
    });
    return stats.sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  const selectedCategoryTxs = useMemo(() => {
    if (!selectedCategory) return [];
    return transactions
      .filter(t => t.categoryId === selectedCategory.catId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedCategory]);

  const ChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="px-4 py-3 rounded-2xl space-y-2 text-sm shadow-xl"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-2)' }}>{p.dataKey}</span>
            </div>
            <span className="font-bold text-white">{CURRENCY_SYMBOL}{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const METRICS = [
    { label: 'Total Income',  value: totalIncome,          color: '#5ecb8a', icon: 'fa-arrow-trend-up',   isCnt: false },
    { label: 'Total Expense', value: totalExpense,         color: '#e8685e', icon: 'fa-arrow-trend-down',  isCnt: false },
    { label: 'Net Balance',   value: globalBalance,        color: '#6c9ef8', icon: 'fa-wallet',            isCnt: false },
    { label: 'Transactions',  value: transactions.length,  color: '#c084fc', icon: 'fa-receipt',           isCnt: true  },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 pb-10">

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {METRICS.map((m, i) => (
          <div key={i}
            className="p-4 sm:p-5 rounded-[18px] relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 group"
            style={{ animation: `fadeUp 0.4s ease ${i * 0.07}s both`, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(circle, ${m.color}0a 0%, transparent 70%)` }} />
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${m.color}14`, color: m.color }}>
                <i className={`fa-solid ${m.icon} text-sm`} />
              </div>
            </div>
            <p className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--text-3)' }}>{m.label}</p>
            <p className="font-display font-bold text-white"
              style={{ fontSize: 'clamp(16px, 4vw, 20px)', letterSpacing: '-0.02em' }}>
              {m.isCnt ? m.value : <>{CURRENCY_SYMBOL}{formatCurrency(m.value)}</>}
            </p>
          </div>
        ))}
      </div>

      {/* Cash Flow Chart */}
      <div className="p-5 sm:p-7 rounded-[22px] relative overflow-hidden"
        style={{ animation: 'fadeUp 0.45s ease 0.15s both', background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-display font-semibold text-white text-base">Cash Flow</h3>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>Last 15 days</p>
          </div>
          <div className="flex items-center gap-5">
            {[{ c: '#6c9ef8', l: 'Income' }, { c: '#e8685e', l: 'Expense' }].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-2)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-full landscape-compact" style={{ height: 'clamp(180px, 30vw, 300px)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6c9ef8" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#6c9ef8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#e8685e" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#e8685e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500, fill: 'var(--text-3)' }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500, fill: 'var(--text-3)' }} tickFormatter={v => formatCurrency(v)} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="income" stroke="#6c9ef8" fill="url(#incGrad)" strokeWidth={2}
                dot={{ r: 3, fill: '#6c9ef8', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0, fill: '#6c9ef8' }} />
              <Area type="monotone" dataKey="expense" stroke="#e8685e" fill="url(#expGrad)" strokeWidth={1.5}
                strokeDasharray="5 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Income Sources', subtitle: 'Where money comes from', data: incomePieData,  colors: INCOME_COLORS,  accent: '#5ecb8a', icon: 'fa-chart-pie' },
          { title: 'Expenses',       subtitle: 'Where money goes',       data: expensePieData, colors: EXPENSE_COLORS, accent: '#e8685e', icon: 'fa-chart-bar' },
        ].map((chart, ci) => (
          <div key={ci} className="p-5 sm:p-6 rounded-[22px] relative"
            style={{ animation: `fadeUp 0.45s ease ${0.2 + ci * 0.07}s both`, background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-white text-sm">{chart.title}</h3>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{chart.subtitle}</p>
              </div>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${chart.accent}14`, color: chart.accent }}>
                <i className={`fa-solid ${chart.icon} text-sm`} />
              </div>
            </div>
            <div style={{ height: 240 }}>
              {chart.data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chart.data} innerRadius="62%" outerRadius="84%" paddingAngle={3} dataKey="value"
                      animationBegin={100} animationDuration={700}>
                      {chart.data.map((_, i) => <Cell key={i} fill={chart.colors[i % chart.colors.length]} stroke="none" />)}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={7}
                      wrapperStyle={{ fontSize: '10px', fontWeight: 500, paddingTop: '12px', color: 'var(--text-2)' }} />
                    <Tooltip
                      content={({ active, payload }) => active && payload?.length ? (
                        <div className="px-3 py-2 rounded-xl shadow-xl"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                          <p className="text-[10px] mb-0.5" style={{ color: 'var(--text-2)' }}>{payload[0].name}</p>
                          <p className="text-sm font-bold text-white">{CURRENCY_SYMBOL}{formatCurrency(payload[0].value as number)}</p>
                        </div>
                      ) : null}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2" style={{ opacity: 0.25 }}>
                  <i className="fa-solid fa-chart-pie text-3xl text-white" />
                  <p className="text-[10px] text-white font-medium">No data yet</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {CATEGORY_STATS.length > 0 && (
        <div style={{ animation: 'fadeUp 0.45s ease 0.3s both' }}>
          <div className="flex items-center gap-3 mb-4 px-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Category Breakdown</h3>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-[10px] whitespace-nowrap" style={{ color: 'var(--text-3)' }}>tap to expand</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {CATEGORY_STATS.map((stat, i) => {
              const maxAmount = CATEGORY_STATS[0]?.amount || 1;
              return (
                <div key={i}
                  className="p-4 rounded-[18px] group relative overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                  style={{ animation: `fadeUp 0.3s ease ${0.35 + i * 0.03}s both`, background: 'var(--surface-1)', border: '1px solid var(--border)' }}
                  onClick={() => setSelectedCategory({ name: stat.name, type: stat.type, catId: stat.catId })}>
                  <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[18px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: stat.color }} />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: stat.color }}>{stat.type}</span>
                    <i className="fa-solid fa-arrow-up-right-from-square text-[8px] opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--text-3)' }} />
                  </div>
                  <p className="text-[11px] font-medium truncate mb-1" style={{ color: 'var(--text-2)' }}>{stat.name}</p>
                  <p className="font-display font-bold" style={{ color: stat.color, fontSize: 'clamp(14px, 3vw, 17px)', letterSpacing: '-0.02em' }}>
                    <span className="text-[9px] opacity-50 mr-0.5">{CURRENCY_SYMBOL}</span>
                    {formatCurrency(stat.amount)}
                  </p>
                  <div className="flex items-center justify-between mt-3 gap-2">
                    <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(stat.amount / maxAmount) * 100}%`, background: stat.color, opacity: 0.6 }} />
                    </div>
                    <span className="text-[9px] shrink-0" style={{ color: 'var(--text-3)' }}>{stat.txCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Detail Modal */}
      {selectedCategory && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ animation: 'backdropIn 0.2s ease both' }}
          onClick={() => setSelectedCategory(null)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }} />
          <div className="relative w-full sm:max-w-lg max-h-[88vh] sm:max-h-[80vh] overflow-y-auto rounded-t-[28px] sm:rounded-[22px]"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', animation: 'modalIn 0.3s ease both' }}
            onClick={e => e.stopPropagation()}>

            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
            </div>

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
              style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] mb-0.5"
                  style={{ color: selectedCategory.type === 'income' ? '#5ecb8a' : '#6c9ef8' }}>
                  {selectedCategory.type}
                </p>
                <h3 className="font-display font-bold text-white text-base">{selectedCategory.name}</h3>
              </div>
              <button onClick={() => setSelectedCategory(null)}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                aria-label="Close modal">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            {/* Summary row */}
            <div className="flex items-center gap-6 px-5 py-3" style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="text-[9px] font-medium mb-0.5" style={{ color: 'var(--text-3)' }}>Total</p>
                <p className="font-display font-bold text-base" style={{ color: selectedCategory.type === 'income' ? '#5ecb8a' : '#6c9ef8' }}>
                  {CURRENCY_SYMBOL}{formatCurrency(selectedCategoryTxs.reduce((s, t) => s + t.amount, 0))}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-medium mb-0.5" style={{ color: 'var(--text-3)' }}>Entries</p>
                <p className="font-display font-bold text-base text-white">{selectedCategoryTxs.length}</p>
              </div>
            </div>

            {/* Transaction list */}
            <div className="p-4 space-y-1.5">
              {selectedCategoryTxs.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>No transactions in this category</p>
                </div>
              ) : selectedCategoryTxs.map((t, i) => {
                const acc = accounts.find(a => a.id === t.fromAccountId);
                const tColor = t.type === 'income' ? '#5ecb8a' : '#e8685e';
                return (
                  <div key={t.id}
                    className="flex items-center justify-between p-3 rounded-[14px] transition-all"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', animation: `fadeUp 0.2s ease ${i * 0.03}s both` }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-white truncate">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>
                          {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        {acc && <span className="text-[9px]" style={{ color: 'var(--text-3)' }}>· {acc.name}</span>}
                      </div>
                    </div>
                    <p className="text-sm font-bold ml-3 shrink-0" style={{ color: tColor }}>
                      {t.type === 'expense' || t.type === 'cc_action' ? '−' : '+'}
                      {CURRENCY_SYMBOL}{formatCurrency(t.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;
