
import React from 'react';
import { Account } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

interface AccountSummaryProps {
  accounts: Account[];
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ accounts }) => {
  const total = accounts.reduce((s, a) => s + (a.type !== 'credit' ? a.balance : 0), 0);

  return (
    <div className="space-y-6" style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      {/* Net Worth Vault Banner */}
      <div className="glass p-6 sm:p-8 rounded-[36px] relative overflow-hidden group shine-hover">
        {/* Animated Background Accent */}
        <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[200%] opacity-[0.05] pointer-events-none" style={{
          background: 'radial-gradient(circle at center, #4285F4 0%, transparent 70%)',
          animation: 'orbFloat1 20s infinite linear'
        }}></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-solid fa-shield-halved text-[#4285F4] text-xs"></i>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em]">Comprehensive Portfolio Value</p>
            </div>
            <p className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl text-gray-500 font-medium">{CURRENCY_SYMBOL}</span>
              {total.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl glass active:scale-95 transition-transform cursor-pointer" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute inset-0"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative"></div>
            </div>
            <span className="text-white text-xs font-bold uppercase tracking-widest">{accounts.length} Assets Synchronized</span>
          </div>
        </div>
      </div>

      {/* Account Asset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {accounts.map((acc, index) => {
          const isCredit = acc.type === 'credit';
          const utilization = isCredit ? (acc.balance / (acc.creditLimit || 1)) * 100 : 0;
          const icon = isCredit ? 'fa-credit-card' : acc.type === 'cash' ? 'fa-wallet' : 'fa-building-columns';

          return (
            <div
              key={acc.id}
              className="glass group relative p-6 rounded-[32px] cursor-default transition-all duration-300 hover:translate-y-[-6px] shine-hover"
              style={{
                animation: `fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s both`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}
            >
              {/* Asset Highlight */}
              <div className="absolute top-0 left-12 right-12 h-[3px] rounded-b-full opacity-0 group-hover:opacity-100 transition-all duration-500" 
                style={{ background: acc.color, boxShadow: `0 0 20px ${acc.color}` }} />

              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110"
                  style={{ background: `${acc.color}12`, color: acc.color, border: `1px solid ${acc.color}25` }}>
                  <i className={`fa-solid ${icon} text-lg`}></i>
                </div>
                <div className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest glass" style={{ color: acc.color }}>
                  {acc.type === 'bank' ? 'Treasury' : acc.type === 'credit' ? 'Liability' : 'Reserve'}
                </div>
              </div>

              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">{acc.name}</p>
              <p className="text-2xl font-black text-white tracking-tight">
                <span className="text-xs text-gray-600 font-medium mr-1">{CURRENCY_SYMBOL}</span>
                {acc.balance.toLocaleString()}
              </p>

              {isCredit ? (
                <div className="mt-5 space-y-2">
                  <div className="w-full h-[6px] rounded-full bg-white/5 relative overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-[1.5s] ease-out group-hover:brightness-125" 
                      style={{ width: `${Math.min(utilization, 100)}%`, background: acc.color, boxShadow: `0 0 10px ${acc.color}40` }} />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    <span>{utilization.toFixed(1)}% Intensity</span>
                    <span>{CURRENCY_SYMBOL}{(acc.creditLimit || 0).toLocaleString()} Cap</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-5 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600 group-hover:text-emerald-500 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                  Verified Asset
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes orbFloat1 { 0% { transform: rotate(0deg) translate(20px) rotate(0deg); } 100% { transform: rotate(360deg) translate(20px) rotate(-360deg); } }
      `}</style>
    </div>
  );
};

export default AccountSummary;
