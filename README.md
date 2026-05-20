# Role-Based Approval & Workflow Management System

A full-stack application built with **React + Node.js (Express) + PostgreSQL** that implements a role-based request approval system with a finite-state workflow engine, complete audit trail, and role-specific dashboards.

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | *(Add Vercel URL after deployment)* |
| Backend API | *(Add Render URL after deployment)* |

**Test Credentials**

| Role | Email | Password |
|------|-------|----------|
| Employee | user@test.com | Test@1234 |
| Manager | manager@test.com | Test@1234 |
| Admin | admin@test.com | Test@1234 |

---

## Tech Stack

**Frontend**
- React 18 + Vite + TypeScript
- Tailwind CSS (custom design system — no UI library)
- React Router v6 (role-based protected routes)
- Zustand (auth state)
- TanStack Query / React Query (server state, caching)
- React Hook Form + Zod (form validation)
- Axios (HTTP client with JWT interceptors)
- Sonner (toast notifications)

**Backend**
- Node.js + Express
- JWT authentication (jsonwebtoken + bcryptjs)
- express-validator (input validation)
- helmet + express-rate-limit (security)
- pg (node-postgres)

**Database**
- PostgreSQL (hosted on Supabase)

**Deployment**
- Frontend → Vercel
- Backend → Render
- Database → Supabase (free tier)

---

## Architecture

### Workflow State Machine

All transitions are defined in a single config (`server/src/config/workflow.js`) used by both backend (enforcement) and frontend (UI). The backend validates every transition server-side — the frontend cannot override it.

```
Submitted         → Approved           (Manager)
Submitted         → Rejected           (Manager)
Submitted         → Needs Clarification (Manager)
Needs Clarification → Submitted        (User — resubmit)
Approved          → Closed             (Admin)
Closed            → Reopened           (Admin)
```

### Database Schema

```sql
users          (id, name, email, password, role, created_at)
requests       (id, title, description, category, priority, status, user_id, created_at, updated_at)
request_logs   (id, request_id, old_status, new_status, changed_by, role, comment, created_at)
```

### API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/requests/stats
GET    /api/requests/mine          (User — own requests with filters)
GET    /api/requests               (Manager/Admin — all requests with filters)
POST   /api/requests               (User — create)
GET    /api/requests/:id
PATCH  /api/requests/:id/status    (workflow transition — validated server-side)
GET    /api/requests/:id/logs
```

### Security

- JWT-based authentication with Authorization header
- Role-based middleware on all protected routes
- Workflow transitions validated on the backend regardless of frontend state
- Input validation and sanitization via express-validator
- Helmet for HTTP security headers
- Rate limiting: 200 req/15min globally, 20 req/15min on auth routes
- Row-level access control: users can only view/edit their own requests

---

## Project Structure

```
jayam-workflow/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js           PostgreSQL connection pool
│   │   │   ├── workflow.js     State machine config & validation
│   │   │   ├── schema.sql      Database schema
│   │   │   └── seed.js         Seed script (3 users, 8 requests)
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── requestController.js
│   │   ├── middleware/
│   │   │   └── auth.js         JWT verify + requireRole factory
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── requests.js
│   │   └── server.js
│   ├── .env.example
│   └── render.yaml
│
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── layout/         Sidebar, Layout
    │   │   ├── ui/             StatusBadge, PriorityBadge, Skeleton,
    │   │   │                   EmptyState, Modal, FilterBar, Pagination
    │   │   └── request/        RequestForm, RequestTimeline, ActionButtons
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── RequestDetail.tsx
    │   │   └── dashboard/      UserDashboard, ManagerDashboard, AdminDashboard
    │   ├── hooks/
    │   ├── store/              authStore (Zustand)
    │   ├── lib/                api.ts, workflow.ts, utils.ts
    │   ├── types/              index.ts
    │   └── router/             ProtectedRoute (role-aware guard)
    ├── .env.example
    └── vercel.json
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (or free Supabase project)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd jayam-workflow

# Install server deps
cd server && npm install

# Install client deps
cd ../client && npm install
```

### 2. Set up environment variables

**Server** (`server/.env`):
```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Client** (`client/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Set up database

Create a free PostgreSQL database on [Supabase](https://supabase.com) (takes 2 minutes), copy the connection string into `server/.env`, then:

```bash
cd server
npm run seed
```

This creates the schema and seeds 3 users + 8 sample requests.

### 4. Run the application

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

App is at `http://localhost:5173`

---

## Deployment

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo, set root directory to `server`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables (DATABASE_URL, JWT_SECRET, CLIENT_URL)
6. Run seed: open Render shell → `npm run seed`

### Frontend → Vercel

1. Import repo on [vercel.com](https://vercel.com)
2. Set root directory to `client`
3. Add env var: `VITE_API_URL=https://your-render-app.onrender.com/api`
4. Deploy

---

## Features Checklist

- [x] **Module 1 — Auth**: JWT login, role-based redirect, token refresh on page reload
- [x] **Module 2 — Request Creation**: Form with validation (title, description, category, priority)
- [x] **Module 3 — Workflow Engine**: State machine enforced server-side, all 6 transitions
- [x] **Module 4 — Action Log**: Every status change logged, timeline UI on request detail
- [x] **Module 5 — Dashboards**: Role-specific views with filters (status, category, priority, date range) + pagination
- [x] **Module 6 — Security**: Role middleware, transition validation, input sanitization, rate limiting, helmet
- [x] **Module 7 — UI Quality**: Sidebar layout, stat cards, status badges, skeleton loading, empty states, toast notifications, responsive

---

*Built for Jayam Web Solutions — React Developer Interview Task*
