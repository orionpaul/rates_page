# 🔑 Add Environment Variables to Vercel

## Why You Need This

Your app uses Firebase (for authentication) and Supabase (for database). These services require API keys that are currently only in your local `.env.local` file.

Vercel needs these keys too, but we can't commit them to git for security reasons.

---

## Step-by-Step Guide

### Step 1: Get Your Values

Open your local `.env.local` file and copy these values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBeoCAx3xOa7Puivy7cM27blsOcFYbCKjs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rates-5a99a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rates-5a99a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rates-5a99a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=358325146145
NEXT_PUBLIC_FIREBASE_APP_ID=1:358325146145:web:04261a34758fac1ad60960
NEXT_PUBLIC_SUPABASE_URL=https://ujolohiwzcyacfjxbuvb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Go to Vercel Dashboard

1. Visit https://vercel.com/dashboard
2. Click on your project (rates)
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)

### Step 3: Add Each Variable

For each variable, do this:

1. **Key**: Enter the variable name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
2. **Value**: Paste the value from your `.env.local`
3. **Environment**: Select **all three**:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. Click **Save**

Repeat for all 8 variables.

### Step 4: Redeploy

After adding all variables:

1. Go to **Deployments** tab
2. Click the **three dots** (•••) on the latest deployment
3. Click **Redeploy**
4. Check **Use existing Build Cache**
5. Click **Redeploy**

OR simply push a new commit:
```bash
git push origin main
```

---

## All Variables You Need to Add

### Firebase Variables (6)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Supabase Variables (2)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Total: 8 variables**

---

## Visual Guide

### In Vercel Dashboard:

```
┌─────────────────────────────────────────┐
│ Settings > Environment Variables        │
├─────────────────────────────────────────┤
│                                         │
│ Key:   NEXT_PUBLIC_FIREBASE_API_KEY    │
│ Value: AIzaSyBeoCAx...                 │
│                                         │
│ Environment:                            │
│ ☑ Production                           │
│ ☑ Preview                              │
│ ☑ Development                          │
│                                         │
│         [Save]                          │
└─────────────────────────────────────────┘
```

---

## What Happens Without These Variables

### During Build (Vercel):
- ✅ Build will succeed (we fixed this!)
- ⚠️ But app won't work without the vars

### At Runtime (When Users Visit):
- ❌ Database won't work (no rates displayed)
- ❌ Admin login won't work
- ❌ Browser console shows: "Missing Supabase environment variables"

### After Adding Variables:
- ✅ Everything works perfectly
- ✅ Rates display
- ✅ Admin login works
- ✅ Real-time updates work

---

## Quick Checklist

Before deploying:
- ✅ Fixed build (committed)
- ⏳ Add all 8 environment variables to Vercel
- ⏳ Redeploy on Vercel

After adding variables:
- ⏳ Push code: `git push origin main`
- ⏳ Wait for deployment (~30 seconds)
- ⏳ Visit your live site
- ⏳ Test features work

---

## Verification

After deployment with environment variables:

### Test Homepage:
1. Visit: `https://your-app.vercel.app`
2. Should see currency rates
3. Video should play
4. Ticker should scroll
5. No errors in browser console

### Test Admin:
1. Visit: `https://your-app.vercel.app/admin/login`
2. Login with your credentials
3. Should redirect to dashboard
4. All features should work

---

## Troubleshooting

### If rates don't show:
- Check browser console for errors
- Verify Supabase variables are correct
- Check Supabase dashboard is accessible

### If admin login doesn't work:
- Check browser console for errors
- Verify Firebase variables are correct
- Check Firebase project is active

### If you see "Missing environment variables":
- Verify all 8 variables are in Vercel
- Check spelling exactly matches
- Ensure all three environments selected
- Try redeploying

---

## Security Note

**These keys are safe to use in the browser:**
- All keys start with `NEXT_PUBLIC_` = client-side safe
- They're designed to be used in frontend code
- Supabase/Firebase have additional security rules

**Never commit:**
- `.env.local` (in `.gitignore` ✅)
- Any file with actual key values

---

## Summary

1. **Copy values** from `.env.local`
2. **Go to Vercel** dashboard → Settings → Environment Variables
3. **Add all 8 variables** (select all 3 environments)
4. **Redeploy** or push to trigger new build
5. **Test** that everything works

---

## Your Variables (Quick Reference)

Copy these from your `.env.local`:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBeoCAx3xOa7Puivy7cM27blsOcFYbCKjs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rates-5a99a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rates-5a99a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rates-5a99a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=358325146145
NEXT_PUBLIC_FIREBASE_APP_ID=1:358325146145:web:04261a34758fac1ad60960

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ujolohiwzcyacfjxbuvb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqb2xvaGl3emN5YWNmanhidXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3Njc4NTcsImV4cCI6MjA3NjM0Mzg1N30.-6EJt2WHvJTjnzG2z6NACefuwISFhFpvlvjDlu6FokI
```

---

**Ready to deploy!**

1. Push: `git push origin main`
2. Add variables in Vercel dashboard
3. Redeploy
4. Enjoy your live site! 🚀
