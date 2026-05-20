-- ============================================================
-- Role-Based Approval & Workflow Management System
-- Database Schema
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('user', 'manager', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category    VARCHAR(100) NOT NULL,
  priority    VARCHAR(20) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status      VARCHAR(30) NOT NULL DEFAULT 'Submitted'
                CHECK (status IN ('Submitted', 'Approved', 'Rejected', 'Needs Clarification', 'Closed', 'Reopened')),
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Request logs (audit trail)
CREATE TABLE IF NOT EXISTS request_logs (
  id          SERIAL PRIMARY KEY,
  request_id  INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  old_status  VARCHAR(30),
  new_status  VARCHAR(30) NOT NULL,
  changed_by  INTEGER NOT NULL REFERENCES users(id),
  role        VARCHAR(20) NOT NULL,
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_requests_user_id    ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status     ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_request_id     ON request_logs(request_id);
