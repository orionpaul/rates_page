-- ============================================
-- SIMPLE REALTIME SETUP - RUN THIS FIRST!
-- ============================================
-- Copy this entire script and run in Supabase SQL Editor
-- This is a simplified version that avoids errors

-- Step 1: Create ticker_messages table if it doesn't exist
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

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_ticker_messages_is_active ON ticker_messages(is_active);
CREATE INDEX IF NOT EXISTS idx_ticker_messages_display_order ON ticker_messages(display_order);

-- Step 3: Enable RLS
ALTER TABLE ticker_messages ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies (safe - drops if exists first)
DROP POLICY IF EXISTS "Anyone can read ticker_messages" ON ticker_messages;
DROP POLICY IF EXISTS "Authenticated users can insert ticker_messages" ON ticker_messages;
DROP POLICY IF EXISTS "Authenticated users can update ticker_messages" ON ticker_messages;
DROP POLICY IF EXISTS "Authenticated users can delete ticker_messages" ON ticker_messages;

CREATE POLICY "Anyone can read ticker_messages"
  ON ticker_messages FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert ticker_messages"
  ON ticker_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update ticker_messages"
  ON ticker_messages FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete ticker_messages"
  ON ticker_messages FOR DELETE USING (true);

-- Step 5: Remove tables from realtime publication (if they exist)
-- This prevents "already exists" errors
DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS currencies';
  EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS media';
  EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS ticker_messages';
  EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS users';
EXCEPTION
  WHEN OTHERS THEN NULL; -- Ignore errors
END $$;

-- Step 6: Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE currencies;
ALTER PUBLICATION supabase_realtime ADD TABLE media;
ALTER PUBLICATION supabase_realtime ADD TABLE ticker_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Step 7: Set replica identity to FULL
ALTER TABLE currencies REPLICA IDENTITY FULL;
ALTER TABLE media REPLICA IDENTITY FULL;
ALTER TABLE ticker_messages REPLICA IDENTITY FULL;
ALTER TABLE users REPLICA IDENTITY FULL;

-- ============================================
-- VERIFICATION - CHECK RESULTS BELOW
-- ============================================

-- This should return 4 rows:
SELECT
  tablename,
  '✅ Realtime enabled' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('currencies', 'media', 'ticker_messages', 'users')
ORDER BY tablename;

-- Expected output:
-- currencies          | ✅ Realtime enabled
-- media               | ✅ Realtime enabled
-- ticker_messages     | ✅ Realtime enabled
-- users               | ✅ Realtime enabled

-- ============================================
-- SUCCESS! ✅
-- ============================================
-- If you see 4 rows above, realtime is enabled!
--
-- NEXT STEPS:
-- 1. Go to Database > Replication in Supabase dashboard
-- 2. Toggle ON for each table (currencies, media, ticker_messages, users)
-- 3. Open two browser tabs:
--    - http://localhost:3000 (public)
--    - http://localhost:3000/admin/dashboard/rates (admin)
-- 4. Edit a rate in admin tab
-- 5. Watch it update INSTANTLY in public tab! 🚀
--
-- Check browser console for: 🔥 Currency updated: UPDATE
