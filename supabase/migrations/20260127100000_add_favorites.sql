-- Migration: Add user favorites table
-- Users can pin/favorite entities for quick access (max 20 per user)

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'client', 'project', 'employee')),
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  entity_subtitle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one favorite per entity per user
  UNIQUE (user_id, entity_type, entity_id)
);

-- Create index for efficient lookup by user
CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- Create index for checking entity favorites
CREATE INDEX idx_favorites_entity ON favorites(entity_type, entity_id);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own favorites
CREATE POLICY "Users can view own favorites"
  ON favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own favorites (with limit check via trigger)
CREATE POLICY "Users can create own favorites"
  ON favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to enforce 20 favorites limit per user
CREATE OR REPLACE FUNCTION check_favorites_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM favorites WHERE user_id = NEW.user_id) >= 20 THEN
    RAISE EXCEPTION 'Maximum favorites limit (20) reached for user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check limit before insert
CREATE TRIGGER enforce_favorites_limit
  BEFORE INSERT ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION check_favorites_limit();

-- Comment for documentation
COMMENT ON TABLE favorites IS 'User-pinned entities for quick command palette access (max 20 per user)';
