-- ============================================================
-- SearchAI — PostgreSQL Schema
-- Multi-Category Search and Filter Platform
-- ============================================================
-- Tables    : users, categories, items, search_logs, item_price_history
-- Indexes   : 9 performance indexes
-- Views     : v_item_details, v_category_stats, v_trending_searches,
--             v_user_activity_summary
-- Functions : fn_search_items, fn_category_stats
-- Triggers  : trg_price_history (auto-log price changes)
-- ============================================================


-- ══ EXTENSIONS ════════════════════════════════════════════════
-- pg_trgm: enables trigram similarity for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ══ TABLES ════════════════════════════════════════════════════

-- ── 1. Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL       PRIMARY KEY,
    username   VARCHAR(50)  UNIQUE NOT NULL
                   CHECK (username ~ '^[A-Za-z0-9_]+$'),
    email      VARCHAR(100) UNIQUE NOT NULL
                   CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL DEFAULT 'USER'
                   CHECK (role IN ('USER', 'ADMIN')),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  users             IS 'Registered platform users — passwords stored as BCrypt hash';
COMMENT ON COLUMN users.role        IS 'USER = browse/save/review. ADMIN = full CRUD on items/categories.';

-- ── 2. Categories ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL
                    CHECK (LENGTH(TRIM(name)) > 0),
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE categories IS 'Top-level item groupings (Electronics, Books, Clothing, …)';

-- ── 3. Items ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
    id          SERIAL         PRIMARY KEY,
    title       VARCHAR(255)   NOT NULL
                    CHECK (LENGTH(TRIM(title)) > 0),
    description TEXT,
    price       NUMERIC(10, 2) CHECK (price IS NULL OR price >= 0),
    category_id INT            REFERENCES categories(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE  items             IS 'Product / listing catalogue';
COMMENT ON COLUMN items.category_id IS 'FK → categories. NULL when parent category is deleted.';

-- ── 4. Search Logs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_logs (
    id          SERIAL       PRIMARY KEY,
    keyword     VARCHAR(255) NOT NULL CHECK (LENGTH(TRIM(keyword)) > 0),
    username    VARCHAR(100) NOT NULL DEFAULT 'anonymous',
    results     INT          NOT NULL DEFAULT 0 CHECK (results >= 0),
    searched_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE search_logs IS 'Every search query — drives trending and analytics features';

-- ── 5. Item Price History ─────────────────────────────────────
-- Automatically populated by trigger trg_price_history
CREATE TABLE IF NOT EXISTS item_price_history (
    id          SERIAL         PRIMARY KEY,
    item_id     INT            NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    old_price   NUMERIC(10, 2),
    new_price   NUMERIC(10, 2),
    changed_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    changed_by  VARCHAR(100)   NOT NULL DEFAULT 'system'
);
COMMENT ON TABLE item_price_history IS 'Auto-logged whenever items.price changes (via trigger)';


-- ══ INDEXES ═══════════════════════════════════════════════════

-- Full-text GIN index on item title (supports to_tsvector search)
CREATE INDEX IF NOT EXISTS idx_items_title_fts
    ON items USING gin(to_tsvector('english', title));

-- Trigram index for LIKE/ILIKE fuzzy search on title
CREATE INDEX IF NOT EXISTS idx_items_title_trgm
    ON items USING gin(title gin_trgm_ops);

-- Category filter
CREATE INDEX IF NOT EXISTS idx_items_category_id
    ON items(category_id);

-- Price range queries
CREATE INDEX IF NOT EXISTS idx_items_price
    ON items(price);

-- Updated_at (for recent-items queries)
CREATE INDEX IF NOT EXISTS idx_items_updated_at
    ON items(updated_at DESC);

-- Trending: group by keyword
CREATE INDEX IF NOT EXISTS idx_search_logs_keyword
    ON search_logs(keyword);

-- Recent searches
CREATE INDEX IF NOT EXISTS idx_search_logs_searched_at
    ON search_logs(searched_at DESC);

-- User-specific search history
CREATE INDEX IF NOT EXISTS idx_search_logs_username
    ON search_logs(username);

-- Login lookup
CREATE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

-- Price history per item
CREATE INDEX IF NOT EXISTS idx_price_history_item_id
    ON item_price_history(item_id);


-- ══ TRIGGER: auto-track price changes ═════════════════════════

CREATE OR REPLACE FUNCTION fn_log_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only log when price actually changes
    IF (OLD.price IS DISTINCT FROM NEW.price) THEN
        INSERT INTO item_price_history (item_id, old_price, new_price, changed_by)
        VALUES (NEW.id, OLD.price, NEW.price, current_user);
    END IF;
    -- Also keep updated_at fresh
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_price_history ON items;
CREATE TRIGGER trg_price_history
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION fn_log_price_change();

COMMENT ON FUNCTION fn_log_price_change() IS
    'Trigger function: logs every price change to item_price_history and refreshes updated_at';


-- ══ STORED FUNCTIONS ══════════════════════════════════════════

-- ── fn_search_items ───────────────────────────────────────────
-- Flexible search: keyword + optional category + optional price range
-- Usage: SELECT * FROM fn_search_items('laptop', NULL, NULL, 60000);
CREATE OR REPLACE FUNCTION fn_search_items(
    p_keyword     TEXT    DEFAULT NULL,
    p_category_id INT     DEFAULT NULL,
    p_min_price   NUMERIC DEFAULT NULL,
    p_max_price   NUMERIC DEFAULT NULL
)
RETURNS TABLE (
    id          INT,
    title       VARCHAR,
    description TEXT,
    price       NUMERIC,
    category_id INT,
    category    VARCHAR,
    created_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id,
        i.title,
        i.description,
        i.price,
        i.category_id,
        c.name        AS category,
        i.created_at
    FROM items i
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE
        -- keyword: matches title using trigram similarity OR ILIKE
        (p_keyword    IS NULL
            OR i.title ILIKE '%' || p_keyword || '%'
            OR similarity(i.title, p_keyword) > 0.2)
        -- category filter
        AND (p_category_id IS NULL OR i.category_id = p_category_id)
        -- price range
        AND (p_min_price   IS NULL OR i.price >= p_min_price)
        AND (p_max_price   IS NULL OR i.price <= p_max_price)
    ORDER BY
        -- Boost exact / high-similarity matches to the top
        CASE WHEN p_keyword IS NOT NULL
             THEN similarity(i.title, p_keyword)
             ELSE 0
        END DESC,
        i.created_at DESC;
END;
$$;

COMMENT ON FUNCTION fn_search_items IS
    'Flexible item search: keyword (fuzzy), category, min/max price. All params optional.';


-- ── fn_category_stats ─────────────────────────────────────────
-- Returns per-category listing count, avg price, min price, max price
-- Usage: SELECT * FROM fn_category_stats();
CREATE OR REPLACE FUNCTION fn_category_stats()
RETURNS TABLE (
    category_id   INT,
    category_name VARCHAR,
    item_count    BIGINT,
    avg_price     NUMERIC,
    min_price     NUMERIC,
    max_price     NUMERIC
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        c.id                                AS category_id,
        c.name                              AS category_name,
        COUNT(i.id)                         AS item_count,
        ROUND(AVG(i.price), 2)              AS avg_price,
        MIN(i.price)                        AS min_price,
        MAX(i.price)                        AS max_price
    FROM categories c
    LEFT JOIN items i ON i.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY item_count DESC;
$$;

COMMENT ON FUNCTION fn_category_stats IS
    'Returns item count and price statistics grouped by category';


-- ══ VIEWS ═════════════════════════════════════════════════════

-- ── v_item_details ────────────────────────────────────────────
-- Joins items → categories; used by API to avoid repeated JOINs
CREATE OR REPLACE VIEW v_item_details AS
SELECT
    i.id,
    i.title,
    i.description,
    i.price,
    i.created_at,
    i.updated_at,
    c.id   AS category_id,
    c.name AS category_name,
    c.description AS category_description
FROM items i
LEFT JOIN categories c ON c.id = i.category_id;

COMMENT ON VIEW v_item_details IS
    'Item rows enriched with category name and description';


-- ── v_category_stats ──────────────────────────────────────────
-- Live category statistics (item count + price range)
CREATE OR REPLACE VIEW v_category_stats AS
SELECT
    c.id,
    c.name,
    c.description,
    COUNT(i.id)            AS item_count,
    ROUND(AVG(i.price), 2) AS avg_price,
    MIN(i.price)           AS min_price,
    MAX(i.price)           AS max_price,
    c.created_at
FROM categories c
LEFT JOIN items i ON i.category_id = c.id
GROUP BY c.id, c.name, c.description, c.created_at;

COMMENT ON VIEW v_category_stats IS
    'Per-category item count and price statistics';


-- ── v_trending_searches ───────────────────────────────────────
-- Top 20 most searched keywords across all users
CREATE OR REPLACE VIEW v_trending_searches AS
SELECT
    keyword,
    COUNT(*)                    AS search_count,
    MAX(searched_at)            AS last_searched,
    ROUND(AVG(results), 0)      AS avg_results
FROM search_logs
GROUP BY keyword
ORDER BY search_count DESC
LIMIT 20;

COMMENT ON VIEW v_trending_searches IS
    'Top 20 search keywords by frequency';


-- ── v_user_activity_summary ───────────────────────────────────
-- Per-user search count, last search time
CREATE OR REPLACE VIEW v_user_activity_summary AS
SELECT
    username,
    COUNT(*)         AS total_searches,
    MAX(searched_at) AS last_search_at,
    MIN(searched_at) AS first_search_at
FROM search_logs
GROUP BY username
ORDER BY total_searches DESC;

COMMENT ON VIEW v_user_activity_summary IS
    'Per-user search frequency and recency summary';


-- ══ SEED DATA ═════════════════════════════════════════════════

-- Categories
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Gadgets, phones, laptops and accessories'),
  ('Books',       'Academic and fiction books'),
  ('Clothing',    'Apparel, shoes, watches and accessories'),
  ('Furniture',   'Home and office furniture'),
  ('Sports',      'Sports and fitness equipment'),
  ('Kitchen',     'Kitchen appliances and cookware')
ON CONFLICT (name) DO NOTHING;

-- Items (18 sample rows — use seed_products.js to load 150+ more)
INSERT INTO items (title, description, price, category_id) VALUES
  ('Laptop',             'High performance laptop',              55000.00, 1),
  ('Smartphone',         'Latest Android smartphone',            25000.00, 1),
  ('Headphones',         'Noise cancelling headphones',           3500.00, 1),
  ('Mechanical Keyboard','RGB backlit mechanical keyboard',       2499.00, 1),
  ('Monitor 27"',        '4K IPS display monitor',              18999.00, 1),
  ('Java Programming',   'Complete Java guide',                    499.00, 2),
  ('Data Structures',    'DSA for competitive programming',        399.00, 2),
  ('Clean Code',         'Best practices in software development', 549.00, 2),
  ('T-Shirt',            'Cotton round neck t-shirt',              599.00, 3),
  ('Jeans',              'Slim fit denim jeans',                  1299.00, 3),
  ('Running Shoes',      'Lightweight running shoes',             2999.00, 3),
  ('Office Chair',       'Ergonomic office chair',                8999.00, 4),
  ('Study Table',        'Wooden study table',                    4500.00, 4),
  ('Bookshelf',          '5-tier wooden bookshelf',               3299.00, 4),
  ('Yoga Mat',           'Anti-slip 6mm yoga mat',                 899.00, 5),
  ('Dumbbell Set',       '5kg–20kg adjustable dumbbells',         4999.00, 5),
  ('Blender',            '600W countertop blender',               1799.00, 6),
  ('Air Fryer',          '4L digital air fryer',                  3499.00, 6)
ON CONFLICT DO NOTHING;

-- ── Verify ────────────────────────────────────────────────────
-- Run these after setup to confirm everything worked:
--
--   SELECT * FROM v_category_stats;
--   SELECT * FROM v_trending_searches;
--   SELECT * FROM fn_search_items('laptop');
--   SELECT * FROM fn_search_items(NULL, 1, 1000, 30000);
--   SELECT * FROM fn_category_stats();
