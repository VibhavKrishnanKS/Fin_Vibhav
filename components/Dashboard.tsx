
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Transaction, Category, Account } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, categories, accounts }) => {
  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions]);

  const chartData = useMemo(() => {
    const last15 = Array.from({ length: 15 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    return last15.map(date => ({
      date: date.split('-').slice(1).join('/'),
      income: transactions.filter(t => t.date === date && t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: transactions.filter(t => t.date === date && t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }));
  }, [transactions]);

  const expensePieData = useMemo(() => {
    const catTotals: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
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
    const stats: { name: string, amount: number, type: string, color: string }[] = [];
    categories.forEach(cat => {
      const total = transactions.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0);
      if (total > 0) stats.push({ name: cat.name, amount: total, type: cat.type, color: cat.type === 'income' ? '#34A853' : '#4285F4' });
    });
    return stats.sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  const EXPENSE_COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853', '#8ab4f8', '#f28b82'];
  const INCOME_COLORS = ['#34A853', '#81c995', '#a8dab5', '#ceead6'];

  const renderCustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="px-4 py-3 rounded-2xl glass shadow-2xl space-y-2 translate-y-[-10px]">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color, boxShadow: `0 0 10px ${p.color}` }}></span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p.dataKey}</span>
            </div>
            <span className="text-sm font-bold text-white">{CURRENCY_SYMBOL}{p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 md:pb-10">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Revenue Flow', value: totalIncome, color: '#34A853', icon: 'fa-arrow-up-right-dots' },
          { label: 'Asset Outflow', value: totalExpense, color: '#EA4335', icon: 'fa-arrow-down-left-and-arrow-up-right-to-center' },
          { label: 'Liquidity Surplus', value: totalIncome - totalExpense, color: '#4285F4', icon: 'fa-vault' },
          { label: 'Active Ledgers', value: transactions.length, color: '#FBBC04', icon: 'fa-database', isCnt: true },
        ].map((s, i) => (
          <div key={i} className="glass p-5 rounded-[28px] relative group overflow-hidden shine-hover" style={{
            animation: `fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s both`,
          }}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style={{ background: `${s.color}15`, color: s.color }}>
                <i className={`fa-solid ${s.icon} text-lg`}></i>
              </div>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.color }}></div>
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {s.isCnt ? s.value : `${CURRENCY_SYMBOL}${s.value.toLocaleString()}`}
            </p>
          </div>
        ))}
      </div>

      {/* Primary Analytical Graph */}
      <div className="glass p-5 sm:p-8 rounded-[36px] relative overflow-hidden" style={{ animation: 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h4 className="text-lg font-bold text-white tracking-tight">Financial Trajectory</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Institutional Analysis • Last 15 Cycles</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-[0_0_10px_#4285F4]" style={{ border: '2px solid #4285F4' }}></div>
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Inflow</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full opacity-60" style={{ border: '2px solid #EA4335' }}></div>
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Outflow</span>
             </div>
          </div>
        </div>
        <div className="w-full h-[280px] sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4285F4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4285F4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="criticalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EA4335" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#EA4335" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#4b5563' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#4b5563' }} />
              <Tooltip content={renderCustomTooltip} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="income" stroke="#4285F4" fill="url(#primaryGrad)" strokeWidth={4} dot={{ r: 4, fill: '#4285F4', strokeWidth: 2, stroke: '#0a0f1a' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#4285F4' }} />
              <Area type="monotone" dataKey="expense" stroke="#EA4335" fill="url(#criticalGrad)" strokeWidth={2} strokeDasharray="6 6" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sector Allocation Modals (Pie Charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {[
          { title: 'Capital Allocation', subtitle: 'Revenue Stream Distribution', data: incomePieData, colors: INCOME_COLORS, accent: '#34A853' },
          { title: 'Operating Expenses', subtitle: 'System Outflow Breakdown', data: expensePieData, colors: EXPENSE_COLORS, accent: '#EA4335' },
        ].map((chart, ci) => (
          <div key={ci} className="glass p-6 sm:p-8 rounded-[36px] relative" style={{
            animation: `fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.4 + ci * 0.1}s both`,
          }}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-white tracking-tight">{chart.title}</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{chart.subtitle}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${chart.accent}10`, color: chart.accent }}>
                <i className={`fa-solid ${ci === 0 ? 'fa-chart-pie' : 'fa-chart-line-down'} text-lg`}></i>
              </div>
            </div>
            <div className="w-full h-[280px]">
              {chart.data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chart.data} innerRadius="65%" outerRadius="90%" paddingAngle={8} dataKey="value" animationBegin={200} animationDuration={1200}>
                      {chart.data.map((_, i) => <Cell key={i} fill={chart.colors[i % chart.colors.length]} stroke="none" style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }} />)}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="px-4 py-2 glass rounded-2xl shadow-2xl">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{payload[0].name}</p>
                              <p className="text-sm font-black text-white">{CURRENCY_SYMBOL}{payload[0].value.toLocaleString()}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full flex-col gap-3 opacity-30">
                  <i className="fa-solid fa-inbox text-4xl"></i>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Insufficient Data</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Grid */}
      {CATEGORY_STATS.length > 0 && (
        <div style={{ animation: 'fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both' }}>
          <div className="flex items-center justify-between mb-6 px-1">
            <h4 className="text-[11px] font-black uppercase text-gray-500 tracking-[0.3em]">Operational Metrics</h4>
            <div className="h-[1px] flex-1 mx-6 bg-white/5"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {CATEGORY_STATS.map((stat, i) => {
              const maxAmount = CATEGORY_STATS[0]?.amount || 1;
              return (
                <div key={i} className="glass p-5 rounded-[24px] group relative overflow-hidden transition-all duration-300 hover:translate-y-[-4px]" style={{
                  animation: `fadeUp 0.5s ease-out ${0.7 + i * 0.05}s both`,
                }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: stat.color, background: stat.color }}></span>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-50">{stat.type}</span>
                  </div>
                  <p className="text-[11px] font-bold text-gray-300 truncate mb-1">{stat.name}</p>
                  <p className="text-base font-black text-white">{CURRENCY_SYMBOL}{stat.amount.toLocaleString()}</p>
                  <div className="mt-4 w-full h-[3px] rounded-full bg-white/5 relative overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 group-hover:brightness-125" style={{ width: `${(stat.amount / maxAmount) * 100}%`, background: stat.color, boxShadow: `0 0 10px ${stat.color}40` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
};

export default Dashboard;
