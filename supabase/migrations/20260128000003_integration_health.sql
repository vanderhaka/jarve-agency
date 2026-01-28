-- ============================================================
-- Integration health tracking (Stripe webhook status)
-- ============================================================

CREATE TABLE IF NOT EXISTS integration_health (
  key TEXT PRIMARY KEY,
  last_success_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS trigger_integration_health_updated_at ON integration_health;
CREATE TRIGGER trigger_integration_health_updated_at
  BEFORE UPDATE ON integration_health
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE integration_health ENABLE ROW LEVEL SECURITY;

-- Employees can read integration health
DROP POLICY IF EXISTS "Employees can view integration_health" ON integration_health;
CREATE POLICY "Employees can view integration_health" ON integration_health
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );
