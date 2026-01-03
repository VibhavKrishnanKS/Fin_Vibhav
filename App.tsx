
import React, { useState, useEffect, useRef } from 'react';
// Corrected imports: Removing .ts/.tsx extensions from local imports as per standard practice
import { Transaction, Account, Category } from './types';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES } from './constants';
// Fix: Import onAuthStateChanged and User type from our local service instead of directly from firebase/auth
import { 
  auth, 
  subscribeToData, 
  subscribeToTransactions, 
  saveUserData, 
  addFirebaseTransaction, 
  updateFirebaseTransaction, 
  deleteFirebaseTransaction, 
  logoutUser,
  onAuthStateChanged,
  type User
} from './services/firebase';

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
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Financial State
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'settings'>('dashboard');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // UI State
  const [toast, setToast] = useState<{ message: string, visible: boolean } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // 1. Auth Listener
  useEffect(() => {
    // onAuthStateChanged is successfully imported from our services/firebase wrapper
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      
      // Remove splash
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 500);
      }
    });
    return () => unsub();
  }, []);

  // 2. Data Synchronization (Real-time Firestore)
  useEffect(() => {
    if (!user) return;

    const unsubData = subscribeToData(user.uid, (data) => {
      // If the user document exists in Firebase, use that data
      if (data.accounts.length > 0) {
        setAccounts(data.accounts);
      } else {
        // If it's a brand new user (no document in Firebase), 
        // initialize their account with the default settings from constants.tsx
        saveUserData(user.uid, INITIAL_ACCOUNTS, INITIAL_CATEGORIES);
      }
      
      if (data.categories.length > 0) {
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

  const updateLocalBalances = (accs: Account[], tx: Transaction, factor: number): Account[] => {
    return accs.map(a => {
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

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    
    const newAccs = updateLocalBalances(accounts, tx, -1);
    await Promise.all([
      deleteFirebaseTransaction(user.uid, id),
      saveUserData(user.uid, newAccs, categories)
    ]);
    triggerToast("Entry deleted");
  };

  const handleSaveTransaction = async (data: Omit<Transaction, 'id'>, existingId?: string) => {
    if (!user) return;

    if (existingId) {
      const oldTx = transactions.find(t => t.id === existingId);
      if (oldTx) {
        let updatedAccs = updateLocalBalances([...accounts], oldTx, -1);
        const newTx = { ...data, id: existingId } as Transaction;
        const finalAccs = updateLocalBalances(updatedAccs, newTx, 1);
        
        await Promise.all([
          updateFirebaseTransaction(user.uid, existingId, data),
          saveUserData(user.uid, finalAccs, categories)
        ]);
      }
      triggerToast("Entry updated");
    } else {
      const tx = { ...data } as Transaction;
      const finalAccs = updateLocalBalances(accounts, tx, 1);
      
      await Promise.all([
        addFirebaseTransaction(user.uid, data),
        saveUserData(user.uid, finalAccs, categories)
      ]);
      triggerToast("Entry saved");
    }
    
    setEditingTransaction(null);
    setIsTxModalOpen(false);
  };

  const handleUpdateAccounts = async (newAccounts: Account[]) => {
    if (!user) return;
    await saveUserData(user.uid, newAccounts, categories);
  };

  const handleUpdateCategories = async (newCategories: Category[]) => {
    if (!user) return;
    await saveUserData(user.uid, accounts, newCategories);
  };

  if (authLoading) return null;
  if (!user) return <AuthView />;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0a0b] text-[#e4e4e7] overflow-hidden">
      <aside className="hidden lg:flex w-64 border-r border-white/5 bg-[#0e0e10] p-6 h-screen sticky top-0 flex-col z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-[#d4af37] rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-crown text-[#0a0a0b] text-xs"></i>
          </div>
          <h1 className="text-base font-display font-extrabold tracking-tight">Zenith<span className="text-[#d4af37]">.</span></h1>
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
        <div className="mt-auto pt-6 border-t border-white/5">
          <button onClick={logoutUser} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black text-zinc-600 hover:text-rose-500 transition-all uppercase tracking-widest">
            <i className="fa-solid fa-right-from-bracket w-5"></i>
            Sign Out
          </button>
        </div>
      </aside>

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

      <main className="flex-1 p-4 md:p-8 lg:p-14 overflow-y-auto overflow-x-hidden relative">
        <div className="container-fluid page-enter max-w-7xl mx-auto pb-24 lg:pb-0" key={activeTab}>
          <header className="flex items-center justify-between mb-8 md:mb-12">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight text-white mb-0.5 capitalize">{activeTab}</h2>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em]">Synced • {user.email}</p>
              </div>
            </div>
            <button onClick={() => setIsTxModalOpen(true)} className="hidden md:flex px-6 py-3 bg-[#d4af37] text-[#0a0a0b] rounded-xl font-black text-[9px] tracking-[0.2em] uppercase shadow-xl hover:scale-105 active:scale-95 transition-all items-center gap-2">
              <i className="fa-solid fa-plus"></i> ADD ENTRY
            </button>
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
                  onAdd={(a) => handleUpdateAccounts([...accounts, {...a, id: `acc-${Date.now()}`}])} 
                  onUpdate={(id, u) => handleUpdateAccounts(accounts.map(a => a.id === id ? {...a, ...u} : a))} 
                  onDelete={(id) => handleUpdateAccounts(accounts.filter(a => a.id !== id))} 
                />
                <CategorySettings 
                  categories={categories} 
                  onAdd={(n, t) => handleUpdateCategories([...categories, {id: `cat-${Date.now()}`, name: n, type: t}])} 
                  onUpdate={(id, n) => handleUpdateCategories(categories.map(c => c.id === id ? {...c, name: n} : c))} 
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
          onSave={handleSaveTransaction} onClose={() => {setIsTxModalOpen(false); setEditingTransaction(null);}} 
        />
      )}
      {isExportModalOpen && <ExportModal transactions={transactions} accounts={accounts} categories={categories} onClose={() => setIsExportModalOpen(false)} />}
      {toast && <Toast message={toast.message} visible={toast.visible} onUndo={() => {}} />}
    </div>
  );
};

export default App;
