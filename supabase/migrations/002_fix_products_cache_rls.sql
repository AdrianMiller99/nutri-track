-- Fix RLS policies for products_cache to allow unauthenticated access
-- The cache contains public data from Open Food Facts, so it's safe to share

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Products cache is viewable by everyone" ON products_cache;
DROP POLICY IF EXISTS "Users can insert products to cache" ON products_cache;
DROP POLICY IF EXISTS "Users can update products cache" ON products_cache;

-- Allow anyone (even unauthenticated) to read the cache
CREATE POLICY "Anyone can read products cache"
  ON products_cache FOR SELECT
  USING (true);

-- Allow anyone to insert to cache (it's public OFF data)
CREATE POLICY "Anyone can insert to products cache"
  ON products_cache FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update cache (to refresh stale data)
CREATE POLICY "Anyone can update products cache"
  ON products_cache FOR UPDATE
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "Anyone can read products cache" ON products_cache IS 
  'Public cache of Open Food Facts data - no auth required';
COMMENT ON POLICY "Anyone can insert to products cache" ON products_cache IS 
  'Anyone can cache OFF products since it''s public data';
COMMENT ON POLICY "Anyone can update products cache" ON products_cache IS 
  'Allow refreshing stale cache entries';

