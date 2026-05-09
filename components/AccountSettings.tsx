
import React, { useState } from 'react';
import { Account, AccountType } from '../types';
import { CURRENCY_SYMBOL, formatCurrency } from '../constants';

interface AccountSettingsProps {
  accounts:     Account[];
  onAdd:        (account: Omit<Account, 'id'>) => void;
  onUpdate:     (id: string, updates: Partial<Account>) => void;
  onDelete:     (id: string) => void;
  onRebalance:  () => void;
  onFreshStart: () => void;
}

const TYPE_ICON:  Record<string, string> = { bank: 'fa-building-columns', credit: 'fa-credit-card', cash: 'fa-wallet' };
const TYPE_LABEL: Record<string, string> = { bank: 'Bank', credit: 'Credit', cash: 'Cash' };

const AccountSettings: React.FC<AccountSettingsProps> = ({
  accounts, onAdd, onUpdate, onDelete, onRebalance, onFreshStart,
}) => {
  const [isAdding,     setIsAdding]     = useState(false);
  const [newName,      setNewName]      = useState('');
  const [newBalance,   setNewBalance]   = useState('');
  const [newLimit,     setNewLimit]     = useState('');
  const [newType,      setNewType]      = useState<AccountType>('bank');
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editName,     setEditName]     = useState('');
  const [editBalance,  setEditBalance]  = useState('');
  const [editLimit,    setEditLimit]    = useState('');
  const [editType,     setEditType]     = useState<AccountType>('bank');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newBalance) return;
    onAdd({
      name:          newName.trim(),
      initialBalance: parseFloat(newBalance),
      balance:       parseFloat(newBalance),
      type:          newType,
      color:         `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
      creditLimit:   newType === 'credit' ? parseFloat(newLimit) : undefined,
    });
    setNewName(''); setNewBalance(''); setNewLimit(''); setIsAdding(false);
  };

  const startEditing = (acc: Account) => {
    setEditingId(acc.id);
    setEditName(acc.name);
    setEditBalance(acc.initialBalance.toString());
    setEditType(acc.type);
    setEditLimit(acc.creditLimit?.toString() || '0');
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim() || !editBalance) return;
    onUpdate(id, {
      name:          editName.trim(),
      initialBalance: parseFloat(editBalance),
      type:          editType,
      creditLimit:   editType === 'credit' ? parseFloat(editLimit) : undefined,
    });
    setEditingId(null);
  };

  /* Shared input style */
  const inp = "w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-white outline-none transition-all placeholder:text-[var(--text-3)]";
  const inpS = { background: 'var(--surface-2)', border: '1px solid var(--border)' } as React.CSSProperties;

  return (
    <div className="rounded-[22px] p-5 sm:p-7 relative overflow-hidden"
      style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', animation: 'fadeUp 0.4s ease both' }}>

      {/* Section header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(108,158,248,0.12)', color: 'var(--primary)' }}>
              <i className="fa-solid fa-vault text-[11px]" />
            </div>
            <h2 className="font-display font-bold text-white text-base tracking-tight">Manage Accounts</h2>
          </div>
          <p className="text-[11px] ml-8" style={{ color: 'var(--text-3)' }}>Wallets, bank accounts &amp; cards</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={onFreshStart}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-2 justify-center transition-all btn-danger">
            <i className="fa-solid fa-rotate-left text-[10px]" />
            Fresh Start
          </button>
          <button onClick={onRebalance}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-2 justify-center transition-all"
            style={{ background: 'rgba(245,200,66,0.08)', color: 'var(--accent)', border: '1px solid rgba(245,200,66,0.15)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,200,66,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,200,66,0.08)')}>
            <i className="fa-solid fa-sync text-[10px]" />
            Sync Tally
          </button>
          <button onClick={() => setIsAdding(!isAdding)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-2 justify-center transition-all shine-hover ${isAdding ? '' : 'btn-primary-glow text-white'}`}
            style={isAdding ? { background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' } : {}}>
            <i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'} text-[10px]`} />
            {isAdding ? 'Cancel' : 'Add Account'}
          </button>
        </div>
      </div>

      {/* ── Add Account Form ── */}
      {isAdding && (
        <form onSubmit={handleAdd}
          className="mb-6 p-4 sm:p-5 rounded-[18px] space-y-4"
          style={{ animation: 'slideDown 0.25s ease both', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-3)' }}>Account Name</p>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="e.g. HDFC Savings" className={inp} style={inpS} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-3)' }}>Type</p>
              <select value={newType} onChange={e => setNewType(e.target.value as AccountType)}
                className={inp} style={{ ...inpS, appearance: 'none' as any }}>
                <option value="bank">Bank Account</option>
                <option value="credit">Credit Card</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-3)' }}>Opening Balance</p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)] text-sm">{CURRENCY_SYMBOL}</span>
                <input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)}
                  placeholder="0.00" className={`${inp} pl-8`} style={inpS} />
              </div>
            </div>
            {newType === 'credit' && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-3)' }}>Credit Limit</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-3)] text-sm">{CURRENCY_SYMBOL}</span>
                  <input type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)}
                    placeholder="Enter limit" className={`${inp} pl-8`} style={inpS} />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button type="submit"
              className="px-6 py-2.5 rounded-xl text-[11px] font-semibold text-white btn-primary-glow transition-all active:scale-95 shine-hover">
              Save Account
            </button>
          </div>
        </form>
      )}

      {/* ── Account List ── */}
      <div className="space-y-2.5">
        {accounts.map((acc, i) => (
          <div key={acc.id}
            className="group p-4 sm:p-5 rounded-[18px] relative overflow-hidden transition-all duration-200"
            style={{ animation: `fadeUp 0.4s ease ${i * 0.06}s both`, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>

            {/* Left accent */}
            <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full opacity-30 group-hover:opacity-100 transition-opacity"
              style={{ background: acc.color }} />

            {editingId === acc.id ? (
              /* Edit mode */
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-3)' }}>Name</p>
                    <input className={inp} style={inpS} value={editName} onChange={e => setEditName(e.target.value)} />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-3)' }}>Initial Balance</p>
                    <input className={inp} style={inpS} type="number" value={editBalance} onChange={e => setEditBalance(e.target.value)} />
                    <p className="text-[9px] mt-1" style={{ color: 'var(--primary)' }}>
                      New balance → {CURRENCY_SYMBOL}{formatCurrency(parseFloat(editBalance || '0') + (acc.balance - acc.initialBalance))}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-3)' }}>Type</p>
                    <select className={inp} style={{ ...inpS, appearance: 'none' as any }} value={editType} onChange={e => setEditType(e.target.value as AccountType)}>
                      <option value="bank">Bank</option>
                      <option value="credit">Credit</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                  {editType === 'credit' && (
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--text-3)' }}>Credit Limit</p>
                      <input className={inp} style={inpS} type="number" value={editLimit} onChange={e => setEditLimit(e.target.value)} placeholder="Limit" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(acc.id)}
                    className="px-5 py-2 rounded-xl text-[11px] font-semibold text-white btn-primary-glow transition-all active:scale-95">
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="px-5 py-2 rounded-xl text-[11px] font-semibold transition-all"
                    style={{ background: 'var(--surface-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
                    style={{ background: `${acc.color}14`, color: acc.color }}>
                    <i className={`fa-solid ${TYPE_ICON[acc.type]} text-sm`} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-white">{acc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: acc.color }} />
                      <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{TYPE_LABEL[acc.type]}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pl-14 sm:pl-0">
                  <div className="text-right">
                    <p className="font-display font-bold text-white" style={{ fontSize: 'clamp(16px, 4vw, 20px)', letterSpacing: '-0.02em' }}>
                      <span className="text-[10px] mr-0.5" style={{ color: 'var(--text-3)' }}>{CURRENCY_SYMBOL}</span>
                      {formatCurrency(acc.balance)}
                    </p>
                    {acc.type === 'credit' && (
                      <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>
                        Limit: {CURRENCY_SYMBOL}{formatCurrency(acc.creditLimit || 0)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEditing(acc)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                      style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
                      <i className="fa-solid fa-pen-to-square text-[11px]" />
                    </button>
                    <button onClick={() => onDelete(acc.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                      style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
                      <i className="fa-solid fa-trash-can text-[11px]" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountSettings;
