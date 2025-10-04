-- Create products_cache table for caching Open Food Facts data
-- This reduces API calls and enables offline functionality

CREATE TABLE IF NOT EXISTS products_cache (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- Barcode / product code
  name TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  
  -- Nutriments (per 100g)
  nutriments JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Serving size metadata
  serving_size TEXT,
  serving_quantity NUMERIC,
  
  -- Additional metadata
  categories TEXT,
  labels TEXT,
  nutriscore_grade TEXT,
  nova_group INTEGER,
  
  -- Cache management
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on code for fast lookups
CREATE INDEX idx_products_cache_code ON products_cache(code);

-- Index on name for search (case-insensitive)
CREATE INDEX idx_products_cache_name ON products_cache USING gin(to_tsvector('english', name));

-- Index on brand for filtering
CREATE INDEX idx_products_cache_brand ON products_cache(brand);

-- Index on fetched_at for cache invalidation
CREATE INDEX idx_products_cache_fetched_at ON products_cache(fetched_at);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_cache_updated_at
  BEFORE UPDATE ON products_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies: Products cache is read-only for all authenticated users
ALTER TABLE products_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read cached products
CREATE POLICY "Products cache is viewable by everyone"
  ON products_cache FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update cache (you can adjust this based on your needs)
-- For now, we'll allow authenticated users to insert/update their own cache entries
CREATE POLICY "Users can insert products to cache"
  ON products_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update products cache"
  ON products_cache FOR UPDATE
  TO authenticated
  USING (true);

COMMENT ON TABLE products_cache IS 'Cache of Open Food Facts product data to reduce API calls and enable offline functionality';
COMMENT ON COLUMN products_cache.code IS 'Product barcode or OFF product code';
COMMENT ON COLUMN products_cache.nutriments IS 'Nutrients per 100g stored as JSON: {energy_kcal, proteins, carbohydrates, fat, fiber, sugars, sodium, salt}';
COMMENT ON COLUMN products_cache.fetched_at IS 'When this product was last fetched from Open Food Facts API';

