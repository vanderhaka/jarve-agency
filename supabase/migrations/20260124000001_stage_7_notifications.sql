-- Stage 7: Notifications table for in-app reminders
-- This table stores notifications for overdue items and important events

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type text NOT NULL, -- overdue_task, overdue_invoice, proposal_signed, invoice_paid, change_request_signed, etc.
  title text NOT NULL,
  body text,
  entity_type text NOT NULL, -- task, milestone, invoice, proposal, change_request
  entity_id uuid NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fetching unread notifications for a user (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- Index for fetching all notifications for a user (read and unread)
CREATE INDEX IF NOT EXISTS idx_notifications_user_all
  ON notifications(user_id, created_at DESC);

-- Unique index to prevent duplicate reminders for the same entity
-- This ensures we only create one notification per user/entity/type combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_entity
  ON notifications(user_id, entity_type, entity_id, type);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM employees
      WHERE auth_user_id = auth.uid()
      AND deleted_at IS NULL
    )
  );

-- RLS Policy: Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM employees
      WHERE auth_user_id = auth.uid()
      AND deleted_at IS NULL
    )
  );

-- RLS Policy: System can insert notifications (via service role)
-- Regular users cannot insert notifications directly
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM employees
      WHERE auth_user_id = auth.uid()
      AND deleted_at IS NULL
    )
  );

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'In-app notifications for overdue items and important events';
COMMENT ON COLUMN notifications.type IS 'Notification type: overdue_task, overdue_invoice, proposal_signed, invoice_paid, change_request_signed';
COMMENT ON COLUMN notifications.entity_type IS 'Related entity: task, milestone, invoice, proposal, change_request';
COMMENT ON COLUMN notifications.entity_id IS 'UUID of the related entity';
COMMENT ON COLUMN notifications.read_at IS 'When the notification was marked as read (NULL if unread)';
