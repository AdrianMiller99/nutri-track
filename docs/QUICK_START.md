# Quick Start Guide

Get NutriTrack running in 5 minutes!

## Prerequisites

- Node.js 20.19+ or 22.12+
- A Supabase account (free tier is fine)

## Step 1: Clone and Install

```bash
cd nutri-track
npm install
```

## Step 2: Setup Supabase

### Create a Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose a name, database password, and region

### Get Your Credentials

1. Go to Settings → API
2. Copy your **Project URL** and **anon public** key

### Create `.env` File

Create `.env` in the project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Run Database Migrations

Go to https://app.supabase.com/project/YOUR_PROJECT/sql

Copy and paste each file's contents into the SQL Editor and run them **in order**:

1. `supabase/migrations/001_create_products_cache.sql`
2. `supabase/migrations/002_fix_products_cache_rls.sql`
3. `supabase/migrations/003_create_entries_tables.sql`

## Step 4: Deploy Edge Functions

```bash
# Login to Supabase
npx supabase login

# Link your project (get ref from project settings)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
npx supabase functions deploy search-products
npx supabase functions deploy get-product
```

Or use the helper script:
```bash
# Windows
deploy-functions.bat

# Mac/Linux
chmod +x deploy-functions.sh
./deploy-functions.sh
```

## Step 5: Start Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## Step 6: Test It Out!

1. **Sign Up** - Go to `/auth` and create an account
2. **Search Food** - Click "🔍 Search" and try "apple" or "banana"
3. **Add to Log** - Click a product, adjust serving size, and "Add to Today"
4. **View Dashboard** - Click "📊 Dashboard" to see your totals!

## Troubleshooting

### "API error: 401" when searching

Edge Functions need to be deployed. Run step 4 again.

### "Row level security policy" error

Run migration 002 to fix the RLS policies.

### Products not being added

Make sure you're logged in and migration 003 was successful.

### CORS errors

Make sure Edge Functions are deployed and `VITE_SUPABASE_URL` in `.env` is correct.

## Next Steps

- **Customize**: Edit colors, logos, and branding in the Vue components
- **Add Goals**: Implement calorie/macro targets (coming soon!)
- **Barcode Scanning**: Integrate camera for mobile scanning
- **Build Android**: Run `npx cap sync android` and open in Android Studio

## Need Help?

- Check the detailed [Setup Guide](./SETUP.md)
- Review [Migration Guide](./MIGRATION_GUIDE.md)
- Read [Open Food Facts Integration](./OPEN_FOOD_FACTS_INTEGRATION.md)

Happy tracking! 🍎

