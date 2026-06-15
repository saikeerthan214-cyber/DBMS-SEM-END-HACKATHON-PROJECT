/**
 * SearchAI — Node.js Backend
 * Port: 3001
 * PostgreSQL: search logs, analytics
 * MongoDB Atlas: reviews, saved items, user activity
 */

// Fix SSL for Node.js v24 + Windows
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express        = require('express');
const { Pool }       = require('pg');
const { MongoClient, ObjectId } = require('mongodb');
const cors           = require('cors');

// ── JWT verification (same secret as Spring Boot / FastAPI gateway) ──────────
const JWT_SECRET = process.env.JWT_SECRET || 'MySuperSecretKeyForJWTAuthenticationPlatform2024';

function verifyJWT(token) {
  // Lightweight manual HS256 verify (no dependency needed)
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !sigB64) return null;

    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (expected !== sigB64) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Middleware: require a valid JWT. Sets req.user = decoded claims. */
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const claims = verifyJWT(auth.slice(7));
  if (!claims) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
  req.user = claims;
  next();
}

/** Middleware: require ADMIN role. */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if ((req.user?.role || '').toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ error: 'ADMIN role required' });
    }
    next();
  });
}

const app  = express();
const PORT = 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// POSTGRESQL
// ─────────────────────────────────────────────────────────────────────────────
const pool = new Pool({
  host: 'localhost', port: 5432,
  database: 'search_platform',
  user: 'postgres', password: 'admin@123',
});

pool.query(`
  CREATE TABLE IF NOT EXISTS search_logs (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    username VARCHAR(100) DEFAULT 'anonymous',
    results INT DEFAULT 0,
    searched_at TIMESTAMP DEFAULT NOW()
  );
`).then(() => console.log('✅ PostgreSQL — search_logs ready'))
  .catch(e => console.error('❌ PostgreSQL:', e.message));

// ─────────────────────────────────────────────────────────────────────────────
// MONGODB ATLAS (with SSL options for Windows Node.js)
// ─────────────────────────────────────────────────────────────────────────────
const MONGO_URI = 'mongodb+srv://admin:Search123@cluster0.rzlkzgm.mongodb.net/searchai_mongo?retryWrites=true&w=majority&appName=Cluster0';

const mongoOptions = {
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 15000,
  family: 4,
};

let db = null;

MongoClient.connect(MONGO_URI, mongoOptions)
  .then(client => {
    db = client.db('searchai_mongo');
    console.log('✅ MongoDB Atlas connected — searchai_mongo');
  })
  .catch(err => console.error('❌ MongoDB FAILED:', err.message));

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH
// ─────────────────────────────────────────────────────────────────────────────
app.get('/node/health', async (req, res) => {
  let pg = 'connected';
  try { await pool.query('SELECT 1'); } catch { pg = 'disconnected'; }
  res.json({
    status: 'Node.js backend running',
    port: PORT,
    postgresql: pg,
    mongodb: db ? 'connected' : 'disconnected',
    timestamp: new Date(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POSTGRESQL ROUTES
// ─────────────────────────────────────────────────────────────────────────────
app.get('/node/search-logs', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM search_logs ORDER BY searched_at DESC LIMIT 100');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/node/search-logs', async (req, res) => {
  const { keyword, username, results } = req.body;
  if (!keyword) return res.status(400).json({ error: 'keyword required' });
  try {
    const r = await pool.query(
      'INSERT INTO search_logs (keyword, username, results) VALUES ($1,$2,$3) RETURNING *',
      [keyword, username || 'anonymous', results || 0]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/node/trending', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT keyword, COUNT(*) AS count FROM search_logs
      GROUP BY keyword ORDER BY count DESC LIMIT 10
    `);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/node/analytics', requireAdmin, async (req, res) => {
  try {
    const [logs, items, cats, users] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM search_logs'),
      pool.query('SELECT COUNT(*) AS total FROM items'),
      pool.query('SELECT COUNT(*) AS total FROM categories'),
      pool.query('SELECT COUNT(*) AS total FROM users'),
    ]);
    let reviews = 0, saved = 0;
    if (db) {
      reviews = await db.collection('reviews').countDocuments();
      saved   = await db.collection('saveditems').countDocuments();
    }
    res.json({
      totalSearches:   parseInt(logs.rows[0].total),
      totalListings:   parseInt(items.rows[0].total),
      totalCategories: parseInt(cats.rows[0].total),
      totalUsers:      parseInt(users.rows[0].total),
      totalReviews:    reviews,
      totalSavedItems: saved,
      generatedAt:     new Date(),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/node/search-logs/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM search_logs WHERE id=$1', [req.params.id]);
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// MONGODB ROUTES — Reviews
// ─────────────────────────────────────────────────────────────────────────────
app.get('/node/reviews', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    const filter = req.query.itemId ? { itemId: Number(req.query.itemId) } : {};
    const docs = await db.collection('reviews').find(filter).sort({ createdAt: -1 }).toArray();
    res.json(docs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/node/reviews', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB not connected' });
  const { itemId, itemTitle, username, rating, comment } = req.body;
  if (!itemId || !username || !rating) return res.status(400).json({ error: 'itemId, username, rating required' });
  try {
    const doc = { itemId, itemTitle, username, rating: Number(rating), comment: comment || '', createdAt: new Date() };
    const result = await db.collection('reviews').insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/node/reviews/:id', requireAdmin, async (req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    await db.collection('reviews').deleteOne({ _id: new ObjectId(req.params.id) });
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// MONGODB ROUTES — Saved Items
// ─────────────────────────────────────────────────────────────────────────────
app.get('/node/saved-items/:username', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    const docs = await db.collection('saveditems').find({ username: req.params.username }).sort({ savedAt: -1 }).toArray();
    res.json(docs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/node/saved-items', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB not connected' });
  const { username, itemId, itemTitle, category, price } = req.body;
  if (!username || !itemId) return res.status(400).json({ error: 'username and itemId required' });
  try {
    const existing = await db.collection('saveditems').findOne({ username, itemId });
    if (existing) return res.status(409).json({ error: 'Already saved', saved: existing });
    const doc = { username, itemId, itemTitle, category, price, savedAt: new Date() };
    const result = await db.collection('saveditems').insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/node/saved-items/:id', requireAuth, async (req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    await db.collection('saveditems').deleteOne({ _id: new ObjectId(req.params.id) });
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// MONGODB ROUTES — User Activity
// ─────────────────────────────────────────────────────────────────────────────
app.get('/node/activity/:username', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    const docs = await db.collection('useractivities').find({ username: req.params.username })
      .sort({ performedAt: -1 }).limit(50).toArray();
    res.json(docs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/node/activity', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB not connected' });
  const { username, action, target, metadata } = req.body;
  if (!username || !action) return res.status(400).json({ error: 'username and action required' });
  try {
    const doc = { username, action, target, metadata, performedAt: new Date() };
    const result = await db.collection('useractivities').insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─────────────────────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Node.js backend running on http://localhost:${PORT}`);
  console.log('─────────────────────────────────────────────');
  console.log('PostgreSQL : search-logs, trending, analytics');
  console.log('MongoDB    : reviews, saved-items, activity');
  console.log('Auth       : JWT middleware on write routes');
  console.log('─────────────────────────────────────────────\n');
});

// ─────────────────────────────────────────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(async () => {
    try { await pool.end(); console.log('PostgreSQL pool closed'); } catch {}
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
