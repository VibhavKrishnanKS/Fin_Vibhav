
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'settings'>('dashboard');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [customExportData, setCustomExportData] = useState<Transaction[] | null>(null);
  const [toast, setToast] = useState<{ message: string, visible: boolean, onUndo: () => void } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      // THE FIX: Check if we are currently in a Registration flow
      const isRegistering = sessionStorage.getItem('vibhav_registering') === 'true';
      
      if (u && isRegistering) {
        // Ignore this state change and wait for the manual logout inside firebase.ts
        return;
      }
      
      setUser(u as User | null);
      setAuthLoading(false);
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 800);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubData = subscribeToData(user.uid, (data) => {
      if (data.accounts && data.accounts.length > 0) {
        setAccounts(data.accounts);
      } else {
        saveUserData(user.uid, INITIAL_ACCOUNTS, INITIAL_CATEGORIES)
          .catch(e => console.error("Failed to initialize user data:", e));
      }
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      }
    });
    const unsubTxs = subscribeToTransactions(user.uid, (txs) => {
      setTransactions(txs);
    });
    return () => {
      unsubData();
      unsubTxs();
    };
  }, [user]);

  const triggerToast = (message: string, onUndo: () => void = () => {}) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, visible: true, onUndo });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
    }, 5000);
  };

  const reconcileLedger = (currentTransactions: Transaction[], baseAccounts: Account[], cats: Category[]): Account[] => {
    // 1. Sort transactions by date (Oldest first)
    const sortedTxs = [...currentTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // 2. Map of "Tally" categories
    const tallyCatIds = cats.filter(c => c.name.toLowerCase().includes('tally')).map(c => c.id);

    // 3. Reset accounts to their Initial Balance
    // Fix: If initialBalance is missing (legacy) or NaN, fall back to balance or 0
    const reconciled = baseAccounts.map(acc => {
      const starting = acc.initialBalance !== undefined && !isNaN(acc.initialBalance) 
        ? Number(acc.initialBalance) 
        : (Number(acc.balance) || 0);
      return { ...acc, balance: starting, initialBalance: starting };
    });

    // 4. Re-calculate everything chronologicaly
    sortedTxs.forEach(tx => {
      reconciled.forEach(acc => {
         let change = 0;
         if (acc.id === tx.fromAccountId) {
            if (tx.type === 'income') {
              change = tx.amount;
            } else if (tx.type === 'cc_action') {
              // Tally Settlement (Bank Pays) or Debit (Card Spends)
              change = -tx.amount;
            } else {
              // Normal Expense: Check for Tally in name as a backup
              if (tallyCatIds.includes(tx.categoryId) && acc.type === 'credit') {
                change = tx.amount;
              } else {
                change = -tx.amount;
              }
            }
         } else if ((tx.type === 'transfer' || (tx.type === 'cc_action' && tx.ccOperation === 'tally')) && acc.id === tx.toAccountId) {
            change = tx.amount;
         }
         acc.balance += change;
      });
    });

    return reconciled;
  };

  const handleSaveTransaction = async (data: Omit<Transaction, 'id'>, existingId?: string, silent: boolean = false) => {
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
      
      // SAFETY CHECK: Never write NaN to the database
      const hasNaN = finalAccs.some(a => isNaN(a.balance));
      if (!hasNaN) {
        await saveUserData(user.uid, finalAccs, categories);
      }
      
      setAccounts(finalAccs); // Always update local UI
      
      if (!silent) triggerToast(existingId ? "Changes Saved" : "Transaction Logged");
    } catch (err) {
      if (!silent) triggerToast("Persistence Error");
    }
    setEditingTransaction(null);
    setIsTxModalOpen(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      const updatedTxs = transactions.filter(t => t.id !== id);
      const finalAccs = reconcileLedger(updatedTxs, accounts, categories);
      
      await deleteFirebaseTransaction(user.uid, id);
      await saveUserData(user.uid, finalAccs, categories);
      
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      setToast({ message: "Transaction Deleted", visible: true, onUndo: () => {
         const tx = transactions.find(t => t.id === id);
         if (tx) {
           const { id: _, ...raw } = tx;
           handleSaveTransaction(raw as any, undefined, true);
         }
      }});
    } catch (err) {
      triggerToast("Deletion Failed");
    }
  };

  const handleUpdateAccounts = async (newAccounts: Account[], silent: boolean = false) => {
    if (!user) return;
    const previousAccounts = [...accounts];
    try {
      // Logic Fix: Re-reconcile EVERY account balance whenever account definitions (initialBalance) change
      // This ensures that modifying the "Initial Value" immediately reflects in the "Current Balance"
      const reconciledAccs = reconcileLedger(transactions, newAccounts, categories);
      
      await saveUserData(user.uid, reconciledAccs, categories);
      setAccounts(reconciledAccs); // Update local UI immediately
      
      if (!silent) {
        triggerToast("Accounts Updated", () => {
           setToast(p => p ? { ...p, visible: false } : null);
           handleUpdateAccounts(previousAccounts, true);
        });
      }
    } catch (err) {
      if (!silent) triggerToast("Update Failed");
    }
  };

  const handleUpdateCategories = async (newCategories: Category[], silent: boolean = false) => {
    if (!user) return;
    const previousCategories = [...categories];
    try {
      await saveUserData(user.uid, accounts, newCategories);
      if (!silent) {
        triggerToast("Categories Updated", () => {
           setToast(p => p ? { ...p, visible: false } : null);
           handleUpdateCategories(previousCategories, true);
        });
      }
    } catch (err) {
      if (!silent) triggerToast("Update Failed");
    }
  };

  const handleRebalanceHistory = async () => {
    if (!user) return;
    try {
      // THE TRUE SYNC: Re-run every transaction from history and PERSIST it
      const finalAccs = reconcileLedger(transactions, accounts, categories);
      
      // Save the cleared calculation to the cloud
      await saveUserData(user.uid, finalAccs, categories);
      
      setAccounts(finalAccs);
      triggerToast("Ledger Synced to Cloud");
    } catch (err) {
      triggerToast("Sync Failed");
    }
  };

  if (authLoading) return null;
  if (!user) return <AuthView />;

  const tabLabels: Record<string, string> = {
    dashboard: 'Overview',
    transactions: 'Transactions',
    settings: 'Settings',
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row text-white overflow-hidden" style={{ background: 'var(--base)', WebkitFontSmoothing: 'antialiased' }}>
      <Background3D />

      {/* SIDEBAR (DESKTOP) */}
      <aside className="hidden lg:flex w-[260px] h-screen sticky top-0 flex-col z-20 p-4">
        <div className="flex-1 flex flex-col rounded-card p-5 relative overflow-y-auto custom-scrollbar" style={{
          background: 'var(--surface-1)',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#4285F4' }}>
              <i className="fa-solid fa-vault text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-base font-display font-bold tracking-tight text-white leading-none">VibhavWealth</h1>
              <p className="text-[9px] text-text-muted font-semibold uppercase tracking-wider mt-1">Personal Finance</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-3 mb-3">Menu</p>
            {[
              { id: 'dashboard', icon: 'fa-chart-pie', label: 'Overview' },
              { id: 'transactions', icon: 'fa-receipt', label: 'Transactions' },
              { id: 'settings', icon: 'fa-gear', label: 'Settings' }
            ].map(item => (
              <button
                key={item.id} onClick={() => setActiveTab(item.id as any)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-pill text-[12px] font-semibold transition-all duration-200 relative"
                style={{
                  background: activeTab === item.id ? 'rgba(138,180,248,0.08)' : 'transparent',
                  color: activeTab === item.id ? '#8ab4f8' : '#9aa0a6',
                }}
              >
                {activeTab === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />}
                <i className={`fa-solid ${item.icon} w-5 text-center text-sm`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* User Section */}
          <div className="pt-4 mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-pill mb-2" style={{ background: 'var(--surface-2)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: '#4285F4', color: 'white' }}>
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-[11px] font-semibold text-text-secondary truncate">{user.email?.split('@')[0]}</p>
                <p className="text-[9px] text-text-muted font-medium">User</p>
              </div>
            </div>
            <button onClick={logoutUser} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-pill text-[10px] font-semibold text-text-muted hover:text-[#f28b82] hover:bg-[#f28b82]/5 transition-all">
              <i className="fa-solid fa-arrow-right-from-bracket text-[11px]"></i>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom)]" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        <div className="flex items-center justify-around py-2 rounded-card mx-auto max-w-md" style={{
           background: 'var(--surface-1)',
           border: '1px solid rgba(255,255,255,0.06)',
           boxShadow: '0 -4px 30px rgba(0,0,0,0.4)',
        }}>
          {[
            { id: 'dashboard', icon: 'fa-chart-simple', label: 'Home' },
            { id: 'transactions', icon: 'fa-receipt', label: 'History' },
            { id: 'add', icon: 'fa-plus', label: 'Add', isAction: true },
            { id: 'settings', icon: 'fa-gear', label: 'Settings' },
          ].map(item => item.isAction ? (
            <button key="add" onClick={() => setIsTxModalOpen(true)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white -mt-6 active:scale-90 transition-all"
              style={{ background: '#4285F4', boxShadow: '0 4px 12px rgba(66,133,244,0.3)' }}
            >
              <i className="fa-solid fa-plus text-lg"></i>
            </button>
          ) : (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all"
              style={{ color: activeTab === item.id ? '#8ab4f8' : '#5f6368' }}
            >
              <i className={`fa-solid ${item.icon} text-base`}></i>
              <span className="text-[8px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 min-h-screen overscroll-behavior-y-contain">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-10 pb-32 lg:pb-10" key={activeTab} style={{ animation: 'pageIn 0.4s ease both' }}>
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 gap-4 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Secure Session</p>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">{tabLabels[activeTab]}</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="lg:hidden flex items-center gap-2.5 px-3 py-2 rounded-pill" style={{ background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: '#4285F4', color: 'white' }}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <button onClick={logoutUser} className="text-text-muted hover:text-[#f28b82] transition-all p-1">
                  <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                </button>
              </div>
              <button onClick={() => setIsTxModalOpen(true)}
                className="hidden sm:flex px-5 py-3 rounded-pill text-[11px] font-semibold text-white items-center gap-2.5 active:scale-95 transition-all btn-primary-glow"
              >
                <i className="fa-solid fa-plus text-[10px]"></i> New Entry
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
                onOpenExport={(filteredList) => {
                  setCustomExportData(filteredList);
                  setIsExportModalOpen(true);
                }}
              />
            )}
            {activeTab === 'settings' && (
              <div className="max-w-4xl space-y-8 sm:space-y-10">
                <AccountSettings
                  accounts={accounts}
                  onAdd={(a) => handleUpdateAccounts([...accounts, { ...a, id: `acc-${Date.now()}` }])}
                  onUpdate={(id, u) => handleUpdateAccounts(accounts.map(a => a.id === id ? { ...a, ...u } : a))}
                  onDelete={(id) => handleUpdateAccounts(accounts.filter(a => a.id !== id))}
                  onRebalance={handleRebalanceHistory}
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
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.04); border-radius: 10px; }
        `}</style>
      </main>

      {(isTxModalOpen || editingTransaction) && (
        <AddTransactionModal
          accounts={accounts} categories={categories} initialData={editingTransaction || undefined}
          onSave={handleSaveTransaction} onClose={() => { setIsTxModalOpen(false); setEditingTransaction(null); }}
        />
      )}
      {isExportModalOpen && <ExportModal transactions={customExportData || transactions} accounts={accounts} categories={categories} onClose={() => { setIsExportModalOpen(false); setCustomExportData(null); }} />}
      {toast && <Toast message={toast.message} visible={toast.visible} onUndo={toast.onUndo} />}
    </div>
  );
};

export default App;
