# Stage 7 Status - Reminders & Notifications (In-App)

## Current Task
- [x] Create notifications table migration
- [x] Create notification server actions
- [x] Create NotificationBell component
- [x] Add notification bell to admin header
- [x] Create cron job API route
- [x] Configure Vercel cron schedule
- [x] Update manual test checklist
- [ ] Apply migration to database
- [ ] Test notification UI
- [ ] Complete manual testing checklist

## Blockers
None - implementation complete, pending testing

## Completed

### Database
- [x] `notifications` table migration
  - id, user_id (FK to employees), type, title, body, entity_type, entity_id, read_at, created_at
  - Index for unread notifications per user
  - Unique index to prevent duplicate reminders
  - RLS policies for user access

### Server Actions (lib/notifications/)
- [x] `getNotifications` - fetch user's notifications with pagination
- [x] `getNotificationCounts` - get total/unread counts for badge
- [x] `markNotificationAsRead` - mark single notification as read
- [x] `markAllNotificationsAsRead` - bulk mark all as read
- [x] `deleteNotification` - remove a notification
- [x] `createNotification` - create notification (for system use)
- [x] `createNotificationsBatch` - batch create notifications

### UI Components
- [x] `NotificationBell` component (components/notification-bell.tsx)
  - Bell icon with unread count badge
  - Dropdown menu with recent notifications
  - Mark as read (single and all)
  - Delete notifications
  - Links to related entities
  - Relative timestamps ("2 hours ago")

### API Routes
- [x] `/api/cron/check-overdue` - daily cron job for overdue items
  - Checks tasks (assignee notified)
  - Checks invoices (creator notified) - when Stage 5 complete
  - Checks milestones (assignee notified) - when Stage 6 complete
  - Uses agency timezone for "overdue" calculation
  - Respects reminder_frequency setting (daily/weekly/off)
  - Protected with CRON_SECRET header
- [x] `/api/notifications/create` - create event-triggered notifications
  - Called by other parts of system for immediate notifications
  - Used for: proposal_signed, invoice_paid, change_request_signed

### Configuration
- [x] `vercel.json` - cron schedule (daily at 6:00 AM UTC)

## Environment Variables Required
```
SUPABASE_SERVICE_ROLE_KEY=xxx  # For cron job RLS bypass
CRON_SECRET=xxx                # Optional: protect cron endpoint
```

## Scope
- Notification table for in-app reminders
- Cron job checks overdue items daily
- Bell icon in header with unread badge
- Dropdown notification list
- Mark as read (single/all)
- Delete notifications
- Links to related entities
- No email/SMS notifications (out of scope)

## Files Created/Changed
- `supabase/migrations/20260124000001_stage_7_notifications.sql` (new)
- `lib/notifications/types.ts` (new)
- `lib/notifications/actions.ts` (new)
- `lib/notifications/index.ts` (new)
- `components/notification-bell.tsx` (new)
- `app/admin/layout.tsx` (modified - added NotificationBell)
- `app/api/cron/check-overdue/route.ts` (new)
- `app/api/notifications/create/route.ts` (new)
- `vercel.json` (new)
- `manual-tests/reminders.md` (updated)

## Integration Points

### Stages 2-6 Dependencies
Stage 7 is designed to work with entities from other stages:
- **Stage 2**: Uses `agency_settings.reminder_frequency`, `reminder_time`, `timezone`
- **Stage 3**: Will notify on `proposal_signed` events (add integration when complete)
- **Stage 5**: Will notify on `invoice_paid` events, check overdue invoices (add integration when complete)
- **Stage 6**: Will notify on `change_request_signed` events, check overdue milestones (add integration when complete)

### Adding Event Notifications
When completing Stages 3, 5, 6, add notification creation to event handlers:
```typescript
// Example: After proposal signed
await fetch('/api/notifications/create', {
  method: 'POST',
  body: JSON.stringify({
    user_id: proposal.created_by,
    type: 'proposal_signed',
    title: `Proposal signed: ${proposal.title}`,
    entity_type: 'proposal',
    entity_id: proposal.id,
  }),
})
```

## Next Steps
1. Apply migration to Supabase database
2. Set environment variables
3. Run manual testing checklist
4. Sign off stage 7

---
*Last updated: 2026-01-24*
