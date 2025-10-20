# Enabling Real-Time Updates for Admin Changes

This guide will help you enable instant real-time updates so that when admins make changes, they appear immediately on all connected clients without refresh.

## Problem

Currently, the app has real-time subscription code in place, but real-time broadcasts are not enabled on the Supabase database tables. This means changes made by admins don't trigger real-time events.

## Solution Steps

### Step 1: Enable Real-Time on Database Tables

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Run the SQL Script**
   - Navigate to **SQL Editor** in the left sidebar
   - Click **New Query**
   - Copy and paste the contents of `supabase-enable-realtime.sql`
   - Click **Run** to execute the script

3. **Verify Tables Are Added to Realtime Publication**
   - The script will output a list of tables in the `supabase_realtime` publication
   - You should see:
     - `public.currencies`
     - `public.media`
     - `public.ticker_messages`
     - `public.users`

### Step 2: Enable Realtime in Supabase Dashboard (UI)

1. **Navigate to Database > Replication**
   - In the Supabase dashboard, click **Database** in the left sidebar
   - Click **Replication**

2. **Enable Replication for Each Table**
   - You should see a list of all your tables
   - For each table (`currencies`, `media`, `ticker_messages`, `users`):
     - Click the **Edit** button (pencil icon)
     - Toggle **Enable Replication** to ON
     - Ensure all event types are enabled:
       - ✅ INSERT
       - ✅ UPDATE
       - ✅ DELETE
     - Click **Save**

3. **Alternative: Enable via Database Settings**
   - Go to **Database** > **Settings** > **Replication**
   - Ensure **Enable Realtime** is turned ON globally

### Step 3: Verify Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: Restart Your Development Server

After making the database changes:

```bash
# Stop the dev server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 5: Test Real-Time Updates

1. **Open Two Browser Tabs/Windows**
   - Tab 1: Open the **public rate board** at `http://localhost:3000`
   - Tab 2: Open the **admin dashboard** at `http://localhost:3000/admin/dashboard/rates`

2. **Make a Change in Admin Panel**
   - In Tab 2 (admin), click **Edit** on any currency
   - Change the **Buy Rate**, **Mid Rate**, or **Sell Rate**
   - Click **Save**

3. **Verify Instant Update**
   - **Tab 1** (public view) should **instantly update** without refresh!
   - You should see console logs in the browser developer tools:
     ```
     Currency change detected: {eventType: 'UPDATE', ...}
     Currencies subscription status: SUBSCRIBED
     ```

### Step 6: Monitor Real-Time Connections

**In Browser Console (F12):**
- Open the **Console** tab
- You should see:
  ```
  Currencies subscription status: SUBSCRIBED
  Media subscription status: SUBSCRIBED
  Ticker subscription status: SUBSCRIBED
  ```

**In Supabase Dashboard:**
- Go to **Database** > **Replication**
- You should see active connections listed

## Troubleshooting

### Issue 1: "Subscription status: CHANNEL_ERROR"

**Cause:** Real-time is not enabled on the database

**Solution:**
1. Re-run the `supabase-enable-realtime.sql` script
2. Check **Database** > **Replication** in Supabase dashboard
3. Ensure all tables have replication enabled

### Issue 2: No Console Logs Appearing

**Cause:** Browser is not connecting to Supabase Realtime

**Solution:**
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
3. Check network tab for WebSocket connections (should see `wss://` connection to Supabase)

### Issue 3: Updates Delayed or Not Appearing

**Cause:** Multiple possible issues

**Solutions:**
1. **Check Replica Identity:**
   ```sql
   SELECT schemaname, tablename, replicaidentity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('currencies', 'media', 'ticker_messages', 'users');
   ```
   - All should show `f` (FULL)

2. **Check Publication:**
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```
   - Should list all 4 tables

3. **Check RLS Policies:**
   - Ensure `Anyone can read currencies` policy exists
   - Run: `SELECT * FROM pg_policies WHERE tablename IN ('currencies', 'media', 'ticker_messages');`

### Issue 4: "realtime is not defined" Error

**Cause:** Supabase client not properly configured

**Solution:**
- Ensure you're using `@supabase/supabase-js` version 2.x or higher
- Check `package.json` dependencies
- Run: `npm install @supabase/supabase-js@latest`

### Issue 5: Connection Drops After Some Time

**Cause:** Supabase free tier has connection limits

**Solution:**
1. **Upgrade Supabase Plan** (if needed)
2. **Optimize Subscriptions:**
   - The code already properly unsubscribes on unmount
   - Consider adding reconnection logic if needed

## Advanced Configuration

### Custom Channel Names

The app uses descriptive channel names:
- `public:currencies` - Public rate board currency updates
- `public:media` - Public media activation changes
- `public:ticker_messages` - Ticker message updates
- `public:currencies_admin` - Admin panel currency management

### Rate Limiting

The Supabase client is configured with:
```typescript
realtime: {
  params: {
    eventsPerSecond: 10,
  },
}
```

This prevents overwhelming the client with too many events.

### Monitoring Events

To see all real-time events in the console:

```javascript
// In browser console
supabase.channel('debug-all')
  .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

## How It Works

### Architecture

```
Admin makes change
       ↓
Supabase DB receives UPDATE
       ↓
PostgreSQL triggers UPDATE event
       ↓
Supabase Realtime listens via logical replication
       ↓
Event broadcast via WebSocket (wss://)
       ↓
All connected clients receive event
       ↓
React component calls fetchCurrencies()
       ↓
UI updates instantly!
```

### Code Flow

1. **App Loads:**
   - `useEffect` runs and creates subscriptions
   - Supabase client opens WebSocket connection

2. **Admin Makes Change:**
   - Admin clicks "Save" → `handleUpdate()` called
   - Supabase client sends UPDATE query
   - Database commits change

3. **Real-Time Event:**
   - PostgreSQL publishes change to `supabase_realtime`
   - Supabase broadcasts to all subscribers
   - Callback function executes: `fetchCurrencies()`

4. **UI Updates:**
   - New data fetched from database
   - `setCurrencies()` called
   - React re-renders with new rates

## Performance Considerations

### Optimizations Already Implemented

1. **Proper Cleanup:** Subscriptions are removed on unmount
2. **Efficient Queries:** Fetch only necessary columns
3. **Indexed Fields:** `order`, `is_active` fields are indexed
4. **Rate Limiting:** Events per second limited to 10

### Future Optimizations (Optional)

1. **Delta Updates:** Instead of refetching all data, update only changed rows
2. **Debouncing:** Add debounce to prevent rapid consecutive updates
3. **Optimistic Updates:** Update UI immediately, then sync with server

## Testing Checklist

- [ ] SQL script executed successfully
- [ ] All 4 tables appear in replication settings
- [ ] Environment variables are correct
- [ ] Dev server restarted
- [ ] Browser console shows "SUBSCRIBED" status
- [ ] WebSocket connection visible in Network tab
- [ ] Rate change in admin instantly appears on public view
- [ ] Media activation instantly appears
- [ ] Ticker messages update instantly
- [ ] No errors in browser console

## Support

If real-time still doesn't work after following all steps:

1. **Check Supabase Status:** https://status.supabase.com
2. **Review Supabase Logs:** Dashboard > Logs > Database Logs
3. **Check Browser Console:** Look for connection errors
4. **Verify Firewall/Network:** Ensure WebSocket connections (port 443) are allowed
5. **Test with Simple Query:** Try subscribing to a single table first

## Success!

Once working, you should see:
- ⚡ **Instant updates** when admin changes rates
- 🔄 **Real-time synchronization** across all connected clients
- 📡 **Live ticker messages** updating automatically
- 🎯 **No manual refresh needed**

Your exchange rate board will now update in real-time, just like a professional trading platform!
