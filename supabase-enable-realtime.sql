-- Enable Realtime on Supabase Tables
-- Run this script in Supabase Dashboard > SQL Editor
-- This enables real-time broadcasts for currencies, media, and ticker_messages tables

-- ============================================
-- 1. ADD REALTIME PUBLICATION FOR TABLES
-- ============================================

-- Check if ticker_messages table exists, if not create it
CREATE TABLE IF NOT EXISTS ticker_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  icon VARCHAR(20) NOT NULL CHECK (icon IN ('info', 'clock', 'mail')),
  is_active BOOLEAN DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(255)
);

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_ticker_messages_is_active ON ticker_messages(is_active);
CREATE INDEX IF NOT EXISTS idx_ticker_messages_display_order ON ticker_messages(display_order);

-- Enable RLS on ticker_messages if not already enabled
ALTER TABLE ticker_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for ticker_messages if they don't exist
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can read ticker_messages" ON ticker_messages;
  DROP POLICY IF EXISTS "Authenticated users can insert ticker_messages" ON ticker_messages;
  DROP POLICY IF EXISTS "Authenticated users can update ticker_messages" ON ticker_messages;
  DROP POLICY IF EXISTS "Authenticated users can delete ticker_messages" ON ticker_messages;

  -- Create new policies
  CREATE POLICY "Anyone can read ticker_messages"
    ON ticker_messages FOR SELECT
    USING (true);

  CREATE POLICY "Authenticated users can insert ticker_messages"
    ON ticker_messages FOR INSERT
    WITH CHECK (true);

  CREATE POLICY "Authenticated users can update ticker_messages"
    ON ticker_messages FOR UPDATE
    USING (true);

  CREATE POLICY "Authenticated users can delete ticker_messages"
    ON ticker_messages FOR DELETE
    USING (true);
END $$;

-- ============================================
-- 2. ENABLE REALTIME FOR ALL TABLES
-- ============================================

-- Enable realtime by adding tables to the supabase_realtime publication
-- This is CRITICAL for real-time updates to work!

-- First, remove tables if they already exist in publication (to avoid errors)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS currencies;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS media;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS ticker_messages;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS users;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Now add them
ALTER PUBLICATION supabase_realtime ADD TABLE currencies;
ALTER PUBLICATION supabase_realtime ADD TABLE media;
ALTER PUBLICATION supabase_realtime ADD TABLE ticker_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ============================================
-- 3. CREATE REPLICA IDENTITY (REQUIRED FOR REALTIME)
-- ============================================

-- Set replica identity to FULL for all tables
-- This ensures all column values are included in the replication stream
ALTER TABLE currencies REPLICA IDENTITY FULL;
ALTER TABLE media REPLICA IDENTITY FULL;
ALTER TABLE ticker_messages REPLICA IDENTITY FULL;
ALTER TABLE users REPLICA IDENTITY FULL;

-- ============================================
-- 4. VERIFY REALTIME IS ENABLED
-- ============================================

-- Query to check if tables are in the realtime publication
SELECT
  schemaname,
  tablename,
  '✅ In realtime publication' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
ORDER BY tablename;

-- Expected output: 4 rows showing:
-- public | currencies          | ✅ In realtime publication
-- public | media               | ✅ In realtime publication
-- public | ticker_messages     | ✅ In realtime publication
-- public | users               | ✅ In realtime publication

-- ============================================
-- 5. CHECK REPLICA IDENTITY (OPTIONAL)
-- ============================================

-- Verify replica identity is set to FULL
SELECT
  c.relname AS table_name,
  CASE c.relreplident
    WHEN 'd' THEN 'DEFAULT (⚠️ change to FULL)'
    WHEN 'f' THEN 'FULL ✅'
    WHEN 'i' THEN 'INDEX'
    WHEN 'n' THEN 'NOTHING'
  END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('currencies', 'media', 'ticker_messages', 'users')
ORDER BY c.relname;

-- Expected: All should show 'FULL ✅'

-- ============================================
-- DONE! ✅
-- ============================================
-- If you see all 4 tables in step 4, realtime is enabled!
--
-- Next steps:
-- 1. Go to Database > Replication in Supabase dashboard
-- 2. Ensure toggle is ON for: currencies, media, ticker_messages, users
-- 3. Test by opening two browser tabs:
--    - Tab 1: http://localhost:3000 (public view)
--    - Tab 2: http://localhost:3000/admin/dashboard/rates
-- 4. Edit a rate in Tab 2, watch it update INSTANTLY in Tab 1! 🚀
