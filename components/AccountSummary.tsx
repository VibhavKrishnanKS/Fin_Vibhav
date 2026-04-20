
import React from 'react';
import { Account } from '../types';
import { CURRENCY_SYMBOL, formatCurrency } from '../constants';

interface AccountSummaryProps {
  accounts: Account[];
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ accounts }) => {
  const total = accounts.reduce((s, a) => s + (a.type !== 'credit' ? a.balance : (a.balance - (a.creditLimit || 0))), 0);

  return (
    <div className="space-y-5" style={{ animation: 'fadeUp 0.4s ease both' }}>
      {/* Net Worth Banner */}
      <div className="p-5 sm:p-7 rounded-card relative overflow-hidden" style={{ background: 'var(--surface-1)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className="fa-solid fa-shield-halved text-primary text-xs"></i>
              <p className="text-[10px] font-bold uppercase text-text-muted tracking-widest">Portfolio Value</p>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl text-text-muted font-medium">{CURRENCY_SYMBOL}</span>
              {formatCurrency(total)}
            </p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-pill" style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute inset-0 opacity-50"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 relative"></div>
            </div>
            <span className="text-text-secondary text-[10px] font-semibold uppercase tracking-wider">{accounts.length} Accounts Active</span>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {accounts.map((acc, index) => {
          const isCredit = acc.type === 'credit';
          const spent = isCredit ? (acc.creditLimit || 0) - acc.balance : 0;
          const utilization = isCredit ? (spent / (acc.creditLimit || 1)) * 100 : 0;
          const icon = isCredit ? 'fa-credit-card' : acc.type === 'cash' ? 'fa-wallet' : 'fa-building-columns';

          return (
            <div
              key={acc.id}
              className="group relative p-5 rounded-card cursor-default transition-all duration-200 hover:translate-y-[-3px]"
              style={{
                animation: `fadeUp 0.4s ease ${index * 0.07}s both`,
                background: 'var(--surface-1)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {/* Hover accent */}
              <div className="absolute top-0 left-8 right-8 h-[2px] rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                style={{ background: acc.color }} />

              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{ background: `${acc.color}10`, color: acc.color }}>
                  <i className={`fa-solid ${icon} text-base`}></i>
                </div>
                <div className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider" style={{ color: acc.color, background: `${acc.color}08` }}>
                  {acc.type === 'bank' ? 'Bank' : acc.type === 'credit' ? 'Credit' : 'Cash'}
                </div>
              </div>

              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">{acc.name}</p>
              <p className="text-xl font-bold text-white tracking-tight">
                <span className="text-[10px] text-text-muted font-medium mr-0.5">{CURRENCY_SYMBOL}</span>
                {formatCurrency(acc.balance)}
              </p>

              {isCredit ? (
                <div className="mt-4 space-y-1.5">
                  <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="h-full rounded-full transition-all duration-700" 
                      style={{ width: `${Math.min(utilization, 100)}%`, background: acc.color, opacity: 0.7 }} />
                  </div>
                  <div className="flex justify-between text-[9px] font-medium text-text-muted">
                    <span>{utilization.toFixed(0)}% used</span>
                    <span>{CURRENCY_SYMBOL}{formatCurrency(acc.creditLimit || 0)} limit</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-4 text-[9px] font-medium text-text-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  Active
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AccountSummary;
