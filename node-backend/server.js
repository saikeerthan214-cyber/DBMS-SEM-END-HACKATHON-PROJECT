/**
 * Node.js Backend — Express + PostgreSQL
 * Provides a secondary REST API for the SearchAI platform.
 * Handles: search logs, user activity, trending data, analytics.
 *
 * Port: 3001
 * Database: PostgreSQL (same search_platform DB)
 */

const express  = require('express');
const { Pool } = require('pg');
const cors     = require('cors');

const app  = express();
const PORT = 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:8000'] }));
app.use(express.json());

// ── DB Connection ─────────────────────────────────────────────────────────────
const pool = new Pool({
  host:     'localhost',
  port:     5432,
  database: 'search_platform',
  user:     'postgres',
  password: 'admin@123',
});

// ── Ensure search_logs table exists ──────────────────────────────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS search_logs (
    id         SERIAL PRIMARY KEY,
    keyword    VARCHAR(255),
    username   VARCHAR(100),
    results    INT DEFAULT 0,
    searched_at TIMESTAMP DEFAULT NOW()
  );
`).then(() => console.log('✅ search_logs table ready'))
  .catch(err => console.error('DB init error:', err.message));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/node/health', (req, res) => {
  res.json({ status: 'Node.js backend running', port: PORT, timestamp: new Date() });
});

// ── GET /node/search-logs — all search logs ──────────────────────────────────
app.get('/node/search-logs', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM search_logs ORDER BY searched_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /node/search-logs — log a search ────────────────────────────────────
app.post('/node/search-logs', async (req, res) => {
  const { keyword, username, results } = req.body;
  if (!keyword) return res.status(400).json({ error: 'keyword is required' });
  try {
    const result = await pool.query(
      'INSERT INTO search_logs (keyword, username, results) VALUES ($1, $2, $3) RETURNING *',
      [keyword, username || 'anonymous', results || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /node/trending — top 10 searched keywords ────────────────────────────
app.get('/node/trending', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT keyword, COUNT(*) as count
      FROM search_logs
      GROUP BY keyword
      ORDER BY count DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /node/analytics — platform-wide stats ────────────────────────────────
app.get('/node/analytics', async (req, res) => {
  try {
    const [logs, items, cats, users] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM search_logs'),
      pool.query('SELECT COUNT(*) as total FROM items'),
      pool.query('SELECT COUNT(*) as total FROM categories'),
      pool.query('SELECT COUNT(*) as total FROM users'),
    ]);
    res.json({
      totalSearches:  parseInt(logs.rows[0].total),
      totalListings:  parseInt(items.rows[0].total),
      totalCategories:parseInt(cats.rows[0].total),
      totalUsers:     parseInt(users.rows[0].total),
      generatedAt:    new Date(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /node/search-logs/:keyword — search history for keyword ───────────────
app.get('/node/search-logs/:keyword', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM search_logs WHERE LOWER(keyword) LIKE LOWER($1) ORDER BY searched_at DESC',
      [`%${req.params.keyword}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /node/search-logs/:id ─────────────────────────────────────────────
app.delete('/node/search-logs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM search_logs WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Node.js backend running on http://localhost:${PORT}`);
  console.log(`   GET  /node/health`);
  console.log(`   GET  /node/search-logs`);
  console.log(`   POST /node/search-logs`);
  console.log(`   GET  /node/trending`);
  console.log(`   GET  /node/analytics`);
});
