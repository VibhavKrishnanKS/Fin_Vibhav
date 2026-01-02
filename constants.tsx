
import { Account, Category } from './types';

export const BASE_CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc-cash', name: 'Vault Liquid', type: 'cash', balance: 5000, color: '#d4af37' },
  { id: 'acc-1', name: 'Zenith Institutional', type: 'bank', balance: 150000, color: '#ffffff' },
  { id: 'acc-2', name: 'Equity Portfolio', type: 'bank', balance: 45000, color: '#3B82F6' },
  { id: 'acc-3', name: 'Centurion Credit', type: 'credit', balance: 0, creditLimit: 500000, dueDate: '15th', color: '#71717a' }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Dividend Revenue', type: 'income' },
  { id: 'cat-2', name: 'Professional Fees', type: 'income' },
  { id: 'cat-3', name: 'Capital Gains', type: 'income' },
  { id: 'cat-4', name: 'Lifestyle & Dining', type: 'expense' },
  { id: 'cat-5', name: 'Infrastructure', type: 'expense' },
  { id: 'cat-6', name: 'Logistic Costs', type: 'expense' },
  { id: 'cat-7', name: 'Asset Acquisition', type: 'expense' },
  { id: 'cat-8', name: 'Entertainment', type: 'expense' }
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Lifestyle & Dining': '#fecaca',
  'Infrastructure': '#60A5FA',
  'Logistic Costs': '#FBBF24',
  'Asset Acquisition': '#d4af37',
  'Dividend Revenue': '#10B981',
  'Other': '#71717a'
};

export const COMMON_CURRENCIES = [
  { code: 'INR', symbol: '₹', rate: 1 },
  { code: 'USD', symbol: '$', rate: 83.5 }
];
