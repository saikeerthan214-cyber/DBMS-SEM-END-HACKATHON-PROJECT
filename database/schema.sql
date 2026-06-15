-- ============================================================
-- SearchAI — PostgreSQL Schema
-- Well-normalised, constrained, and indexed
-- Run in pgAdmin Query Tool against the search_platform database
-- ============================================================

-- ── 1. Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(50)  UNIQUE NOT NULL
                   CHECK (username ~ '^[A-Za-z0-9_]+$'),
    email      VARCHAR(100) UNIQUE NOT NULL
                   CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL DEFAULT 'USER'
                   CHECK (role IN ('USER', 'ADMIN')),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 2. Categories ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL
                    CHECK (LENGTH(TRIM(name)) > 0),
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Items ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL
                    CHECK (LENGTH(TRIM(title)) > 0),
    description TEXT,
    price       NUMERIC(10, 2) CHECK (price IS NULL OR price >= 0),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Search Logs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_logs (
    id          SERIAL PRIMARY KEY,
    keyword     VARCHAR(255) NOT NULL CHECK (LENGTH(TRIM(keyword)) > 0),
    username    VARCHAR(100) NOT NULL DEFAULT 'anonymous',
    results     INT          NOT NULL DEFAULT 0 CHECK (results >= 0),
    searched_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
-- Fast lookup of items by title (search feature)
CREATE INDEX IF NOT EXISTS idx_items_title
    ON items USING gin(to_tsvector('english', title));

-- Fast filter of items by category
CREATE INDEX IF NOT EXISTS idx_items_category_id
    ON items(category_id);

-- Fast item price range queries
CREATE INDEX IF NOT EXISTS idx_items_price
    ON items(price);

-- Fast trending queries on search_logs
CREATE INDEX IF NOT EXISTS idx_search_logs_keyword
    ON search_logs(keyword);

CREATE INDEX IF NOT EXISTS idx_search_logs_searched_at
    ON search_logs(searched_at DESC);

-- Fast user lookup by email (login)
CREATE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

-- ── Sample Categories ─────────────────────────────────────────
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Gadgets and electronic devices'),
  ('Books',       'Academic and fiction books'),
  ('Clothing',    'Apparel and accessories'),
  ('Furniture',   'Home and office furniture'),
  ('Sports',      'Sports and fitness equipment'),
  ('Kitchen',     'Kitchen appliances and cookware')
ON CONFLICT (name) DO NOTHING;

-- ── Sample Items ──────────────────────────────────────────────
INSERT INTO items (title, description, price, category_id) VALUES
  ('Laptop',            'High performance laptop',             55000.00, 1),
  ('Smartphone',        'Latest Android smartphone',           25000.00, 1),
  ('Headphones',        'Noise cancelling headphones',          3500.00, 1),
  ('Mechanical Keyboard','RGB backlit mechanical keyboard',     2499.00, 1),
  ('Monitor 27"',       '4K IPS display monitor',             18999.00, 1),
  ('Java Programming',  'Complete Java guide',                   499.00, 2),
  ('Data Structures',   'DSA for competitive programming',       399.00, 2),
  ('Clean Code',        'Best practices in software dev',        549.00, 2),
  ('T-Shirt',           'Cotton round neck t-shirt',             599.00, 3),
  ('Jeans',             'Slim fit denim jeans',                 1299.00, 3),
  ('Running Shoes',     'Lightweight running shoes',            2999.00, 3),
  ('Office Chair',      'Ergonomic office chair',               8999.00, 4),
  ('Study Table',       'Wooden study table',                   4500.00, 4),
  ('Bookshelf',         '5-tier wooden bookshelf',              3299.00, 4),
  ('Yoga Mat',          'Anti-slip 6mm yoga mat',                899.00, 5),
  ('Dumbbell Set',      '5kg-20kg adjustable dumbbells',        4999.00, 5),
  ('Blender',           '600W countertop blender',              1799.00, 6),
  ('Air Fryer',         '4L digital air fryer',                 3499.00, 6)
ON CONFLICT DO NOTHING;
