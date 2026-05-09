
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Account, Category } from './types';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES, formatCurrency } from './constants';
import {
  auth,
  subscribeToData,
  subscribeToTransactions,
  saveUserData,
  addFirebaseTransaction,
  updateFirebaseTransaction,
  deleteFirebaseTransaction,
  clearAllData,
  logoutUser,
  onAuthStateChanged
} from './services/firebase';
import type { User } from './services/firebase';
import Background3D from './components/Background3D';

import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import AddTransactionModal from './components/AddTransactionModal';
import AccountSummary from './components/AccountSummary';
import CategorySettings from './components/CategorySettings';
import AccountSettings from './components/AccountSettings';
import ExportModal from './components/ExportModal';
import Toast from './components/Toast';
import AuthView from './components/AuthView';
import FreshStartModal from './components/FreshStartModal';

const NAV_ITEMS = [
  { id: 'dashboard',    icon: 'fa-chart-pie',    label: 'Overview'      },
  { id: 'transactions', icon: 'fa-receipt',       label: 'Transactions'  },
  { id: 'settings',     icon: 'fa-sliders',       label: 'Settings'      },
];

const App: React.FC = () => {
  const [user,            setUser]            = useState<User | null>(null);
  const [authLoading,     setAuthLoading]     = useState(true);
  const [accounts,        setAccounts]        = useState<Account[]>(INITIAL_ACCOUNTS);
  const [categories,      setCategories]      = useState<Category[]>(INITIAL_CATEGORIES);
  const [transactions,    setTransactions]    = useState<Transaction[]>([]);
  const [activeTab,       setActiveTab]       = useState<'dashboard'|'transactions'|'settings'>('dashboard');
  const [isTxModalOpen,   setIsTxModalOpen]   = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFreshStartOpen,  setIsFreshStartOpen]  = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [customExportData,   setCustomExportData]   = useState<Transaction[] | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean; onUndo: () => void } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  /* ── Auth listener ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const isRegistering = sessionStorage.getItem('vibhav_registering') === 'true';
      if (u && isRegistering) return;
      setUser(u as User | null);
      setAuthLoading(false);
      const splash = document.getElementById('splash-screen');
      if (splash) { splash.style.opacity = '0'; setTimeout(() => splash.remove(), 800); }
    });
    return () => unsub();
  }, []);

  /* ── Firestore subscriptions ── */
  useEffect(() => {
    if (!user) return;
    const unsubData = subscribeToData(user.uid, (data) => {
      if (data.accounts && data.accounts.length > 0) {
        setAccounts(data.accounts);
      } else {
        saveUserData(user.uid, INITIAL_ACCOUNTS, INITIAL_CATEGORIES)
          .catch(e => console.error('Failed to initialise user data:', e));
      }
      if (data.categories && data.categories.length > 0) setCategories(data.categories);
    });
    const unsubTxs = subscribeToTransactions(user.uid, (txs) => setTransactions(txs));
    return () => { unsubData(); unsubTxs(); };
  }, [user]);

  /* ── Toast helper ── */
  const triggerToast = (message: string, onUndo: () => void = () => {}) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, visible: true, onUndo });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
    }, 5000);
  };

  /* ── Ledger reconciliation ── */
  const reconcileLedger = (currentTransactions: Transaction[], baseAccounts: Account[], cats: Category[]): Account[] => {
    const sortedTxs  = [...currentTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const tallyCatIds = cats.filter(c => c.name.toLowerCase().includes('tally')).map(c => c.id);
    const reconciled = baseAccounts.map(acc => {
      const starting = acc.initialBalance !== undefined && !isNaN(acc.initialBalance) ? Number(acc.initialBalance) : (Number(acc.balance) || 0);
      return { ...acc, balance: starting, initialBalance: starting };
    });
    sortedTxs.forEach(tx => {
      reconciled.forEach(acc => {
        let change = 0;
        if (acc.id === tx.fromAccountId) {
          if (tx.type === 'income')        change =  tx.amount;
          else if (tx.type === 'cc_action') change = -tx.amount;
          else { change = tallyCatIds.includes(tx.categoryId) && acc.type === 'credit' ? tx.amount : -tx.amount; }
        } else if ((tx.type === 'transfer' || (tx.type === 'cc_action' && tx.ccOperation === 'tally')) && acc.id === tx.toAccountId) {
          change = tx.amount;
        }
        acc.balance += change;
      });
    });
    return reconciled;
  };

  /* ── CRUD handlers ── */
  const handleSaveTransaction = async (data: Omit<Transaction, 'id'>, existingId?: string, silent = false) => {
    if (!user) return;
    try {
      let updatedTxs = [...transactions];
      if (existingId) {
        const idx = updatedTxs.findIndex(t => t.id === existingId);
        if (idx !== -1) updatedTxs[idx] = { ...data, id: existingId } as Transaction;
        await updateFirebaseTransaction(user.uid, existingId, data);
      } else {
        const newId = await addFirebaseTransaction(user.uid, data);
        updatedTxs.push({ ...data, id: newId } as Transaction);
      }
      const finalAccs = reconcileLedger(updatedTxs, accounts, categories);
      if (!finalAccs.some(a => isNaN(a.balance))) await saveUserData(user.uid, finalAccs, categories);
      setAccounts(finalAccs);
      if (!silent) triggerToast(existingId ? 'Changes Saved' : 'Transaction Logged');
    } catch { if (!silent) triggerToast('Persistence Error'); }
    setEditingTransaction(null);
    setIsTxModalOpen(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      const updatedTxs = transactions.filter(t => t.id !== id);
      const finalAccs  = reconcileLedger(updatedTxs, accounts, categories);
      await deleteFirebaseTransaction(user.uid, id);
      await saveUserData(user.uid, finalAccs, categories);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToast({ message: 'Transaction Deleted', visible: true, onUndo: () => {
        const tx = transactions.find(t => t.id === id);
        if (tx) { const { id: _, ...raw } = tx; handleSaveTransaction(raw as any, undefined, true); }
      }});
    } catch { triggerToast('Deletion Failed'); }
  };

  const handleUpdateAccounts = async (newAccounts: Account[], silent = false) => {
    if (!user) return;
    const prev = [...accounts];
    try {
      const reconciled = reconcileLedger(transactions, newAccounts, categories);
      await saveUserData(user.uid, reconciled, categories);
      setAccounts(reconciled);
      if (!silent) triggerToast('Accounts Updated', () => { setToast(p => p ? { ...p, visible: false } : null); handleUpdateAccounts(prev, true); });
    } catch { if (!silent) triggerToast('Update Failed'); }
  };

  const handleUpdateCategories = async (newCategories: Category[], silent = false) => {
    if (!user) return;
    const prev = [...categories];
    try {
      await saveUserData(user.uid, accounts, newCategories);
      setCategories(newCategories);
      if (!silent) triggerToast('Categories Updated', () => { setToast(p => p ? { ...p, visible: false } : null); handleUpdateCategories(prev, true); });
    } catch { if (!silent) triggerToast('Update Failed'); }
  };

  const handleRebalanceHistory = async () => {
    if (!user) return;
    try {
      const finalAccs = reconcileLedger(transactions, accounts, categories);
      await saveUserData(user.uid, finalAccs, categories);
      setAccounts(finalAccs);
      triggerToast('Ledger Synced');
    } catch { triggerToast('Sync Failed'); }
  };

  const handleFreshStart = async (keepAccounts: boolean) => {
    if (!user) return;
    await clearAllData(user.uid, accounts, categories, keepAccounts);
    setTransactions([]);
  };

  /* ── Guards ── */
  if (authLoading) return null;
  if (!user) return <AuthView />;

  const tabLabel: Record<string, string> = { dashboard: 'Overview', transactions: 'Transactions', settings: 'Settings' };
  const tabDesc:  Record<string, string> = {
    dashboard:    'Your financial snapshot',
    transactions: 'All recorded entries',
    settings:     'Accounts & categories',
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row text-white overflow-hidden" style={{ background: 'var(--base)', fontFamily: "'Inter', sans-serif" }}>
      <Background3D />

      {/* ═══════════════════════════════════════
          SIDEBAR — desktop only
      ═══════════════════════════════════════ */}
      <aside className="hidden lg:flex w-[240px] h-screen sticky top-0 flex-col z-20 p-3">
        <div className="flex-1 flex flex-col rounded-[20px] p-4 overflow-y-auto"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2 pt-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--primary-deep)', boxShadow: '0 4px 12px var(--primary-glow)' }}>
              <i className="fa-solid fa-vault text-white text-sm" />
            </div>
            <div>
              <p className="font-display font-bold text-[15px] tracking-tight leading-none text-white">VibhavWealth</p>
              <p className="text-[10px] mt-0.5 flex items-center justify-between" style={{ color: 'var(--text-3)' }}>
                <span>Personal Finance</span>
                <span className="opacity-40 font-mono text-[8px]">v1.0.2</span>
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-0.5 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] px-3 mb-2" style={{ color: 'var(--text-3)' }}>Navigation</p>
            {NAV_ITEMS.map(item => {
              const active = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id as any)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 relative"
                  style={{
                    background: active ? 'rgba(108,158,248,0.1)' : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--text-2)',
                  }}>
                  {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: 'var(--primary)' }} />}
                  <i className={`fa-solid ${item.icon} w-4 text-center text-sm`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User section */}
          <div className="pt-3 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl mb-1"
              style={{ background: 'var(--surface-2)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: 'var(--primary-deep)', color: '#fff' }}>
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>{user.email?.split('@')[0]}</p>
                <p className="text-[9px]" style={{ color: 'var(--text-3)' }}>Signed in</p>
              </div>
            </div>
            <button onClick={logoutUser}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium transition-all"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
              <i className="fa-solid fa-arrow-right-from-bracket text-[11px]" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════
          MOBILE BOTTOM NAV
      ═══════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)', padding: '0 12px max(env(safe-area-inset-bottom), 8px)' }}>
        <div className="flex items-center justify-around py-2 rounded-[20px]"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          }}>
          {[
            { id: 'dashboard',    icon: 'fa-chart-simple', label: 'Home'    },
            { id: 'transactions', icon: 'fa-receipt',       label: 'History' },
            { id: 'add',          icon: 'fa-plus',          label: 'Add',  isAction: true },
            { id: 'settings',     icon: 'fa-sliders',       label: 'Config'  },
          ].map(item => item.isAction ? (
            <button key="add" onClick={() => setIsTxModalOpen(true)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white -mt-5 active:scale-90 transition-transform"
              style={{ background: 'var(--primary-deep)', boxShadow: '0 4px 16px var(--primary-glow)' }}>
              <i className="fa-solid fa-plus text-lg" />
            </button>
          ) : (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)}
              className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all"
              style={{ color: activeTab === item.id ? 'var(--primary)' : 'var(--text-3)' }}>
              <i className={`fa-solid ${item.icon} text-[16px]`} />
              <span className="text-[9px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ═══════════════════════════════════════
          MAIN VIEWPORT
      ═══════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 min-h-screen" style={{ overscrollBehavior: 'contain' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-10"
          key={activeTab} style={{ animation: 'pageIn 0.35s ease both' }}>

          {/* Page Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-3)' }}>
                {tabDesc[activeTab]}
              </p>
              <h1 className="font-display font-bold tracking-tight text-white"
                style={{ fontSize: 'clamp(22px, 5vw, 30px)', letterSpacing: '-0.02em', margin: 0 }}>
                {tabLabel[activeTab]}
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Mobile: user pill + logout */}
              <div className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'var(--primary-deep)', color: '#fff' }}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <button onClick={logoutUser} className="transition-colors"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                  <i className="fa-solid fa-arrow-right-from-bracket text-xs" />
                </button>
              </div>

              {/* Add entry button — hidden on xs (FAB handles it) */}
              <button onClick={() => setIsTxModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold text-white btn-primary-glow transition-all active:scale-95 shine-hover">
                <i className="fa-solid fa-plus text-[11px]" />
                New Entry
              </button>
            </div>
          </header>

          {/* Content */}
          <div className="space-y-6 sm:space-y-8">
            {activeTab === 'dashboard' && (
              <>
                <AccountSummary accounts={accounts} />
                <Dashboard transactions={transactions} categories={categories} accounts={accounts} />
              </>
            )}
            {activeTab === 'transactions' && (
              <TransactionList
                transactions={transactions} categories={categories} accounts={accounts}
                onDelete={handleDeleteTransaction}
                onEdit={(tx) => setEditingTransaction(tx)}
                onOpenExport={(filtered) => { setCustomExportData(filtered); setIsExportModalOpen(true); }}
              />
            )}
            {activeTab === 'settings' && (
              <div className="max-w-3xl space-y-6">
                <AccountSettings
                  accounts={accounts}
                  onAdd={(a) => handleUpdateAccounts([...accounts, { ...a, id: `acc-${Date.now()}` }])}
                  onUpdate={(id, u) => handleUpdateAccounts(accounts.map(a => a.id === id ? { ...a, ...u } : a))}
                  onDelete={(id) => handleUpdateAccounts(accounts.filter(a => a.id !== id))}
                  onRebalance={handleRebalanceHistory}
                  onFreshStart={() => setIsFreshStartOpen(true)}
                />
                <CategorySettings
                  categories={categories}
                  onAdd={(n, t) => handleUpdateCategories([...categories, { id: `cat-${Date.now()}`, name: n, type: t }])}
                  onUpdate={(id, n) => handleUpdateCategories(categories.map(c => c.id === id ? { ...c, name: n } : c))}
                  onDelete={(id) => handleUpdateCategories(categories.filter(c => c.id !== id))}
                />
              </div>
            )}
          </div>
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 3px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        `}</style>
      </main>

      {/* ── Modals ── */}
      {(isTxModalOpen || editingTransaction) && (
        <AddTransactionModal
          accounts={accounts} categories={categories} initialData={editingTransaction || undefined}
          onSave={handleSaveTransaction}
          onClose={() => { setIsTxModalOpen(false); setEditingTransaction(null); }}
        />
      )}
      {isExportModalOpen && (
        <ExportModal
          transactions={customExportData || transactions} accounts={accounts} categories={categories}
          onClose={() => { setIsExportModalOpen(false); setCustomExportData(null); }}
        />
      )}
      {isFreshStartOpen && (
        <FreshStartModal
          onConfirm={handleFreshStart}
          onClose={() => setIsFreshStartOpen(false)}
        />
      )}
      {toast && <Toast message={toast.message} visible={toast.visible} onUndo={toast.onUndo} />}
    </div>
  );
};

export default App;
