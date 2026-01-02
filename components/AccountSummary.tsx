
import React from 'react';
import { Account } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

interface AccountSummaryProps {
  accounts: Account[];
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ accounts }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-page-enter">
      {accounts.map((acc) => {
        const isCredit = acc.type === 'credit';
        const utilization = isCredit ? (acc.balance / (acc.creditLimit || 1)) * 100 : 0;
        
        return (
          <div key={acc.id} className="glass-card p-5 rounded-[1.75rem] flex flex-col justify-between h-36 group hover:border-[#d4af37]/30 hover:bg-zinc-900/40 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-inner transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${acc.color}15`, color: acc.color, border: `1px solid ${acc.color}25` }}
              >
                <i className={`fa-solid ${isCredit ? 'fa-credit-card' : acc.type === 'cash' ? 'fa-wallet' : 'fa-building-columns'}`}></i>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white tracking-tight leading-none">
                  {CURRENCY_SYMBOL}{acc.balance.toLocaleString()}
                </p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2 group-hover:text-zinc-300 transition-colors">{acc.name}</p>
              </div>
            </div>
            <div className="mt-auto">
              {isCredit ? (
                <div className="space-y-2">
                  <div className="w-full bg-zinc-800/50 h-1 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#d4af37] transition-all duration-1000" 
                      style={{ width: `${Math.min(utilization, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-zinc-600">
                    <span>Usage: {utilization.toFixed(0)}%</span>
                    <span>{CURRENCY_SYMBOL}{(acc.creditLimit || 0).toLocaleString()} Cap</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[8px] font-bold text-zinc-700 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-[#d4af37]/40 rounded-full animate-pulse"></span>
                  Verified Holding
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AccountSummary;
