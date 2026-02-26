
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
  const [toast, setToast] = useState<{ message: string, visible: boolean } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
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
      triggerToast("Changes Saved");
    } catch (err) {
      triggerToast("Save Error");
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
      triggerToast("Entry Deleted");
    } catch (err) {
      triggerToast("Delete Failed");
    }
  };

  const handleUpdateAccounts = async (newAccounts: Account[]) => {
    if (!user) return;
    try {
      await saveUserData(user.uid, newAccounts, categories);
      triggerToast("Accounts Updated");
    } catch (err) {
      triggerToast("Update Failed");
    }
  };

  const handleUpdateCategories = async (newCategories: Category[]) => {
    if (!user) return;
    try {
      await saveUserData(user.uid, accounts, newCategories);
      triggerToast("Categories Updated");
    } catch (err) {
      triggerToast("Update Failed");
    }
  };

  if (authLoading) return null;
  if (!user) return <AuthView />;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row text-white overflow-hidden bg-[#0a0f1a]" style={{ WebkitFontSmoothing: 'antialiased' }}>
      <Background3D />

      {/* INSTITUTIONAL SIDEBAR (DESKTOP) */}
      <aside className="hidden lg:flex w-[280px] h-screen sticky top-0 flex-col z-20 p-5">
        <div className="flex-1 flex flex-col rounded-[32px] p-6 glass relative overflow-y-auto custom-scrollbar" style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
          {/* Top Logo Section */}
          <div className="flex items-center gap-4 mb-10 px-1">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center relative group shine-hover overflow-hidden" style={{
              background: 'linear-gradient(135deg, #4285F4, #34A853)',
              boxShadow: '0 8px 24px rgba(66,133,244,0.3)',
            }}>
              <i className="fa-solid fa-vault text-white text-lg transition-transform duration-500 group-hover:scale-110"></i>
            </div>
            <div>
              <h1 className="text-lg font-display font-black tracking-tighter text-white leading-none">VibhavWealth</h1>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1.5 opacity-60">Personal Finance</p>
            </div>
          </div>

          {/* Navigation Matrix */}
          <nav className="space-y-2 flex-1">
            <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] px-3 mb-4">Menu</p>
            {[
              { id: 'dashboard', icon: 'fa-chart-pie-simple', label: 'Overview' },
              { id: 'transactions', icon: 'fa-microchip', label: 'Transactions' },
              { id: 'settings', icon: 'fa-sliders-up', label: 'Settings' }
            ].map(item => (
              <button
                key={item.id} onClick={() => setActiveTab(item.id as any)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-300 relative group shine-hover"
                style={{
                  background: activeTab === item.id ? 'rgba(66,133,244,0.1)' : 'transparent',
                  color: activeTab === item.id ? '#8ab4f8' : '#6b7280',
                  boxShadow: activeTab === item.id ? 'inset 0 0 10px rgba(66,133,244,0.05)' : 'none'
                }}
              >
                {activeTab === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#4285F4] shadow-[0_0_10px_#4285F4]" />}
                <i className={`fa-solid ${item.icon} w-5 text-center text-sm transition-transform duration-300 group-hover:scale-110`}></i>
                <span className="tracking-wide uppercase text-[11px]">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Stakeholder Identity */}
          <div className="pt-6 mt-auto border-t border-white/5">
            <div className="flex items-center gap-3 px-3 py-3 rounded-2xl mb-4 glass group cursor-pointer" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4285F4, #8ab4f8)', color: 'white' }}>
                <span className="relative z-10">{user.email?.charAt(0).toUpperCase()}</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-[11px] font-bold text-gray-300 truncate tracking-tight">{user.email?.split('@')[0]}</p>
                <p className="text-[9px] text-gray-600 font-bold truncate tracking-widest uppercase mt-0.5">User</p>
              </div>
            </div>
            <button onClick={logoutUser} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all group">
              <i className="fa-solid fa-power-off text-[11px] transition-transform group-hover:rotate-90"></i>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-5 pb-[env(safe-area-inset-bottom)]" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
        <div className="flex items-center justify-around py-2.5 rounded-[28px] mx-auto max-w-md glass" style={{
           boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
           border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {[
            { id: 'dashboard', icon: 'fa-chart-column', label: 'Home' },
            { id: 'transactions', icon: 'fa-list-ul', label: 'History' },
            { id: 'add', icon: 'fa-plus', label: 'Add', isAction: true },
            { id: 'settings', icon: 'fa-gears', label: 'Settings' },
          ].map(item => item.isAction ? (
            <button key="add" onClick={() => setIsTxModalOpen(true)}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white -mt-8 active:scale-90 transition-all btn-primary-glow shine-hover shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #4285F4, #3b78e7)' }}
            >
              <i className="fa-solid fa-plus text-xl"></i>
            </button>
          ) : (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all"
              style={{ color: activeTab === item.id ? '#8ab4f8' : '#4b5563' }}
            >
              <i className={`fa-solid ${item.icon} text-lg`}></i>
              <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 min-h-screen overscroll-behavior-y-contain">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12 pb-36 lg:pb-12" key={activeTab} style={{ animation: 'pageIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {/* Tactical Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 sm:mb-12 gap-6 pb-6 border-b border-white/5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></span>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]">Safe & Secure</p>
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tighter text-white capitalize">{activeTab}</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="lg:hidden flex items-center gap-3 px-4 py-2.5 rounded-2xl glass" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black" style={{ background: 'linear-gradient(135deg, #4285F4, #8ab4f8)', color: 'white' }}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <button onClick={logoutUser} className="text-gray-500 hover:text-red-400 transition-all p-1">
                  <i className="fa-solid fa-power-off text-xs"></i>
                </button>
              </div>
              <button onClick={() => setIsTxModalOpen(true)}
                className="hidden sm:flex px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white items-center gap-3 active:scale-95 transition-all btn-primary-glow shine-hover shadow-xl"
              >
                <i className="fa-solid fa-plus text-[10px]"></i> New Entry
              </button>
            </div>
          </header>

          {/* Operation Content */}
          <div className="space-y-8 sm:space-y-12">
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
              <div className="max-w-4xl space-y-10 sm:space-y-12">
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

        <style>{`
          @keyframes pageIn { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        `}</style>
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
