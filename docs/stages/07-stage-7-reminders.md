# Stage 7 - Reminders & Notifications (In-App Only)

## Goal
Show in-app notifications for overdue items and important events.

## Preconditions
- Stage 6 complete.

## Scope (In)
- Notification table.
- Scheduled job that checks overdue items daily.
- In-app notification list.

## Scope (Out)
- Email or SMS notifications.

## Data Model Changes
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  type text NOT NULL, -- overdue_task, overdue_invoice, proposal_signed, etc.
  title text NOT NULL,
  body text,
  entity_type text NOT NULL, -- task, milestone, invoice, proposal, change_request
  entity_id uuid NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Optional: prevent duplicate reminders for same entity
CREATE UNIQUE INDEX idx_notifications_unique_entity
  ON notifications(user_id, entity_type, entity_id, type);
```

## Scheduler
- Use a daily cron (Vercel cron or Supabase scheduled function).
- Rule: if `due_date` < today AND status is not done/paid/signed -> create a reminder **once** (no repeats).
- Add a setting to adjust the check frequency if needed later.

## UI Changes
- Bell icon in header with unread count badge.
- Dropdown/panel on click showing recent notifications.
- Each notification links to the relevant entity.
- "Mark as read" on individual items or "Mark all read" button.
- No real-time websockets initially - poll on page load or use Supabase realtime later if needed.

## Data Flow
- Cron job runs daily -> inserts notifications.
- User sees reminders in app.

## Tests

### Automated
- Unit test: overdue task creates reminder.
- Unit test: paid invoice does not create reminder.

### Manual
- `manual-tests/reminders.md`

## Known Risks
- Cron job failure could cause missed reminders
- Unique index prevents legitimate re-reminders for recurring overdue items
- High volume of overdue items could flood notification UI
- Timezone mismatches could cause incorrect "overdue" determination

## Rollback Procedure
If this stage fails:
1. Migration rollback: `DROP TABLE notifications;`
2. Remove cron job from Vercel/Supabase
3. Revert UI changes via git

## Done Definition
- Overdue items create in-app reminders.
- No emails are sent.
- Manual checklist signed.
