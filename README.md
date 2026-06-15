# 🔍 SearchAI — Multi-Category Search and Filter Platform

A full-stack AI-powered search and discovery platform built with React, Spring Boot, FastAPI, Node.js, and PostgreSQL.

---

## 🏗️ Architecture Overview

```
React Frontend (port 5173)
        ↓
FastAPI Gateway (port 8000)   ←→   Node.js Backend (port 3001)
        ↓
Spring Boot Backend (port 8082)
        ↓
PostgreSQL Database (port 5432)
```

---

## 📁 Project Structure

```
├── Frontend/          # React + Vite + TailwindCSS + Framer Motion
├── backend/           # Spring Boot (JWT Auth, RBAC, CRUD)
├── gateway/           # FastAPI API Gateway (proxies to Spring Boot)
├── node-backend/      # Node.js + Express (search logs, analytics)
└── database/          # PostgreSQL schema + seed data
```

---

## 🚀 How to Run

### 1. PostgreSQL — pgAdmin
- Create database: `search_platform`
- Run `database/schema.sql`

### 2. Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
# Runs on http://127.0.0.1:8082
```

### 3. FastAPI Gateway
```bash
cd gateway
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Runs on http://127.0.0.1:8000
# Swagger docs: http://127.0.0.1:8000/docs
```

### 4. Node.js Backend
```bash
cd node-backend
npm install
npm start
# Runs on http://127.0.0.1:3001
```

### 5. React Frontend
```bash
cd Frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 6. Seed 150+ products (optional)
```bash
cd database
node seed_products.js
```

---

## ✅ Rubric Coverage

### Frontend UI Design & Functionality
- Premium dark theme with glassmorphism, Framer Motion animations
- Pages: Home, Login, Register, Admin Dashboard, User Dashboard
- Search, filter by category, price range, role-based views
- Responsive layout for desktop, tablet, mobile

### FastAPI Gateway (port 8000)
- Proxies all requests to Spring Boot via `httpx`
- CORS configured for React frontend
- Request/response logging middleware
- Health check: `GET /gateway/health`
- Routes: `/api/auth/*`, `/api/items/*`, `/api/categories/*`
- Swagger UI: `http://127.0.0.1:8000/docs`

### Spring Boot Security — JWT + RBAC
- `JwtUtil` — HS256 token generation with role claim
- `JwtFilter` — `OncePerRequestFilter` Bearer token validation
- `SecurityConfig` — stateless sessions, `ROLE_ADMIN` for writes
- `AuthService` — BCrypt password hashing, register + login
- Endpoints: `POST /api/auth/register`, `POST /api/auth/login`

### Spring Boot CRUD Operations
- Items: `GET /api/items`, `POST /api/items`, `DELETE /api/items/{id}`
- Search: `GET /api/items/search?keyword=&categoryId=`
- Categories: `GET /api/categories`, `POST`, `DELETE`
- Custom JPQL query for keyword + category filter

### Node.js Backend (port 3001)
- `GET  /node/health` — health check
- `GET  /node/search-logs` — all search history
- `POST /node/search-logs` — log a search
- `GET  /node/trending` — top 10 searched keywords
- `GET  /node/analytics` — platform-wide statistics
- `DELETE /node/search-logs/:id` — delete a log entry

### PostgreSQL Database
- Tables: `users`, `categories`, `items`
- Foreign key: `items.category_id → categories.id`
- 150+ products seeded via `seed_products.js`

### Git Collaboration
- Feature branches: `feature/jwt-authentication`, `feature/admin-dashboard`, `feature/node-backend`, `feature/api-gateway`
- Meaningful commit messages
- `.gitignore` for node_modules, target, __pycache__

---

## 🔑 Default Credentials

| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | admin    | Admin@123 |

---

## 🛠️ Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion |
| Gateway  | FastAPI, httpx, uvicorn             |
| Backend  | Spring Boot 3, Spring Security, JWT |
| Node.js  | Express.js, node-postgres (pg)      |
| Database | PostgreSQL 18                       |
