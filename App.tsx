
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Account, Category } from './types';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES } from './constants';
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
  const [toast, setToast] = useState<{ message: string, visible: boolean } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u as User | null);
      setAuthLoading(false);
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 500);
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

  const triggerToast = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, visible: true });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
    }, 5000);
  };

  const calculateNewBalances = (currentAccs: Account[], tx: Transaction, factor: number): Account[] => {
    return currentAccs.map(a => {
      if (a.id === tx.fromAccountId) {
        const change = tx.type === 'income' ? tx.amount : -tx.amount;
        return { ...a, balance: a.balance + (change * factor) };
      }
      if (tx.type === 'transfer' && a.id === tx.toAccountId) {
        return { ...a, balance: a.balance + (tx.amount * factor) };
      }
      return a;
    });
  };

  const handleSaveTransaction = async (data: Omit<Transaction, 'id'>, existingId?: string) => {
    if (!user) return;
    try {
      if (existingId) {
        const oldTx = transactions.find(t => t.id === existingId);
        if (oldTx) {
          let midAccs = calculateNewBalances([...accounts], oldTx, -1);
          const newTxStub = { ...data, id: existingId } as Transaction;
          const finalAccs = calculateNewBalances(midAccs, newTxStub, 1);
          await updateFirebaseTransaction(user.uid, existingId, data);
          await saveUserData(user.uid, finalAccs, categories);
        }
      } else {
        const tempTx = { ...data } as Transaction;
        const finalAccs = calculateNewBalances([...accounts], tempTx, 1);
        await addFirebaseTransaction(user.uid, data);
        await saveUserData(user.uid, finalAccs, categories);
      }
      triggerToast("Ledger updated");
    } catch (err) {
      console.error("Save Error:", err);
      triggerToast("Cloud sync failed");
    }
    setEditingTransaction(null);
    setIsTxModalOpen(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      const tx = transactions.find(t => t.id === id);
      if (!tx) return;
      const finalAccs = calculateNewBalances([...accounts], tx, -1);
      await deleteFirebaseTransaction(user.uid, id);
      await saveUserData(user.uid, finalAccs, categories);
      triggerToast("Entry purged");
    } catch (err) {
      console.error("Delete Error:", err);
      triggerToast("Deletion failed");
    }
  };

  const handleUpdateAccounts = async (newAccounts: Account[]) => {
    if (!user) return;
    try {
      await saveUserData(user.uid, newAccounts, categories);
      triggerToast("Accounts updated");
    } catch (err) {
      triggerToast("Update failed");
    }
  };

  const handleUpdateCategories = async (newCategories: Category[]) => {
    if (!user) return;
    try {
      await saveUserData(user.uid, accounts, newCategories);
      triggerToast("Categories updated");
    } catch (err) {
      triggerToast("Update failed");
    }
  };

  if (authLoading) return null;
  if (!user) return <AuthView />;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0a0b] text-[#e4e4e7] overflow-hidden">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 border-r border-white/5 bg-[#0e0e10] p-6 h-screen sticky top-0 flex-col z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-[#d4af37] rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-crown text-[#0a0a0b] text-xs"></i>
          </div>
          <h1 className="text-base font-display font-extrabold tracking-tight text-white">Zenith<span className="text-[#d4af37]">.</span></h1>
        </div>

        <nav className="space-y-1.5 flex-1">
          {[
            { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
            { id: 'transactions', icon: 'fa-list-ul', label: 'History' },
            { id: 'settings', icon: 'fa-gear', label: 'Settings' }
          ].map(item => (
            <button
              key={item.id} onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === item.id ? 'bg-[#d4af37]/10 text-[#d4af37]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
            >
              <i className={`fa-solid ${item.icon} w-5`}></i>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="px-4 py-3 flex items-center gap-3 bg-white/[0.02] rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] text-[10px]">
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <div className="overflow-hidden">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Sovereign User</p>
              <p className="text-[10px] font-bold text-zinc-300 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={logoutUser} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black text-zinc-600 hover:text-rose-500 transition-all uppercase tracking-widest group">
            <i className="fa-solid fa-right-from-bracket w-5 group-hover:-translate-x-1 transition-transform"></i>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0e0e10]/95 backdrop-blur-xl border-t border-white/5 flex items-start justify-around z-50 px-4 pt-2 pb-[env(safe-area-inset-bottom)]">
        {['dashboard', 'transactions', 'settings'].map(id => (
          <button key={id} onClick={() => setActiveTab(id as any)} className={`p-4 transition-all rounded-full ${activeTab === id ? 'text-[#d4af37] bg-white/5' : 'text-zinc-600'}`}>
            <i className={`fa-solid ${id === 'dashboard' ? 'fa-chart-line' : id === 'transactions' ? 'fa-list-ul' : 'fa-gear'} text-xl`}></i>
          </button>
        ))}
        <button onClick={() => setIsTxModalOpen(true)} className="w-14 h-14 bg-[#d4af37] rounded-full text-[#0a0a0b] shadow-xl transform -translate-y-6 border-4 border-[#0a0a0b] active:scale-90 transition-all flex items-center justify-center">
          <i className="fa-solid fa-plus text-xl"></i>
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 lg:p-14 overflow-y-auto overflow-x-hidden relative">
        <div className="container-fluid page-enter max-w-7xl mx-auto pb-24 lg:pb-0" key={activeTab}>

          {/* RESPONSIVE HEADER WITH USER IDENTITY */}
          <header className="flex items-center justify-between mb-8 md:mb-12 gap-4">
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight text-white mb-0.5 capitalize">{activeTab}</h2>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em]">Live Connection</p>
              </div>
            </div>

            <div className="flex items-center gap-3 min-w-0">
              {/* TABLET/MOBILE USER CHIP */}
              <div className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="w-6 h-6 rounded-lg bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] text-[8px] shrink-0">
                  <i className="fa-solid fa-user-check"></i>
                </div>
                <div className="hidden sm:block overflow-hidden">
                  <p className="text-[10px] font-bold text-zinc-300 truncate max-w-[120px]">{user.email?.split('@')[0]}</p>
                </div>
                <button
                  onClick={logoutUser}
                  className="ml-1 text-zinc-500 hover:text-rose-500 transition-colors p-1"
                  title="Sign Out"
                >
                  <i className="fa-solid fa-right-from-bracket text-xs"></i>
                </button>
              </div>

              <button onClick={() => setIsTxModalOpen(true)} className="hidden md:flex px-6 py-3 bg-[#d4af37] text-[#0a0a0b] rounded-xl font-black text-[9px] tracking-[0.2em] uppercase shadow-xl hover:scale-105 active:scale-95 transition-all items-center gap-2">
                <i className="fa-solid fa-plus"></i> ADD ENTRY
              </button>
            </div>
          </header>

          <div className="space-y-12">
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
                onOpenExport={() => setIsExportModalOpen(true)}
              />
            )}
            {activeTab === 'settings' && (
              <div className="max-w-4xl space-y-10">
                <AccountSettings
                  accounts={accounts}
                  onAdd={(a) => handleUpdateAccounts([...accounts, { ...a, id: `acc-${Date.now()}` }])}
                  onUpdate={(id, u) => handleUpdateAccounts(accounts.map(a => a.id === id ? { ...a, ...u } : a))}
                  onDelete={(id) => handleUpdateAccounts(accounts.filter(a => a.id !== id))}
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
      </main>

      {(isTxModalOpen || editingTransaction) && (
        <AddTransactionModal
          accounts={accounts} categories={categories} initialData={editingTransaction || undefined}
          onSave={handleSaveTransaction} onClose={() => { setIsTxModalOpen(false); setEditingTransaction(null); }}
        />
      )}
      {isExportModalOpen && <ExportModal transactions={transactions} accounts={accounts} categories={categories} onClose={() => setIsExportModalOpen(false)} />}
      {toast && <Toast message={toast.message} visible={toast.visible} onUndo={() => { }} />}
    </div>
  );
};

export default App;
