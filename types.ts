
export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'bank' | 'credit' | 'cash';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  creditLimit?: number; 
  dueDate?: string;     
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
}

export interface TransactionSplit {
  categoryId: string;
  amount: number;
  description?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string; 
  splits?: TransactionSplit[]; 
  description: string;
  date: string;
  type: TransactionType;
  fromAccountId: string;
  toAccountId?: string;
}

export interface AIInsight {
  title: string;
  content: string;
  type: 'saving' | 'warning' | 'tip';
}

export interface SyncSettings {
  apiUrl: string;
  apiKey: string;
  lastSync: string | null;
  enabled: boolean;
}
