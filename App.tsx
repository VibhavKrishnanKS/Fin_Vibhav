
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Account, Category, SyncSettings } from './types.ts';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES } from './constants.tsx';
import Dashboard from './components/Dashboard.tsx';
import TransactionList from './components/TransactionList.tsx';
import AddTransactionModal from './components/AddTransactionModal.tsx';
import AccountSummary from './components/AccountSummary.tsx';
import CategorySettings from './components/CategorySettings.tsx';
import AccountSettings from './components/AccountSettings.tsx';
import ExportModal from './components/ExportModal.tsx';
import Toast from './components/Toast.tsx';
import { get, set } from 'idb-keyval';

const App: React.FC = () => {
  // State initialization
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    apiUrl: 'http://localhost:5000/api', apiKey: '', lastSync: null, enabled: false
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'settings'>('dashboard');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Toast & Undo State
  const [toast, setToast] = useState<{ message: string, visible: boolean } | null>(null);
  const snapshotRef = useRef<{ transactions: Transaction[], accounts: Account[] } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Remove splash screen once the component is ready
  useEffect(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 500);
    }
  }, []);

  // Initialize Data (Non-blocking)
  useEffect(() => {
    async function loadData() {
      try {
        const [a, c, t, s] = await Promise.all([
          get('ws_accounts'),
          get('ws_categories'),
          get('ws_transactions'),
          get('ws_sync_settings')
        ]);

        if (a) setAccounts(a);
        if (c) setCategories(c);
        if (t) setTransactions(t);
        if (s) setSyncSettings(s);
      } catch (err) {
        console.warn("Storage initialization failed, using defaults.", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync to Storage on change
  useEffect(() => {
    if (!isLoading) {
      set('ws_accounts', accounts);
      set('ws_categories', categories);
      set('ws_transactions', transactions);
      set('ws_sync_settings', syncSettings);
    }
  }, [accounts, categories, transactions, syncSettings, isLoading]);

  const updateBalances = (accs: Account[], tx: Transaction, factor: number): Account[] => {
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

  const triggerToast = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, visible: true });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
    }, 5000);
  };

  const handleUndo = () => {
    if (snapshotRef.current) {
      setTransactions(snapshotRef.current.transactions);
      setAccounts(snapshotRef.current.accounts);
      snapshotRef.current = null;
      setToast(prev => prev ? { ...prev, visible: false } : null);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    snapshotRef.current = { transactions: [...transactions], accounts: [...accounts] };
    setAccounts(prev => updateBalances(prev, tx, -1));
    setTransactions(prev => prev.filter(t => t.id !== id));
    triggerToast("Entry removed from ledger");
  };

  const handleSaveTransaction = (data: Omit<Transaction, 'id'>, existingId?: string) => {
    snapshotRef.current = { transactions: [...transactions], accounts: [...accounts] };

    if (existingId) {
      const oldTx = transactions.find(t => t.id === existingId);
      if (oldTx) {
        let updatedAccs = updateBalances([...accounts], oldTx, -1);
        const newTx = { ...data, id: existingId } as Transaction;
        setAccounts(updateBalances(updatedAccs, newTx, 1));
        setTransactions(prev => prev.map(t => t.id === existingId ? newTx : t));
      }
      triggerToast("Ledger entry updated");
    } else {
      const tx = { ...data, id: `tx-${Date.now()}` } as Transaction;
      setAccounts(prev => updateBalances(prev, tx, 1));
      setTransactions(prev => [tx, ...prev]);
      triggerToast("New entry authorized");
    }

    setEditingTransaction(null);
    setIsTxModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0a0b] text-[#e4e4e7] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-white/5 bg-[#0e0e10] p-6 h-screen sticky top-0 flex-col z-20">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-[#d4af37] rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-crown text-[#0a0a0b] text-xs"></i>
          </div>
          <h1 className="text-base font-display font-extrabold tracking-tight">Zenith<span className="text-[#d4af37]">.</span></h1>
        </div>
        <nav className="space-y-1.5 flex-1">
          {[
            { id: 'dashboard', icon: 'fa-chart-line', label: 'Overview' },
            { id: 'transactions', icon: 'fa-table-list', label: 'Ledger' },
            { id: 'settings', icon: 'fa-sliders', label: 'Config' }
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
      </aside>

      {/* Dock - Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0e0e10]/95 backdrop-blur-xl border-t border-white/5 flex items-start justify-around z-50 px-4 pt-2 pb-[env(safe-area-inset-bottom)]">
        {['dashboard', 'transactions', 'settings'].map(id => (
          <button key={id} onClick={() => setActiveTab(id as any)} className={`p-4 transition-all rounded-full ${activeTab === id ? 'text-[#d4af37] bg-white/5' : 'text-zinc-600'}`}>
            <i className={`fa-solid ${id === 'dashboard' ? 'fa-chart-line' : id === 'transactions' ? 'fa-table-list' : 'fa-sliders'} text-xl`}></i>
          </button>
        ))}
        <button onClick={() => setIsTxModalOpen(true)} className="w-14 h-14 bg-[#d4af37] rounded-full text-[#0a0a0b] shadow-xl transform -translate-y-6 border-4 border-[#0a0a0b] active:scale-90 transition-all flex items-center justify-center">
          <i className="fa-solid fa-plus text-xl"></i>
        </button>
      </nav>

      {/* Main Content Container */}
      <main className="flex-1 p-4 md:p-8 lg:p-14 overflow-y-auto overflow-x-hidden relative">
        <div className="container-fluid page-enter max-w-7xl mx-auto pb-24 lg:pb-0" key={activeTab}>
          <header className="flex items-center justify-between mb-8 md:mb-12">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight text-white mb-0.5 capitalize">{activeTab}</h2>
              <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em]">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <button onClick={() => setIsTxModalOpen(true)} className="hidden md:flex px-6 py-3 bg-[#d4af37] text-[#0a0a0b] rounded-xl font-black text-[9px] tracking-[0.2em] uppercase shadow-xl hover:scale-105 active:scale-95 transition-all items-center gap-2">
              <i className="fa-solid fa-plus-circle"></i> NEW ENTRY
            </button>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <i className="fa-solid fa-circle-notch animate-spin text-2xl text-[#d4af37] mb-4"></i>
              <span className="text-[10px] font-bold uppercase tracking-widest">Hydrating Ledger...</span>
            </div>
          ) : (
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
                  <AccountSettings accounts={accounts} onAdd={(a) => setAccounts(prev => [...prev, { ...a, id: `acc-${Date.now()}` }])} onUpdate={(id, u) => setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...u } : a))} onDelete={(id) => setAccounts(prev => prev.filter(a => a.id !== id))} />
                  <CategorySettings categories={categories} onAdd={(n, t) => setCategories(prev => [...prev, { id: `cat-${Date.now()}`, name: n, type: t }])} onUpdate={(id, n) => setCategories(prev => prev.map(c => c.id === id ? { ...c, name: n } : c))} onDelete={(id) => setCategories(prev => prev.filter(c => c.id !== id))} />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Layers */}
      {(isTxModalOpen || editingTransaction) && (
        <AddTransactionModal
          accounts={accounts} categories={categories} initialData={editingTransaction || undefined}
          onSave={handleSaveTransaction} onClose={() => { setIsTxModalOpen(false); setEditingTransaction(null); }}
        />
      )}
      {isExportModalOpen && <ExportModal transactions={transactions} accounts={accounts} categories={categories} onClose={() => setIsExportModalOpen(false)} />}
      {toast && <Toast message={toast.message} visible={toast.visible} onUndo={handleUndo} />}
    </div>
  );
};

export default App;
