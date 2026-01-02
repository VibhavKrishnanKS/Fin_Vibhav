
import { Account, Category, Transaction } from '../types.ts';

const DEFAULT_URL = 'http://localhost:5000/api';

export const syncToPostgres = async (apiUrl: string, data: { accounts: Account[], categories: Category[], transactions: Transaction[] }) => {
  const url = apiUrl || DEFAULT_URL;
  const response = await fetch(`${url}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to sync to database');
  return response.json();
};

export const fetchFromPostgres = async (apiUrl: string) => {
  const url = apiUrl || DEFAULT_URL;
  const response = await fetch(`${url}/data`);
  if (!response.ok) throw new Error('Failed to fetch from database');
  return response.json();
};
