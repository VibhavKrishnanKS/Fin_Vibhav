
import React from 'react';
import { Account } from '../types';
import { CURRENCY_SYMBOL, formatCurrency } from '../constants';

interface AccountSummaryProps {
  accounts: Account[];
}

const AccountSummary: React.FC<AccountSummaryProps> = ({ accounts }) => {
  const total = accounts.reduce((s, a) =>
    s + (a.type !== 'credit' ? a.balance : (a.balance - (a.creditLimit || 0))), 0);

  const typeIcon: Record<string, string> = {
    bank:   'fa-building-columns',
    credit: 'fa-credit-card',
    cash:   'fa-wallet',
  };
  const typeLabel: Record<string, string> = {
    bank: 'Bank', credit: 'Credit', cash: 'Cash',
  };

  return (
    <div className="space-y-4" style={{ animation: 'fadeUp 0.4s ease both' }}>

      {/* ── Net Worth Banner ── */}
      <div className="relative overflow-hidden rounded-[22px] p-6 sm:p-8"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>

        {/* Subtle tinted orb */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,116,224,0.08) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--secondary)', boxShadow: '0 0 6px var(--secondary)', animation: 'pulse-dot 2s ease infinite' }} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--text-3)' }}>
                Portfolio Value
              </p>
            </div>
            <p className="font-display font-bold tracking-tight text-white"
              style={{ fontSize: 'clamp(30px, 7vw, 44px)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              <span className="text-[18px] font-medium mr-1" style={{ color: 'var(--text-2)' }}>{CURRENCY_SYMBOL}</span>
              {formatCurrency(total)}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto px-4 py-2.5 rounded-xl"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <i className="fa-solid fa-shield-halved text-xs" style={{ color: 'var(--primary)' }} />
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-2)' }}>
              {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'} Active
            </span>
          </div>
        </div>
      </div>

      {/* ── Account Cards Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {accounts.map((acc, idx) => {
          const isCredit   = acc.type === 'credit';
          const spent      = isCredit ? (acc.creditLimit || 0) - acc.balance : 0;
          const utilPct    = isCredit ? Math.min((spent / (acc.creditLimit || 1)) * 100, 100) : 0;
          const dangerZone = utilPct > 75;

          return (
            <div key={acc.id}
              className="group relative p-4 sm:p-5 rounded-[18px] transition-all duration-200 hover:-translate-y-0.5"
              style={{
                animation: `fadeUp 0.4s ease ${idx * 0.07}s both`,
                background: 'var(--surface-1)',
                border: '1px solid var(--border)',
              }}>

              {/* Left accent stripe */}
              <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full opacity-40 group-hover:opacity-100 transition-opacity"
                style={{ background: acc.color }} />

              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${acc.color}14`, color: acc.color }}>
                  <i className={`fa-solid ${typeIcon[acc.type]} text-sm`} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                  style={{ color: acc.color, background: `${acc.color}12` }}>
                  {typeLabel[acc.type]}
                </span>
              </div>

              <p className="text-[10px] font-medium mb-1 truncate" style={{ color: 'var(--text-3)' }}>{acc.name}</p>
              <p className="font-display font-bold text-white"
                style={{ fontSize: 'clamp(16px, 4vw, 20px)', letterSpacing: '-0.02em' }}>
                <span className="text-[10px] font-normal mr-0.5" style={{ color: 'var(--text-3)' }}>{CURRENCY_SYMBOL}</span>
                {formatCurrency(acc.balance)}
              </p>

              {isCredit ? (
                <div className="mt-3 space-y-1.5">
                  <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${utilPct}%`, background: dangerZone ? 'var(--danger)' : acc.color }} />
                  </div>
                  <div className="flex justify-between text-[9px]" style={{ color: 'var(--text-3)' }}>
                    <span style={{ color: dangerZone ? 'var(--danger)' : undefined }}>{utilPct.toFixed(0)}% used</span>
                    <span>{CURRENCY_SYMBOL}{formatCurrency(acc.creditLimit || 0)} limit</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-3 text-[9px]" style={{ color: 'var(--text-3)' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--secondary)' }} />
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
