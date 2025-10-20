-- Test Script to Verify Realtime is Working
-- Run this in Supabase SQL Editor WHILE you have the app open in browser

-- ============================================
-- 1. VERIFY REALTIME PUBLICATION
-- ============================================

-- Check if tables are in the realtime publication
SELECT
  schemaname,
  tablename,
  'Table is in realtime publication ✅' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('currencies', 'media', 'ticker_messages', 'users')
ORDER BY tablename;

-- Expected output: Should show all 4 tables
-- If no rows returned, realtime is NOT enabled!

-- ============================================
-- 2. CHECK REPLICA IDENTITY
-- ============================================

SELECT
  c.relname AS table_name,
  CASE c.relreplident
    WHEN 'd' THEN 'DEFAULT ⚠️ (needs to be FULL)'
    WHEN 'f' THEN 'FULL ✅'
    WHEN 'i' THEN 'INDEX'
    WHEN 'n' THEN 'NOTHING'
  END AS replica_identity_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('currencies', 'media', 'ticker_messages', 'users')
ORDER BY c.relname;

-- Expected: All should show 'FULL ✅'

-- ============================================
-- 3. MANUAL TEST - UPDATE A CURRENCY
-- ============================================

-- This will trigger a real-time event
-- WATCH YOUR BROWSER CONSOLE while running this!
-- You should see: 🔥 REAL-TIME EVENT RECEIVED

UPDATE currencies
SET buy_rate = buy_rate + 0.001,
    mid_rate = mid_rate + 0.001,
    sell_rate = sell_rate + 0.001
WHERE code = 'USD'
RETURNING code, buy_rate, mid_rate, sell_rate, updated_at;

-- If you see the console log with "🔥 REAL-TIME EVENT RECEIVED", realtime is working!
-- If you DON'T see it, continue to step 4

-- ============================================
-- 4. CHECK ACTIVE SUBSCRIPTIONS
-- ============================================

-- Check if anyone is subscribed to realtime
SELECT
  pid,
  client_addr,
  state,
  application_name
FROM pg_stat_replication;

-- If this returns rows, replication is active
-- If empty, no one is consuming the realtime feed

-- ============================================
-- 5. FORCE ENABLE REALTIME (IF NEEDED)
-- ============================================

-- If the above checks show tables are NOT in publication, run this:

-- WARNING: Only run this if step 1 showed NO tables!
-- ALTER PUBLICATION supabase_realtime ADD TABLE currencies;
-- ALTER PUBLICATION supabase_realtime ADD TABLE media;
-- ALTER PUBLICATION supabase_realtime ADD TABLE ticker_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ============================================
-- 6. SET REPLICA IDENTITY (IF NEEDED)
-- ============================================

-- If step 2 showed DEFAULT instead of FULL, run this:
-- WARNING: Only run if replica identity is not FULL!

DO $$
BEGIN
  -- Set replica identity to FULL for all tables
  ALTER TABLE currencies REPLICA IDENTITY FULL;
  ALTER TABLE media REPLICA IDENTITY FULL;
  ALTER TABLE ticker_messages REPLICA IDENTITY FULL;
  ALTER TABLE users REPLICA IDENTITY FULL;

  RAISE NOTICE '✅ Replica identity set to FULL for all tables';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error setting replica identity: %', SQLERRM;
END $$;

-- ============================================
-- 7. FINAL VERIFICATION TEST
-- ============================================

-- After enabling realtime, test again with a simple update
-- MAKE SURE YOUR APP IS OPEN IN BROWSER!

DO $$
DECLARE
  test_code TEXT;
BEGIN
  -- Get the first currency code
  SELECT code INTO test_code FROM currencies LIMIT 1;

  -- Update it
  RAISE NOTICE 'Testing realtime with currency: %', test_code;

  UPDATE currencies
  SET buy_rate = buy_rate + 0.001
  WHERE code = test_code;

  RAISE NOTICE '✅ Update complete! Check browser console for real-time event';
END $$;

-- ============================================
-- EXPECTED BROWSER CONSOLE OUTPUT:
-- ============================================

-- When the above update runs, you should see in browser console:
--
-- 🔥 REAL-TIME EVENT RECEIVED - Currency change: {eventType: "UPDATE", ...}
-- Event type: UPDATE
-- New data: {id: "...", code: "USD", buy_rate: "1.234", ...}
-- Old data: {id: "...", code: "USD", buy_rate: "1.233", ...}
-- Triggering fetchCurrencies()...
-- 🔄 Fetching currencies from database...
-- ✅ Currencies fetched successfully: 10 currencies
--
-- If you DON'T see this, realtime is NOT working!
