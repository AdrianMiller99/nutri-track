-- Create tables for daily food logging
-- Users track what they eat each day

-- ============================================
-- ENTRIES: One entry per user per day
-- ============================================
CREATE TABLE IF NOT EXISTS entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL, -- YYYY-MM-DD
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one entry per user per day
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_entries_user_id ON entries(user_id);
CREATE INDEX idx_entries_date ON entries(date);
CREATE INDEX idx_entries_user_date ON entries(user_id, date);

-- Auto-update updated_at
CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entries"
  ON entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
  ON entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- ENTRY_ITEMS: Individual foods logged
-- ============================================
CREATE TABLE IF NOT EXISTS entry_items (
  id BIGSERIAL PRIMARY KEY,
  entry_id BIGINT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  
  -- Product reference
  product_code TEXT NOT NULL, -- Barcode or OFF code
  label TEXT NOT NULL, -- Snapshot of product name
  brand TEXT,
  image_url TEXT,
  
  -- Serving info
  serving_grams NUMERIC NOT NULL, -- How much they ate
  quantity NUMERIC NOT NULL DEFAULT 1, -- Number of servings (for future use)
  
  -- Nutrient snapshot (so history doesn't change if OFF updates)
  kcal NUMERIC NOT NULL DEFAULT 0,
  protein_g NUMERIC NOT NULL DEFAULT 0,
  carb_g NUMERIC NOT NULL DEFAULT 0,
  fat_g NUMERIC NOT NULL DEFAULT 0,
  fiber_g NUMERIC DEFAULT 0,
  sugar_g NUMERIC DEFAULT 0,
  sodium_mg NUMERIC DEFAULT 0,
  
  -- Meal type (optional, for future enhancement)
  meal_type TEXT, -- breakfast, lunch, dinner, snack
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_entry_items_entry_id ON entry_items(entry_id);
CREATE INDEX idx_entry_items_product_code ON entry_items(product_code);
CREATE INDEX idx_entry_items_created_at ON entry_items(created_at);

-- Auto-update updated_at
CREATE TRIGGER update_entry_items_updated_at
  BEFORE UPDATE ON entry_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (based on parent entry ownership)
ALTER TABLE entry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items from their own entries"
  ON entry_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_items.entry_id
      AND entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items to their own entries"
  ON entry_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_items.entry_id
      AND entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their own entries"
  ON entry_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_items.entry_id
      AND entries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_items.entry_id
      AND entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their own entries"
  ON entry_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_items.entry_id
      AND entries.user_id = auth.uid()
    )
  );

-- ============================================
-- HELPER VIEW: Daily totals
-- ============================================
CREATE OR REPLACE VIEW daily_totals AS
SELECT
  e.id as entry_id,
  e.user_id,
  e.date,
  COUNT(ei.id) as item_count,
  COALESCE(SUM(ei.kcal), 0) as total_kcal,
  COALESCE(SUM(ei.protein_g), 0) as total_protein_g,
  COALESCE(SUM(ei.carb_g), 0) as total_carb_g,
  COALESCE(SUM(ei.fat_g), 0) as total_fat_g,
  COALESCE(SUM(ei.fiber_g), 0) as total_fiber_g,
  COALESCE(SUM(ei.sugar_g), 0) as total_sugar_g,
  COALESCE(SUM(ei.sodium_mg), 0) as total_sodium_mg
FROM entries e
LEFT JOIN entry_items ei ON e.id = ei.entry_id
GROUP BY e.id, e.user_id, e.date;

-- Comments
COMMENT ON TABLE entries IS 'One entry per user per day for food logging';
COMMENT ON TABLE entry_items IS 'Individual food items logged by users';
COMMENT ON COLUMN entry_items.kcal IS 'Calories for the serving_grams amount (snapshot)';
COMMENT ON COLUMN entry_items.protein_g IS 'Protein in grams for the serving_grams amount (snapshot)';
COMMENT ON VIEW daily_totals IS 'Aggregated nutrient totals per day per user';

