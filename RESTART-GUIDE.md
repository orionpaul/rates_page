# How to Restart Dev Server (Clean Start)

## The Issue You Had

The `.next` directory got corrupted, causing `ENOENT` errors. This happens when:
- Config files change while server is running
- Server restarts multiple times rapidly
- Build cache conflicts occur

## Quick Fix (Run These Commands)

```bash
# 1. Stop any running dev server (Ctrl+C in terminal)

# 2. Kill any processes on port 3000
lsof -ti:3000 | xargs kill -9

# 3. Delete corrupted build cache
rm -rf .next

# 4. Clear node cache (optional but recommended)
rm -rf node_modules/.cache

# 5. Start fresh
npm run dev
```

## Detailed Steps

### Step 1: Stop Dev Server
In your terminal where `npm run dev` is running:
- Press `Ctrl+C` to stop the server
- Wait for it to fully shut down

### Step 2: Kill Lingering Processes
Sometimes processes don't stop completely:

**On Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

**On Windows:**
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Step 3: Clean Build Directory
```bash
rm -rf .next
```

This removes all compiled files and forces a fresh build.

### Step 4: Clear Caches (Optional)
```bash
# Clear node cache
rm -rf node_modules/.cache

# If still having issues, reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Step 5: Start Fresh
```bash
npm run dev
```

You should see:
```
✓ Starting...
✓ Ready in ~1s
```

**No errors!** ✅

## Common Errors & Solutions

### Error: Port 3000 already in use
**Solution:** Kill the process on port 3000
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Error: ENOENT (file not found)
**Solution:** Clean .next directory
```bash
rm -rf .next
npm run dev
```

### Error: Module not found
**Solution:** Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Error: Turbopack warning
**Solution:** Ignore it! It's just a warning, not an error
```
⚠ The config property `experimental.turbo` is deprecated.
```
This warning is harmless. The app still works fine.

## When to Clean Rebuild

Clean rebuild when:
- ✅ After changing `next.config.ts`
- ✅ After updating environment variables
- ✅ After installing new packages
- ✅ When seeing ENOENT errors
- ✅ When page doesn't reflect code changes
- ✅ After pulling from git

## Fastest Restart Method

Create this script: `restart.sh`

```bash
#!/bin/bash
# Kill port 3000, clean cache, restart

echo "🛑 Stopping dev server..."
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo "🧹 Cleaning build cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "🚀 Starting fresh..."
npm run dev
```

Make it executable:
```bash
chmod +x restart.sh
```

Use it:
```bash
./restart.sh
```

## VS Code Tip

If using VS Code terminal:
1. Open command palette (Cmd+Shift+P / Ctrl+Shift+P)
2. Type "Terminal: Kill All Terminals"
3. This stops all running processes
4. Open new terminal
5. Run `rm -rf .next && npm run dev`

## Production Build Test

Before deploying, always test the production build:

```bash
# Stop dev server
Ctrl+C

# Clean everything
rm -rf .next

# Build for production
npm run build

# If build succeeds, you're ready for Vercel!
```

## Preventing Issues

**Best practices:**
1. ✅ Stop dev server before changing config files
2. ✅ Restart after config changes
3. ✅ Use `Ctrl+C` to stop (don't close terminal)
4. ✅ Clean .next after major changes
5. ✅ Don't edit files in .next directory

**Avoid:**
1. ❌ Changing config while server is running
2. ❌ Running multiple dev servers simultaneously
3. ❌ Force closing terminal without stopping server
4. ❌ Manually editing .next files

## Emergency Reset

If nothing works, do a complete reset:

```bash
# Stop everything
lsof -ti:3000 | xargs kill -9

# Remove all generated files
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json
rm -rf node_modules/.cache

# Reinstall from scratch
npm install

# Start fresh
npm run dev
```

This takes 2-3 minutes but fixes 99% of issues.

## What I Fixed For You

✅ Removed corrupted `.next` directory
✅ Cleared node cache
✅ Killed process on port 3000
✅ Server is ready for fresh start

**Now run:**
```bash
npm run dev
```

Your site should load perfectly at http://localhost:3000! 🎉

## Summary

**Quick Fix:**
```bash
rm -rf .next && npm run dev
```

**Full Reset:**
```bash
rm -rf .next node_modules package-lock.json && npm install && npm run dev
```

**Your site is fine!** Just needed a clean restart.
