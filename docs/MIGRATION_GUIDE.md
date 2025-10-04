# Database Migration Guide

This guide explains how to run the database migrations for NutriTrack.

## Migrations Overview

1. **001_create_products_cache.sql** - Cache for Open Food Facts products
2. **002_fix_products_cache_rls.sql** - Fix RLS policies for unauthenticated caching
3. **003_create_entries_tables.sql** - User daily food log tables

## Quick Setup

### Option 1: Run All Migrations at Once

Copy and run all three migration files in your Supabase SQL Editor in order:

1. Go to https://app.supabase.com/project/YOUR_PROJECT/sql
2. Copy the contents of each file in order and execute:
   - `supabase/migrations/001_create_products_cache.sql`
   - `supabase/migrations/002_fix_products_cache_rls.sql`
   - `supabase/migrations/003_create_entries_tables.sql`

### Option 2: Using Supabase CLI (Recommended)

```bash
# Make sure you're linked to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
npx supabase db push
```

## Verifying Migrations

After running migrations, verify the tables exist:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should see:
-- - products_cache
-- - entries  
-- - entry_items
```

## Migration Details

### 001: Products Cache

Creates the `products_cache` table for storing Open Food Facts data locally.

**Tables:**
- `products_cache` - Product information with nutrients

**Purpose:**
- Reduce API calls
- Enable offline functionality
- Faster search results

### 002: Fix Products Cache RLS

Updates Row Level Security policies to allow unauthenticated users to read/write the products cache.

**Why:**
- Open Food Facts data is public
- Users don't need to be logged in to search products
- Cache is shared across all users

### 003: Entries Tables

Creates tables for tracking user food logs.

**Tables:**
- `entries` - One entry per user per day
- `entry_items` - Individual foods logged to an entry

**Views:**
- `daily_totals` - Aggregated nutrition totals per day

**Features:**
- Row Level Security (RLS) - Users can only see their own data
- Auto-updating timestamps
- Cascading deletes
- Unique constraint (one entry per user per day)

## Troubleshooting

### "Function update_updated_at_column does not exist"

The first migration (001) should create this function. Make sure to run migration 001 before 003.

### "Relation already exists"

The table already exists from a previous migration. You can either:
- Skip that migration
- Drop the table and re-run: `DROP TABLE table_name CASCADE;`

### Permission Denied

Make sure you're running the SQL as the project owner or with sufficient permissions.

### RLS Blocking Queries

If you're having issues with Row Level Security:

```sql
-- Temporarily disable RLS for testing (NOT RECOMMENDED FOR PRODUCTION)
ALTER TABLE entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE entry_items DISABLE ROW LEVEL SECURITY;

-- Re-enable when done testing
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_items ENABLE ROW LEVEL SECURITY;
```

## Rolling Back

If you need to undo migrations:

### Remove Entries Tables (Migration 003)

```sql
DROP VIEW IF EXISTS daily_totals CASCADE;
DROP TABLE IF EXISTS entry_items CASCADE;
DROP TABLE IF EXISTS entries CASCADE;
```

### Remove Products Cache (Migration 001 & 002)

```sql
DROP TABLE IF EXISTS products_cache CASCADE;
```

### Remove Helper Function

```sql
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

## Next Steps

After running migrations:

1. ✅ Test authentication - Sign up a user
2. ✅ Test food search - Search for products
3. ✅ Test logging - Add foods to today
4. ✅ Test dashboard - View daily totals

## Support

If you encounter issues:
- Check the Supabase Dashboard logs
- Review RLS policies in Table Editor → Policies
- Verify your user is authenticated when testing

