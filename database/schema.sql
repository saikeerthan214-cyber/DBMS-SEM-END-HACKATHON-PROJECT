-- Run this in pgAdmin Query Tool after creating the database

CREATE DATABASE search_platform;

-- Connect to search_platform, then run:

CREATE TABLE IF NOT EXISTS users (
    id       SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email    VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role     VARCHAR(20)  NOT NULL DEFAULT 'USER'
);

CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS items (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    price       DECIMAL(10, 2),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL
);

-- Sample data
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Gadgets and electronic devices'),
  ('Books',       'Academic and fiction books'),
  ('Clothing',    'Apparel and accessories'),
  ('Furniture',   'Home and office furniture');

INSERT INTO items (title, description, price, category_id) VALUES
  ('Laptop',          'High performance laptop',        55000, 1),
  ('Smartphone',      'Latest Android smartphone',      25000, 1),
  ('Headphones',      'Noise cancelling headphones',     3500, 1),
  ('Java Programming','Complete Java guide',              499, 2),
  ('Data Structures', 'DSA for competitive programming',  399, 2),
  ('T-Shirt',         'Cotton round neck t-shirt',        599, 3),
  ('Jeans',           'Slim fit denim jeans',            1299, 3),
  ('Office Chair',    'Ergonomic office chair',          8999, 4),
  ('Study Table',     'Wooden study table',              4500, 4);
