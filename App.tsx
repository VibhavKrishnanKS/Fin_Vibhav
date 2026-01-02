
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
import { syncToPostgres, fetchFromPostgres } from './services/apiService.ts';

interface AppStateSnapshot {
  transactions: Transaction[];
  accounts: Account[];
}

const App: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    apiUrl: 'http://localhost:5000/api', apiKey: '', lastSync: null, enabled: false
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'error' | 'cloud'>('connected');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'settings'>('dashboard');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Toast & Undo State
  const [toast, setToast] = useState<{ message: string, visible: boolean } | null>(null);
  const snapshotRef = useRef<AppStateSnapshot | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const savedSync = await get('ws_sync_settings');
        const settings = savedSync || syncSettings;
        setSyncSettings(settings);
        if (settings.enabled) {
          try {
            const data = await fetchFromPostgres(settings.apiUrl);
            if (data.accounts?.length) {
              setAccounts(data.accounts);
              setCategories(data.categories);
              setTransactions(data.transactions);
              setDbStatus('cloud');
            } else await loadLocal();
          } catch (e) { await loadLocal(); setDbStatus('error'); }
        } else await loadLocal();
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    }
    async function loadLocal() {
      const [a, c, t] = await Promise.all([get('ws_accounts'), get('ws_categories'), get('ws_transactions')]);
      if (a) setAccounts(a); if (c) setCategories(c); if (t) setTransactions(t);
    }
    init();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      Promise.all([
        set('ws_accounts', accounts), set('ws_categories', categories),
        set('ws_transactions', transactions), set('ws_sync_settings', syncSettings)
      ]);
      if (dbStatus !== 'error' && dbStatus !== 'syncing') setDbStatus(syncSettings.enabled ? 'cloud' : 'connected');
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
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;

    snapshotRef.current = { transactions: [...transactions], accounts: [...accounts] };
    const updatedAccs = updateBalances(accounts, txToDelete, -1);
    const updatedTxs = transactions.filter(t => t.id !== id);

    setAccounts(updatedAccs);
    setTransactions(updatedTxs);
    triggerToast("Entry removed from ledger");

    if (syncSettings.enabled) {
      syncToPostgres(syncSettings.apiUrl, { accounts: updatedAccs, categories, transactions: updatedTxs }).catch(() => setDbStatus('error'));
    }
  };

  const handleSaveTransaction = async (data: Omit<Transaction, 'id'>, existingId?: string) => {
    snapshotRef.current = { transactions: [...transactions], accounts: [...accounts] };
    let updatedAccs = [...accounts];
    let updatedTxs: Transaction[];
    
    if (existingId) {
      const oldTx = transactions.find(t => t.id === existingId);
      if (oldTx) updatedAccs = updateBalances(updatedAccs, oldTx, -1);
      const newTx = { ...data, id: existingId } as Transaction;
      updatedAccs = updateBalances(updatedAccs, newTx, 1);
      updatedTxs = transactions.map(t => t.id === existingId ? newTx : t);
      triggerToast("Ledger entry updated");
    } else {
      const tx = { ...data, id: `tx-${Date.now()}` } as Transaction;
      updatedAccs = updateBalances(updatedAccs, tx, 1);
      updatedTxs = [tx, ...transactions];
      triggerToast("New entry authorized");
    }

    setTransactions(updatedTxs); 
    setAccounts(updatedAccs); 
    setEditingTransaction(null); 
    setIsTxModalOpen(false);

    if (syncSettings.enabled) {
      syncToPostgres(syncSettings.apiUrl, { accounts: updatedAccs, categories, transactions: updatedTxs }).catch(() => setDbStatus('error'));
    }
  };

  if (isLoading) return <div className="h-screen w-screen bg-[#0a0a0b] flex items-center justify-center"><div className="w-8 h-8 border-2 border-zinc-800 border-t-[#d4af37] rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0a0b] text-[#e4e4e7] overflow-hidden">
      {/* Sidebar - Desktop Only (Fixed Continuity) */}
      <aside className="hidden lg:flex w-64 border-r border-white/5 bg-[#0e0e10] p-6 h-screen sticky top-0 flex-col z-20 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-[#d4af37] rounded-lg flex items-center justify-center shadow-lg shadow-yellow-900/10">
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

      {/* Unified Dock (Phone & Tablet) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0e0e10]/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around z-50 px-4">
        {['dashboard', 'transactions', 'settings'].map(id => (
          <button key={id} onClick={() => setActiveTab(id as any)} className={`p-3 transition-all rounded-full ${activeTab === id ? 'text-[#d4af37] bg-white/5' : 'text-zinc-600'}`}>
            <i className={`fa-solid ${id === 'dashboard' ? 'fa-chart-line' : id === 'transactions' ? 'fa-table-list' : 'fa-sliders'} text-xl`}></i>
          </button>
        ))}
        <button onClick={() => setIsTxModalOpen(true)} className="w-12 h-12 bg-[#d4af37] rounded-full text-[#0a0a0b] shadow-[0_8px_30px_rgba(212,175,55,0.3)] transform -translate-y-5 border-4 border-[#0a0a0b] active:scale-90 transition-all">
          <i className="fa-solid fa-plus text-lg"></i>
        </button>
      </nav>

      {/* Main Framework */}
      <main className="flex-1 p-4 md:p-8 lg:p-10 xl:p-14 overflow-y-auto overflow-x-hidden relative">
        <div className="container-fluid page-enter max-w-7xl mx-auto" key={activeTab}>
          <header className="flex items-center justify-between mb-8 md:mb-14">
            <div>
              <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight text-white mb-0.5">
                {activeTab === 'dashboard' ? 'Sovereign Wealth' : activeTab === 'settings' ? 'System Controls' : 'Financial Ledger'}
              </h2>
              <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.4em]">{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <button onClick={() => setIsTxModalOpen(true)} className="hidden md:flex px-6 py-3 bg-[#d4af37] text-[#0a0a0b] rounded-xl font-black text-[9px] tracking-[0.2em] uppercase hover:scale-105 active:scale-95 transition-all shadow-xl items-center gap-2">
              <i className="fa-solid fa-plus-circle"></i> ADD ENTRY
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
              <div className="max-w-4xl space-y-10 pb-20">
                <AccountSettings accounts={accounts} onAdd={(a) => setAccounts(prev => [...prev, {...a, id: `acc-${Date.now()}`}])} onUpdate={(id, u) => setAccounts(prev => prev.map(a => a.id === id ? {...a, ...u} : a))} onDelete={(id) => setAccounts(prev => prev.filter(a => a.id !== id))} />
                <CategorySettings categories={categories} onAdd={(n, t) => setCategories(prev => [...prev, {id: `cat-${Date.now()}`, name: n, type: t}])} onUpdate={(id, n) => setCategories(prev => prev.map(c => c.id === id ? {...c, name: n} : c))} onDelete={(id) => setCategories(prev => prev.filter(c => c.id !== id))} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Interaction Layers */}
      {(isTxModalOpen || editingTransaction) && (
        <AddTransactionModal 
          accounts={accounts} categories={categories} initialData={editingTransaction || undefined}
          onSave={handleSaveTransaction} onClose={() => {setIsTxModalOpen(false); setEditingTransaction(null);}} 
        />
      )}
      {isExportModalOpen && <ExportModal transactions={transactions} accounts={accounts} categories={categories} onClose={() => setIsExportModalOpen(false)} />}
      {toast && <Toast message={toast.message} visible={toast.visible} onUndo={handleUndo} />}
    </div>
  );
};

export default App;
