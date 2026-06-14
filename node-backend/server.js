/**
 * SearchAI — Node.js Backend
 * ──────────────────────────────────────────────────────────────
 * Port     : 3001
 * Databases: PostgreSQL (search_logs, analytics)
 *            MongoDB    (reviews, user_activity, saved_items)
 *
 * API Routes
 * ──────────────────────────────────────────────────────────────
 * GET  /node/health
 *
 * ── PostgreSQL routes ──
 * GET  /node/search-logs
 * POST /node/search-logs
 * GET  /node/trending
 * GET  /node/analytics
 * DELETE /node/search-logs/:id
 *
 * ── MongoDB routes ──
 * GET  /node/reviews
 * POST /node/reviews
 * DELETE /node/reviews/:id
 *
 * GET  /node/saved-items/:username
 * POST /node/saved-items
 * DELETE /node/saved-items/:id
 *
 * GET  /node/activity/:username
 * POST /node/activity
 */

const express   = require('express');
const { Pool }  = require('pg');
const mongoose  = require('mongoose');
const cors      = require('cors');

const app  = express();
const PORT = 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:8000', 'http://localhost:8081'] }));
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// POSTGRESQL CONNECTION
// ─────────────────────────────────────────────────────────────────────────────
const pool = new Pool({
  host:     'localhost',
  port:     5432,
  database: 'search_platform',
  user:     'postgres',
  password: 'admin@123',
});

pool.query(`
  CREATE TABLE IF NOT EXISTS search_logs (
    id          SERIAL PRIMARY KEY,
    keyword     VARCHAR(255) NOT NULL,
    username    VARCHAR(100) DEFAULT 'anonymous',
    results     INT          DEFAULT 0,
    searched_at TIMESTAMP    DEFAULT NOW()
  );
`).then(() => console.log('✅ PostgreSQL — search_logs table ready'))
  .catch(err  => console.error('❌ PostgreSQL error:', err.message));

// ─────────────────────────────────────────────────────────────────────────────
// MONGODB CONNECTION + SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────
const MONGO_URI = 'mongodb://localhost:27017/searchai';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected at', MONGO_URI))
  .catch(err => console.warn('⚠️  MongoDB not available (start MongoDB to enable):', err.message));

// ── Review Schema ─────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  itemId:    { type: Number, required: true },
  itemTitle: { type: String, required: true },
  username:  { type: String, required: true },
  rating:    { type: Number, min: 1, max: 5, required: true },
  comment:   { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});
const Review = mongoose.model('Review', reviewSchema);

// ── SavedItem Schema ──────────────────────────────────────────────────────────
const savedItemSchema = new mongoose.Schema({
  username:  { type: String, required: true },
  itemId:    { type: Number, required: true },
  itemTitle: { type: String },
  category:  { type: String },
  price:     { type: Number },
  savedAt:   { type: Date, default: Date.now },
});
const SavedItem = mongoose.model('SavedItem', savedItemSchema);

// ── UserActivity Schema ───────────────────────────────────────────────────────
const activitySchema = new mongoose.Schema({
  username:   { type: String, required: true },
  action:     { type: String, required: true }, // 'search', 'view', 'save', 'delete'
  target:     { type: String },                 // item title or search keyword
  metadata:   { type: mongoose.Schema.Types.Mixed },
  performedAt:{ type: Date, default: Date.now },
});
const UserActivity = mongoose.model('UserActivity', activitySchema);

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────
app.get('/node/health', async (req, res) => {
  // Check PostgreSQL
  let pgStatus = 'connected';
  try { await pool.query('SELECT 1'); } catch { pgStatus = 'disconnected'; }

  // Check MongoDB
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status:    'Node.js backend running',
    port:      PORT,
    postgresql: pgStatus,
    mongodb:   mongoStatus,
    timestamp: new Date(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POSTGRESQL ROUTES — Search Logs
// ─────────────────────────────────────────────────────────────────────────────

// GET all search logs
app.get('/node/search-logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM search_logs ORDER BY searched_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — log a new search
app.post('/node/search-logs', async (req, res) => {
  const { keyword, username, results } = req.body;
  if (!keyword) return res.status(400).json({ error: 'keyword is required' });
  try {
    const result = await pool.query(
      'INSERT INTO search_logs (keyword, username, results) VALUES ($1, $2, $3) RETURNING *',
      [keyword, username || 'anonymous', results || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET trending — top 10 keywords
app.get('/node/trending', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT keyword, COUNT(*) AS count
      FROM search_logs
      GROUP BY keyword
      ORDER BY count DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET analytics — cross-table stats (PostgreSQL + MongoDB counts)
app.get('/node/analytics', async (req, res) => {
  try {
    const [logs, items, cats, users] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM search_logs'),
      pool.query('SELECT COUNT(*) AS total FROM items'),
      pool.query('SELECT COUNT(*) AS total FROM categories'),
      pool.query('SELECT COUNT(*) AS total FROM users'),
    ]);
    let reviewCount = 0, savedCount = 0;
    try {
      reviewCount = await Review.countDocuments();
      savedCount  = await SavedItem.countDocuments();
    } catch { /* MongoDB offline */ }

    res.json({
      totalSearches:   parseInt(logs.rows[0].total),
      totalListings:   parseInt(items.rows[0].total),
      totalCategories: parseInt(cats.rows[0].total),
      totalUsers:      parseInt(users.rows[0].total),
      totalReviews:    reviewCount,
      totalSavedItems: savedCount,
      generatedAt:     new Date(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE a search log
app.delete('/node/search-logs/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM search_logs WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// MONGODB ROUTES — Reviews
// ─────────────────────────────────────────────────────────────────────────────

// GET all reviews (optionally filter by itemId)
app.get('/node/reviews', async (req, res) => {
  try {
    const filter = req.query.itemId ? { itemId: Number(req.query.itemId) } : {};
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — create a review
app.post('/node/reviews', async (req, res) => {
  const { itemId, itemTitle, username, rating, comment } = req.body;
  if (!itemId || !username || !rating) {
    return res.status(400).json({ error: 'itemId, username, rating are required' });
  }
  try {
    const review = await Review.create({ itemId, itemTitle, username, rating, comment });
    res.status(201).json(review);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE a review
app.delete('/node/reviews/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// MONGODB ROUTES — Saved Items
// ─────────────────────────────────────────────────────────────────────────────

// GET saved items for a user
app.get('/node/saved-items/:username', async (req, res) => {
  try {
    const items = await SavedItem.find({ username: req.params.username }).sort({ savedAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — save an item
app.post('/node/saved-items', async (req, res) => {
  const { username, itemId, itemTitle, category, price } = req.body;
  if (!username || !itemId) return res.status(400).json({ error: 'username and itemId required' });
  try {
    // Prevent duplicates
    const existing = await SavedItem.findOne({ username, itemId });
    if (existing) return res.status(409).json({ error: 'Item already saved', saved: existing });
    const saved = await SavedItem.create({ username, itemId, itemTitle, category, price });
    res.status(201).json(saved);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE a saved item
app.delete('/node/saved-items/:id', async (req, res) => {
  try {
    await SavedItem.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// MONGODB ROUTES — User Activity
// ─────────────────────────────────────────────────────────────────────────────

// GET activity log for a user
app.get('/node/activity/:username', async (req, res) => {
  try {
    const logs = await UserActivity.find({ username: req.params.username })
      .sort({ performedAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — log an activity
app.post('/node/activity', async (req, res) => {
  const { username, action, target, metadata } = req.body;
  if (!username || !action) return res.status(400).json({ error: 'username and action required' });
  try {
    const log = await UserActivity.create({ username, action, target, metadata });
    res.status(201).json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Node.js backend running on http://localhost:${PORT}`);
  console.log('─────────────────────────────────────────────');
  console.log('PostgreSQL routes:');
  console.log(`  GET    http://localhost:${PORT}/node/health`);
  console.log(`  GET    http://localhost:${PORT}/node/search-logs`);
  console.log(`  POST   http://localhost:${PORT}/node/search-logs`);
  console.log(`  GET    http://localhost:${PORT}/node/trending`);
  console.log(`  GET    http://localhost:${PORT}/node/analytics`);
  console.log(`  DELETE http://localhost:${PORT}/node/search-logs/:id`);
  console.log('MongoDB routes:');
  console.log(`  GET    http://localhost:${PORT}/node/reviews`);
  console.log(`  POST   http://localhost:${PORT}/node/reviews`);
  console.log(`  DELETE http://localhost:${PORT}/node/reviews/:id`);
  console.log(`  GET    http://localhost:${PORT}/node/saved-items/:username`);
  console.log(`  POST   http://localhost:${PORT}/node/saved-items`);
  console.log(`  DELETE http://localhost:${PORT}/node/saved-items/:id`);
  console.log(`  GET    http://localhost:${PORT}/node/activity/:username`);
  console.log(`  POST   http://localhost:${PORT}/node/activity`);
  console.log('─────────────────────────────────────────────\n');
});
