-- Supabase Database Setup for Rates App
-- Run this entire script in Supabase Dashboard > SQL Editor

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Create currencies table
CREATE TABLE currencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  flag_url TEXT,
  buy_rate DECIMAL(20, 3) NOT NULL DEFAULT 0,
  mid_rate DECIMAL(20, 3) NOT NULL DEFAULT 0,
  sell_rate DECIMAL(20, 3) NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create media table
CREATE TABLE media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('youtube', 'image')),
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(255)
);

-- Create users table (for user metadata, Firebase handles auth)
CREATE TABLE users (
  uid VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX idx_currencies_order ON currencies("order");
CREATE INDEX idx_media_is_active ON media(is_active);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. POLICIES FOR CURRENCIES
-- ============================================

CREATE POLICY "Anyone can read currencies"
  ON currencies FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert currencies"
  ON currencies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update currencies"
  ON currencies FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete currencies"
  ON currencies FOR DELETE
  USING (true);

-- ============================================
-- 5. POLICIES FOR MEDIA
-- ============================================

CREATE POLICY "Anyone can read media"
  ON media FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert media"
  ON media FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update media"
  ON media FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete media"
  ON media FOR DELETE
  USING (true);

-- ============================================
-- 6. POLICIES FOR USERS
-- ============================================

CREATE POLICY "Authenticated users can read users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update users"
  ON users FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete users"
  ON users FOR DELETE
  USING (true);

-- ============================================
-- 7. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on currencies
CREATE TRIGGER update_currencies_updated_at
  BEFORE UPDATE ON currencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE!
-- ============================================
-- You should see "Success. No rows returned" message
-- Next steps:
-- 1. Go to Table Editor to verify tables exist
-- 2. Go to Storage to create 'media' bucket
-- 3. Run: node scripts/seedCurrenciesSupabase.js
