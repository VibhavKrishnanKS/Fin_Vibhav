
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction, Category, Account } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, categories, accounts }) => {
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
      const total = transactions
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      if (total > 0) {
        stats.push({
          name: cat.name,
          amount: total,
          type: cat.type,
          color: cat.type === 'income' ? '#10b981' : '#d4af37'
        });
      }
    });
    return stats.sort((a, b) => b.amount - a.amount);
  }, [transactions, categories]);

  const COLORS = ['#d4af37', '#ffffff', '#71717a', '#3f3f46', '#a1a1aa'];
  const INCOME_COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

  return (
    <div className="space-y-6 animate-page-enter pb-24 md:pb-10">
      {/* 1. WEALTH DYNAMICS - Trend Chart */}
      <div className="glass-card p-5 md:p-8 rounded-[2rem] flex flex-col min-h-[350px] md:min-h-[450px]">
        <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
          Wealth Dynamics Trend
        </h4>
        <div className="flex-1 w-full min-h-[250px] h-[300px] md:h-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%" debounce={100} minHeight={200}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4af37" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#52525b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#52525b' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#121214', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '10px' }}
                cursor={{ stroke: '#d4af37', strokeOpacity: 0.1 }}
              />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="transparent" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="income" stroke="#d4af37" fill="url(#goldGrad)" strokeWidth={3} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. DUAL PIE CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 md:p-8 rounded-[2.5rem] flex flex-col items-center min-h-[300px]">
          <h4 className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4 w-full">Revenue Allocation</h4>
          <div className="flex-1 w-full min-h-[200px] h-[220px]">
            <ResponsiveContainer width="100%" height="100%" debounce={100} minHeight={150}>
              <PieChart>
                <Pie data={incomePieData} innerRadius="60%" outerRadius="80%" paddingAngle={4} dataKey="value">
                  {incomePieData.map((_, i) => <Cell key={`cell-${i}`} fill={INCOME_COLORS[i % INCOME_COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 md:p-8 rounded-[2.5rem] flex flex-col items-center min-h-[300px]">
          <h4 className="text-[9px] font-black text-rose-500 uppercase tracking-[0.4em] mb-4 w-full">Expenditure Allocation</h4>
          <div className="flex-1 w-full min-h-[200px] h-[220px]">
            <ResponsiveContainer width="100%" height="100%" debounce={100} minHeight={150}>
              <PieChart>
                <Pie data={expensePieData} innerRadius="60%" outerRadius="80%" paddingAngle={4} dataKey="value">
                  {expensePieData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. CATEGORY RECTANGLES - Grid Optimized */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-2">Category Impact Metrics</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {CATEGORY_STATS.map((stat, i) => (
            <div 
              key={i} 
              className="glass-card p-4 rounded-2xl flex flex-col justify-between border border-white/5 bg-zinc-900/40 hover:bg-zinc-800 transition-all group min-h-[100px]"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: stat.color }}></span>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.1em] truncate">{stat.type}</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-200 uppercase tracking-widest line-clamp-2 mb-1 group-hover:text-white leading-tight">{stat.name}</p>
              <p className="text-xs font-black" style={{ color: stat.color }}>
                {CURRENCY_SYMBOL}{stat.amount.toLocaleString()}
              </p>
            </div>
          ))}
          {CATEGORY_STATS.length === 0 && (
            <div className="col-span-full py-12 text-center glass-card rounded-[2rem] border-dashed">
              <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.5em]">Awaiting Financial Flow...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
