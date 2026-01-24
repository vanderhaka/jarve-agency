# Manual Testing Checklist — Reminders (In-App)

**Feature:** Date-based reminders & notifications
**Date:** __________
**Tester:** __________

## Prerequisites
- [ ] Logged in as admin
- [ ] Notifications table migration applied
- [ ] Environment variables set:
  - `SUPABASE_SERVICE_ROLE_KEY` (for cron job)
  - `CRON_SECRET` (optional, for production security)

## 1. Notification Bell UI

### 1.1 Bell Icon Display
- [ ] Navigate to admin dashboard
- [ ] **Expected:** Bell icon visible in header (between "View Site" button and user avatar)
- [ ] **Expected:** Bell shows no badge when no unread notifications

### 1.2 Empty State
- [ ] Click the bell icon
- [ ] **Expected:** Dropdown shows "No notifications" when empty

### 1.3 Notification Dropdown
- [ ] Create a test notification (see section 2)
- [ ] Click the bell icon
- [ ] **Expected:** Dropdown displays recent notifications
- [ ] **Expected:** Unread notifications have blue dot indicator
- [ ] **Expected:** Badge shows unread count

## 2. Task Overdue Notifications

### 2.1 Create Overdue Task
- [ ] Create a task with a past due date (e.g., yesterday)
- [ ] Assign the task to yourself
- [ ] Run cron manually: `POST /api/cron/check-overdue`
- [ ] **Expected:** Notification created for overdue task

### 2.2 Verify Notification Display
- [ ] Open notification dropdown
- [ ] **Expected:** "Task overdue: [task title]" notification appears
- [ ] **Expected:** Notification shows due date in body

### 2.3 Navigate to Entity
- [ ] Click on the notification title
- [ ] **Expected:** Navigates to the task

## 3. Mark as Read

### 3.1 Single Notification
- [ ] Click the checkmark icon on an unread notification
- [ ] **Expected:** Notification marked as read (blue dot disappears)
- [ ] **Expected:** Unread badge count decreases

### 3.2 Mark All as Read
- [ ] Create multiple notifications
- [ ] Click "Mark all read" button in dropdown header
- [ ] **Expected:** All notifications marked as read
- [ ] **Expected:** Badge disappears

## 4. Delete Notification

- [ ] Click the trash icon on a notification
- [ ] **Expected:** Notification removed from list
- [ ] **Expected:** Total count decreases

## 5. Reminder Settings

### 5.1 Frequency Settings
- [ ] Go to Settings page
- [ ] Find Reminder Frequency setting
- [ ] **Expected:** Options are Daily, Weekly, Off

### 5.2 Disable Reminders
- [ ] Set reminder frequency to "Off"
- [ ] Save settings
- [ ] Run cron manually: `POST /api/cron/check-overdue`
- [ ] **Expected:** Response shows "Reminders are disabled"
- [ ] **Expected:** No new notifications created

### 5.3 Timezone Awareness
- [ ] Set timezone in agency settings (e.g., Australia/Adelaide)
- [ ] Create task due "today" in that timezone
- [ ] Run cron job
- [ ] **Expected:** Task is NOT flagged as overdue (due date is today, not past)

## 6. Duplicate Prevention

- [ ] Create an overdue task
- [ ] Run cron job twice
- [ ] **Expected:** Only one notification created (unique index prevents duplicates)

## 7. Milestone Overdue (when Stage 6 complete)

- [ ] Create milestone with past due date
- [ ] Assign to yourself
- [ ] Run scheduler
- [ ] **Expected:** In-app reminder created

## 8. Invoice Overdue (when Stage 5 complete)

- [ ] Create invoice with past due date (Xero sync)
- [ ] Run scheduler
- [ ] **Expected:** In-app reminder created

## 9. Event-Triggered Notifications

### 9.1 Proposal Signed (when Stage 3 complete)
- [ ] Have client sign a proposal
- [ ] **Expected:** Creator receives "Proposal signed" notification

### 9.2 Invoice Paid (when Stage 5 complete)
- [ ] Mark invoice as paid in Xero
- [ ] **Expected:** Creator receives "Invoice paid" notification

### 9.3 Change Request Signed (when Stage 6 complete)
- [ ] Have client sign a change request
- [ ] **Expected:** Creator receives "Change request signed" notification

## 10. Edge Cases

### 10.1 No Assignee
- [ ] Create overdue task with no assignee
- [ ] Run cron job
- [ ] **Expected:** No notification created (no one to notify)

### 10.2 Completed Task
- [ ] Create overdue task, mark as complete
- [ ] Run cron job
- [ ] **Expected:** No notification created (task is done)

### 10.3 High Volume
- [ ] Create 50+ overdue tasks
- [ ] Open notification dropdown
- [ ] **Expected:** Scrollable list, no UI freeze

## Manual Cron Testing

To test the cron job manually during development:

```bash
# Without auth (local development)
curl -X POST http://localhost:3000/api/cron/check-overdue

# With auth (production)
curl -X POST https://your-domain.com/api/cron/check-overdue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Sign-off
- [ ] All checks passed
- [ ] Tester signature: __________
