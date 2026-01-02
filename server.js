
import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';

const app = express();
const port = 5000; // Shifted to 5000 to avoid Vite conflict

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'vibhav_ledger',
  password: 'postgres', 
  port: 5432,
});

const mapAccount = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  balance: parseFloat(row.balance),
  color: row.color,
  creditLimit: row.credit_limit ? parseFloat(row.credit_limit) : undefined,
  dueDate: row.due_date
});

const mapTransaction = (row) => ({
  id: row.id,
  amount: parseFloat(row.amount),
  categoryId: row.category_id,
  description: row.description,
  date: row.date,
  type: row.type,
  fromAccountId: row.from_account_id,
  toAccountId: row.to_account_id,
  splits: row.splits
});

const initDb = async () => {
  const client = await pool.connect();
  try {
    console.log('⏳ Optimizing database schema...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance NUMERIC NOT NULL,
        color TEXT,
        credit_limit NUMERIC,
        due_date TEXT
      );
      
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT
      );
      
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount NUMERIC NOT NULL,
        category_id TEXT,
        description TEXT,
        date DATE NOT NULL,
        type TEXT NOT NULL,
        from_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
        to_account_id TEXT,
        splits JSONB
      );

      CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date DESC);
    `);
    console.log('✅ PostgreSQL Schema Verified.');
  } catch (err) {
    console.error('❌ Database Initialization Error:', err.message);
  } finally {
    client.release();
  }
};

initDb();

app.get('/api/data', async (req, res) => {
  try {
    const accounts = await pool.query('SELECT * FROM accounts');
    const categories = await pool.query('SELECT * FROM categories');
    const transactions = await pool.query("SELECT id, amount, category_id, description, to_char(date, 'YYYY-MM-DD') as date, type, from_account_id, to_account_id, splits FROM transactions ORDER BY date DESC");
    
    res.json({
      accounts: accounts.rows.map(mapAccount),
      categories: categories.rows,
      transactions: transactions.rows.map(mapTransaction)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sync', async (req, res) => {
  const { accounts, categories, transactions } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM transactions');
    await client.query('DELETE FROM accounts');
    await client.query('DELETE FROM categories');

    for (const acc of accounts) {
      await client.query(
        'INSERT INTO accounts (id, name, type, balance, color, credit_limit, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
        [acc.id, acc.name, acc.type, acc.balance, acc.color, acc.creditLimit || null, acc.dueDate || null]
      );
    }

    for (const cat of categories) {
      await client.query(
        'INSERT INTO categories (id, name, type, icon) VALUES ($1, $2, $3, $4)', 
        [cat.id, cat.name, cat.type, cat.icon || null]
      );
    }

    for (const tx of transactions) {
      await client.query(
        'INSERT INTO transactions (id, amount, category_id, description, date, type, from_account_id, to_account_id, splits) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', 
        [tx.id, tx.amount, tx.categoryId, tx.description, tx.date, tx.type, tx.fromAccountId, tx.toAccountId || null, JSON.stringify(tx.splits || null)]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`🚀 VIBHAV BRIDGE ACTIVE @ http://localhost:${port}/api`);
});
