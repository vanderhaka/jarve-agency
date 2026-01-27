-- ============================================================
-- STAGE 7: Reminders & Notifications (In-App Only)
-- Run this script in Supabase Dashboard SQL Editor
-- ============================================================

-- ============================================================
-- PART 1: Create notifications table
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- overdue_task, overdue_milestone, overdue_invoice, proposal_signed, invoice_paid, etc.
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT NOT NULL, -- task, milestone, invoice, proposal, change_request
  entity_id UUID NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fetching unread notifications for a user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, read_at) 
  WHERE read_at IS NULL;

-- Index for fetching all notifications for a user ordered by date
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

-- Unique index to prevent duplicate reminders for same entity
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_entity
  ON notifications(user_id, entity_type, entity_id, type);

-- ============================================================
-- PART 2: RLS Policies for notifications
-- ============================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can only update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System/admins can insert notifications for any user
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.deleted_at IS NULL
    )
  );

-- Service role can insert notifications (for cron jobs)
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Service role can select all notifications (for cron jobs)
DROP POLICY IF EXISTS "Service role can view all notifications" ON notifications;
CREATE POLICY "Service role can view all notifications" ON notifications
  FOR SELECT TO service_role
  USING (true);

-- ============================================================
-- PART 3: Helper function to create notification safely (upsert)
-- ============================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_entity_type TEXT,
  p_entity_id UUID
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id)
  VALUES (p_user_id, p_type, p_title, p_body, p_entity_type, p_entity_id)
  ON CONFLICT (user_id, entity_type, entity_id, type) DO NOTHING
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- DONE
-- ============================================================
DO $$ BEGIN RAISE NOTICE 'Stage 7 migration complete: Notifications'; END $$;
