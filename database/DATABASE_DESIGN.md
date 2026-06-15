# Database Design & Implementation
## SearchAI — Multi-Category Search and Filter Platform

---

## Architecture: Polyglot Persistence

| Database   | Purpose                                      | Port  |
|------------|----------------------------------------------|-------|
| PostgreSQL | Structured relational data (users, items, categories, search logs) | 5432 |
| MongoDB Atlas | Flexible document data (reviews, saved items, user activity) | Cloud |

---

## PostgreSQL Schema

### Entity-Relationship Diagram (Text)

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────────────┐
│   users     │       │   categories     │       │   items              │
├─────────────┤       ├──────────────────┤       ├──────────────────────┤
│ id (PK)     │       │ id (PK)          │◄──┐   │ id (PK)              │
│ username UK │       │ name UK          │   │   │ title                │
│ email UK    │       │ description      │   └───│ category_id (FK)     │
│ password    │       │ created_at       │       │ description          │
│ role        │       └──────────────────┘       │ price                │
│ created_at  │                                   │ created_at           │
└─────────────┘                                   │ updated_at           │
                                                   └──────────┬───────────┘
                                                              │ triggers price change
                                                              ▼
┌─────────────────────┐       ┌──────────────────────────────┐
│   search_logs       │       │   item_price_history         │
├─────────────────────┤       ├──────────────────────────────┤
│ id (PK)             │       │ id (PK)                      │
│ keyword             │       │ item_id (FK → items)         │
│ username            │       │ old_price                    │
│ results             │       │ new_price                    │
│ searched_at         │       │ changed_at                   │
└─────────────────────┘       │ changed_by                   │
                               └──────────────────────────────┘
```

### Tables

#### `users`
| Column     | Type         | Constraints                                |
|------------|--------------|--------------------------------------------|
| id         | SERIAL       | PRIMARY KEY                                |
| username   | VARCHAR(50)  | UNIQUE NOT NULL, regex `^[A-Za-z0-9_]+$`  |
| email      | VARCHAR(100) | UNIQUE NOT NULL, email format CHECK        |
| password   | VARCHAR(255) | NOT NULL (BCrypt hash, never plaintext)    |
| role       | VARCHAR(20)  | CHECK IN ('USER','ADMIN'), DEFAULT 'USER'  |
| created_at | TIMESTAMPTZ  | DEFAULT NOW()                              |

#### `categories`
| Column      | Type         | Constraints                    |
|-------------|--------------|--------------------------------|
| id          | SERIAL       | PRIMARY KEY                    |
| name        | VARCHAR(100) | UNIQUE NOT NULL, non-empty CHECK |
| description | TEXT         | nullable                       |
| created_at  | TIMESTAMPTZ  | DEFAULT NOW()                  |

#### `items`
| Column      | Type           | Constraints                              |
|-------------|----------------|------------------------------------------|
| id          | SERIAL         | PRIMARY KEY                              |
| title       | VARCHAR(255)   | NOT NULL, non-empty CHECK                |
| description | TEXT           | nullable                                 |
| price       | NUMERIC(10,2)  | CHECK price >= 0, nullable               |
| category_id | INT            | FK → categories(id) ON DELETE SET NULL   |
| created_at  | TIMESTAMPTZ    | DEFAULT NOW()                            |
| updated_at  | TIMESTAMPTZ    | DEFAULT NOW(), updated by trigger        |

#### `search_logs`
| Column      | Type         | Constraints                         |
|-------------|--------------|-------------------------------------|
| id          | SERIAL       | PRIMARY KEY                         |
| keyword     | VARCHAR(255) | NOT NULL, non-empty CHECK           |
| username    | VARCHAR(100) | NOT NULL, DEFAULT 'anonymous'       |
| results     | INT          | NOT NULL, DEFAULT 0, CHECK >= 0     |
| searched_at | TIMESTAMPTZ  | DEFAULT NOW()                       |

#### `item_price_history` *(auto-populated by trigger)*
| Column     | Type           | Constraints                      |
|------------|----------------|----------------------------------|
| id         | SERIAL         | PRIMARY KEY                      |
| item_id    | INT            | FK → items(id) ON DELETE CASCADE |
| old_price  | NUMERIC(10,2)  | nullable                         |
| new_price  | NUMERIC(10,2)  | nullable                         |
| changed_at | TIMESTAMPTZ    | DEFAULT NOW()                    |
| changed_by | VARCHAR(100)   | DEFAULT 'system'                 |

---

### Indexes (9 total)

| Index Name                  | Table              | Column(s)              | Type    | Purpose                        |
|-----------------------------|--------------------|------------------------|---------|--------------------------------|
| idx_items_title_fts         | items              | title (tsvector)       | GIN     | Full-text search               |
| idx_items_title_trgm        | items              | title (trgm)           | GIN     | Fuzzy / ILIKE search           |
| idx_items_category_id       | items              | category_id            | B-tree  | Category filter                |
| idx_items_price             | items              | price                  | B-tree  | Price range queries            |
| idx_items_updated_at        | items              | updated_at DESC        | B-tree  | Recently updated items         |
| idx_search_logs_keyword     | search_logs        | keyword                | B-tree  | Trending keyword GROUP BY      |
| idx_search_logs_searched_at | search_logs        | searched_at DESC       | B-tree  | Recent searches                |
| idx_search_logs_username    | search_logs        | username               | B-tree  | Per-user search history        |
| idx_users_email             | users              | email                  | B-tree  | Login by email lookup          |
| idx_price_history_item_id   | item_price_history | item_id                | B-tree  | Price history per item         |

---

### Trigger

**`trg_price_history`** — fires `BEFORE UPDATE` on `items`  
- Detects when `price` changes (`OLD.price IS DISTINCT FROM NEW.price`)  
- Inserts a row into `item_price_history` with old and new values  
- Refreshes `updated_at` to `NOW()`

---

### Views (4)

| View                    | Description                                           |
|-------------------------|-------------------------------------------------------|
| `v_item_details`        | Items joined with category name and description       |
| `v_category_stats`      | Per-category item count, avg/min/max price            |
| `v_trending_searches`   | Top 20 keywords by search frequency                   |
| `v_user_activity_summary` | Per-user search count and first/last search time    |

---

### Stored Functions (2)

| Function               | Returns        | Description                                  |
|------------------------|----------------|----------------------------------------------|
| `fn_search_items(keyword, category_id, min_price, max_price)` | SETOF rows | Flexible fuzzy search — all params optional |
| `fn_category_stats()`  | SETOF rows     | Item count and price stats per category      |

---

## MongoDB Schema

### Database: `searchai_mongo`

#### Why MongoDB for these collections?
- **Reviews** — variable comment length, schema may evolve (helpfulness votes, images)
- **Saved Items** — denormalised snapshot (price captured at save time, not live)
- **User Activity** — high-write event log with flexible metadata per action type

---

### Collection: `reviews`

```json
{
  "_id":       ObjectId,
  "itemId":    Number (int, min 1)          — links to PostgreSQL items.id,
  "itemTitle": String (max 255)             — cached for display,
  "username":  String (max 50)              — author,
  "rating":    Number (int, 1–5)            — star rating,
  "comment":   String (max 2000, optional),
  "createdAt": Date
}
```

**Indexes:**
- `{ itemId: 1 }` — fetch all reviews for an item
- `{ username: 1 }` — all reviews by a user
- `{ itemId: 1, username: 1 }` — one-review-per-user enforcement check
- `{ createdAt: -1 }` — newest-first listing
- `{ rating: 1 }` — filter/sort by rating

**Validation:** JSON Schema enforced at collection level (`validationLevel: moderate`)

---

### Collection: `saveditems`

```json
{
  "_id":       ObjectId,
  "username":  String (max 50)              — owner,
  "itemId":    Number (int, min 1)          — links to PostgreSQL items.id,
  "itemTitle": String (max 255)             — cached,
  "category":  String (max 100)            — cached,
  "price":     Number (>= 0)               — price at save time,
  "savedAt":   Date
}
```

**Indexes:**
- `{ username: 1, itemId: 1 }` — **UNIQUE** — prevents duplicate saves
- `{ username: 1 }` — user's saved list
- `{ itemId: 1 }` — all users who saved an item
- `{ savedAt: -1 }` — recently saved first

---

### Collection: `useractivities`

```json
{
  "_id":         ObjectId,
  "username":    String (max 50),
  "action":      String (enum: search | view | save | unsave | review | login | register),
  "target":      String (max 255, optional) — item title or search keyword,
  "metadata":    Object (flexible)          — e.g. { results: 12 } or { price: 55000 },
  "performedAt": Date
}
```

**Indexes:**
- `{ username: 1 }` — all activity for a user
- `{ performedAt: -1 }` — chronological feed
- `{ action: 1 }` — filter by action type
- `{ username: 1, performedAt: -1 }` — compound: user timeline
- `{ performedAt: 1 }` — **TTL index** (expireAfterSeconds: 7776000) — auto-deletes activity older than 90 days

---

## Data Flow

```
User searches "laptop"
    │
    ├─► Spring Boot /api/items/search
    │       └─► PostgreSQL: fn_search_items('laptop')
    │               └─► Returns items from v_item_details
    │
    └─► Node.js POST /node/search-logs
            └─► PostgreSQL: INSERT INTO search_logs
                    └─► Powers v_trending_searches view

User saves an item
    └─► Node.js POST /node/saved-items
            └─► MongoDB: saveditems.insertOne()
                    + useractivities.insertOne({ action: 'save' })

Admin updates item price
    └─► Spring Boot PUT /api/items/{id}
            └─► PostgreSQL UPDATE items SET price = ...
                    └─► Trigger: trg_price_history fires
                            └─► INSERT INTO item_price_history
```

---

## Setup Instructions

### PostgreSQL
```sql
-- 1. In pgAdmin: create database
CREATE DATABASE search_platform;

-- 2. Run schema (creates all tables, indexes, views, functions, trigger + seed data)
\i database/schema.sql

-- 3. Verify
SELECT * FROM v_category_stats;
SELECT * FROM fn_search_items('laptop');
```

### MongoDB
```bash
# Option 1: mongosh
mongosh "mongodb+srv://admin:Search123@cluster0.rzlkzgm.mongodb.net/" --file database/mongodb_schema.js

# Option 2: Python seed script (simpler, no mongosh needed)
pip install pymongo
python database/seed_mongodb.py
```
