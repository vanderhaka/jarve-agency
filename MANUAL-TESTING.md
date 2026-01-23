# Manual Testing Checklist

---

# Stage 2: Agency Settings

**Feature:** Agency Settings Configuration
**Date:** 2026-01-23
**Tester:** _______________

## Prerequisites

- [ ] Dev server running (`npm run dev`)
- [ ] Logged in as admin user
- [ ] Database migration applied (agency_settings table exists)

---

## 1. Settings Page Load

### 1.1 Navigate to Settings
- [ ] Go to `/admin/settings`
- [ ] **Expected:** Page loads without errors

### 1.2 Agency Settings Card Visible
- [ ] Verify "Agency Settings" card appears above "Profile Information"
- [ ] Verify card header shows "Configure your business defaults"
- [ ] **Expected:** All form sections visible (may need to scroll)

---

## 2. Business Details Section

### 2.1 Legal Name Field
- [ ] Enter legal name: "Test Company Pty Ltd"
- [ ] **Expected:** Field accepts text input

### 2.2 Trade Name Field
- [ ] Enter trade name: "TestCo"
- [ ] **Expected:** Field accepts text input

### 2.3 ABN Field
- [ ] Enter ABN: "12 345 678 901"
- [ ] **Expected:** Field accepts formatted ABN

### 2.4 GST Rate (Read-only)
- [ ] Verify GST Rate shows "10%"
- [ ] Verify field is disabled/read-only
- [ ] **Expected:** Cannot modify GST rate, shows "Fixed at 10% for Australian GST"

---

## 3. Regional Settings Section

### 3.1 Default Currency Dropdown
- [ ] Click currency dropdown
- [ ] Verify options include: AUD, USD, EUR, GBP, NZD, etc.
- [ ] Select "USD - US Dollar"
- [ ] **Expected:** Dropdown updates to show selected currency

### 3.2 Timezone Dropdown
- [ ] Click timezone dropdown
- [ ] Verify Australian timezones listed (Sydney, Melbourne, Adelaide, etc.)
- [ ] Select "Australia/Sydney"
- [ ] **Expected:** Dropdown updates to show selected timezone

---

## 4. Invoice Settings Section

### 4.1 Invoice Prefix
- [ ] Modify prefix to "TEST-INV"
- [ ] **Expected:** Field accepts alphanumeric text

### 4.2 Default Deposit %
- [ ] Change deposit to "25"
- [ ] **Expected:** Field accepts numeric value

### 4.3 Invoice Terms
- [ ] Enter "Net 30 days"
- [ ] **Expected:** Field accepts text

### 4.4 Payment Due (days)
- [ ] Enter "30"
- [ ] **Expected:** Field accepts numeric value

---

## 5. Timesheet Lock Schedule

### 5.1 Lock Day Dropdown
- [ ] Click Lock Day dropdown
- [ ] Verify weekdays listed (Sunday through Saturday)
- [ ] Select "Monday"
- [ ] **Expected:** Dropdown updates

### 5.2 Lock Time Field
- [ ] Enter time (e.g., "09:00")
- [ ] **Expected:** Field accepts time format

---

## 6. Reminder Settings

### 6.1 Reminder Frequency Dropdown
- [ ] Click Reminder Frequency dropdown
- [ ] Verify options: Daily, Weekly, Off
- [ ] Select "Weekly"
- [ ] **Expected:** Dropdown updates

### 6.2 Reminder Time Field
- [ ] Enter time (e.g., "08:00")
- [ ] **Expected:** Field accepts time format

---

## 7. Save Settings

### 7.1 Save Button Click
- [ ] Click "Save Settings" button
- [ ] **Expected:**
  - Button shows loading state
  - Success message appears
  - No error in console

### 7.2 Verify Persistence
- [ ] Refresh the page (F5 or Cmd+R)
- [ ] **Expected:** All saved values are retained

### 7.3 Verify Database Update
- [ ] Check database via Supabase Dashboard
- [ ] **Expected:** agency_settings row updated with new values

---

## 8. Error Handling

### 8.1 Network Error
- [ ] Disconnect network
- [ ] Click "Save Settings"
- [ ] **Expected:** Error message displayed

### 8.2 Invalid Data
- [ ] Enter non-numeric value in "Default Deposit %"
- [ ] Click Save
- [ ] **Expected:** Validation error or rejection

---

## Stage 2 Test Summary

| Section | Pass | Fail | Blocked |
|---------|------|------|---------|
| 1. Page Load | | | |
| 2. Business Details | | | |
| 3. Regional Settings | | | |
| 4. Invoice Settings | | | |
| 5. Timesheet Lock | | | |
| 6. Reminder Settings | | | |
| 7. Save Settings | | | |
| 8. Error Handling | | | |

**Overall Result:** [ ] PASS  [ ] FAIL

**Notes:**
_____________________________________________________
_____________________________________________________

**Signed off by:** _______________ **Date:** _______________

---
---

# Project Tasks (Kanban + List Views)

**Feature:** Project Tasks (Kanban + List Views)
**Date:** 2026-01-21
**Tester:** _______________

## Prerequisites

- [ ] Dev server running (`npm run dev`)
- [ ] Logged in as authenticated user
- [ ] At least one project exists in the system

---

## 1. Navigation to Project Tasks

### 1.1 Navigate from Projects List
- [ ] Go to `/app/projects`
- [ ] Verify project name is a clickable link (blue, underlined on hover)
- [ ] Click on project name
- [ ] **Expected:** Navigates to `/app/projects/[id]` with task board

### 1.2 Navigate via View Tasks Button
- [ ] Go to `/app/projects`
- [ ] Click "View Tasks" button on a project row
- [ ] **Expected:** Navigates to project detail page with kanban/list view

---

## 2. Project Detail Page - Header

### 2.1 Project Info Display
- [ ] Verify project name is displayed in header
- [ ] Verify "Back to Projects" link works
- [ ] Verify project status badge is shown

### 2.2 Summary Stats
- [ ] Verify "Total" task count displays
- [ ] Verify "In Progress" count displays
- [ ] Verify "Blocked" count displays
- [ ] Verify "Done" count displays
- [ ] Verify "Overdue" count displays (red when > 0)
- [ ] Verify progress percentage displays

### 2.3 View Toggle
- [ ] Verify List/Kanban toggle buttons exist
- [ ] Click "List" - view switches to table
- [ ] Click "Kanban" - view switches to board
- [ ] **Expected:** Views toggle without page reload

---

## 3. Task Creation

### 3.1 Open New Task Dialog
- [ ] Click "New Task" button in header
- [ ] **Expected:** Modal dialog opens

### 3.2 Required Fields Validation
- [ ] Leave title empty and click Create
- [ ] **Expected:** Validation error shown for title

### 3.3 Create Task Successfully
- [ ] Enter title: "Test Task 1"
- [ ] Select type: "feature"
- [ ] Select priority: "high"
- [ ] Click "Create Task"
- [ ] **Expected:**
  - Success toast appears
  - Dialog closes
  - Task appears in Backlog column (kanban) or list
  - Task persists after page refresh

### 3.4 Create Task with Optional Fields
- [ ] Open New Task dialog
- [ ] Enter title: "Test Task 2"
- [ ] Enter description: "Test description"
- [ ] Set due date to tomorrow
- [ ] Set estimate: 4
- [ ] Click "Create Task"
- [ ] **Expected:** Task created with all fields populated

---

## 4. Kanban Board

### 4.1 Column Display
- [ ] Verify all 7 columns display: Backlog, Ready, In Progress, Review, QA, Done, Blocked
- [ ] Verify each column shows task count badge
- [ ] Verify empty columns show placeholder text

### 4.2 Task Cards
- [ ] Verify task cards show title
- [ ] Verify task cards show type badge
- [ ] Verify task cards show priority badge
- [ ] Verify task cards show due date (if set)

### 4.3 Drag and Drop - Same Column
- [ ] Drag a task within the same column to reorder
- [ ] **Expected:**
  - Task moves to new position
  - Order persists after refresh

### 4.4 Drag and Drop - Different Column
- [ ] Drag a task from "Backlog" to "In Progress"
- [ ] **Expected:**
  - Task moves to new column
  - Task status updates
  - Column counts update
  - Summary stats update
  - Changes persist after refresh

### 4.5 Drag to Empty Column
- [ ] Ensure a column is empty
- [ ] Drag a task into the empty column
- [ ] **Expected:** Task drops successfully into empty column

---

## 5. Task Detail / Edit

### 5.1 Open Task Detail
- [ ] Click on a task card (kanban) or row (list)
- [ ] **Expected:** Side sheet opens with task details

### 5.2 Edit Task Title
- [ ] Change task title
- [ ] Click Save
- [ ] **Expected:** Title updates in list/kanban

### 5.3 Edit Task Description
- [ ] Enter/modify description
- [ ] Click Save
- [ ] **Expected:** Description saves

### 5.4 Change Task Status
- [ ] Change status dropdown
- [ ] Click Save
- [ ] **Expected:** Task moves to correct column in kanban

### 5.5 Change Priority
- [ ] Change priority dropdown
- [ ] Click Save
- [ ] **Expected:** Priority badge updates on card

### 5.6 Set Due Date
- [ ] Set a due date
- [ ] Click Save
- [ ] **Expected:** Due date shows on task card

### 5.7 Cancel Edit
- [ ] Make changes to a task
- [ ] Click Cancel
- [ ] Reopen the task
- [ ] **Expected:** Original values preserved (changes not saved)

---

## 6. Task Deletion

### 6.1 Delete with Confirmation
- [ ] Open task detail sheet
- [ ] Click Delete button
- [ ] **Expected:** Confirmation dialog appears

### 6.2 Cancel Delete
- [ ] Click Cancel on confirmation dialog
- [ ] **Expected:** Dialog closes, task remains

### 6.3 Confirm Delete
- [ ] Click Delete on confirmation dialog
- [ ] **Expected:**
  - Task removed from list/kanban
  - Success toast appears
  - Task does not reappear after refresh

---

## 7. Filters (List View)

### 7.1 Text Search
- [ ] Switch to List view
- [ ] Enter search term in search box
- [ ] **Expected:** Only tasks matching title/description shown

### 7.2 Status Filter
- [ ] Select a status from filter dropdown
- [ ] **Expected:** Only tasks with that status shown

### 7.3 Type Filter
- [ ] Select a type from filter dropdown
- [ ] **Expected:** Only tasks of that type shown

### 7.4 Priority Filter
- [ ] Select a priority from filter dropdown
- [ ] **Expected:** Only tasks with that priority shown

### 7.5 Combined Filters
- [ ] Apply multiple filters simultaneously
- [ ] **Expected:** Tasks match ALL filter criteria

### 7.6 Clear Filters
- [ ] Click "Clear filters" button
- [ ] **Expected:** All tasks shown, filters reset

---

## 8. Error Handling

### 8.1 Network Error on Save
- [ ] Disconnect network
- [ ] Try to save a task edit
- [ ] **Expected:** Error toast shown

### 8.2 Network Error on Drag
- [ ] Disconnect network
- [ ] Drag a task to new column
- [ ] **Expected:**
  - Error toast shown
  - Task reverts to original position

---

## 9. Data Persistence

### 9.1 Refresh Persistence
- [ ] Create a task
- [ ] Refresh the page
- [ ] **Expected:** Task still exists

### 9.2 Position Persistence
- [ ] Reorder tasks via drag-and-drop
- [ ] Refresh the page
- [ ] **Expected:** Order preserved

### 9.3 Status Persistence
- [ ] Move task to different status
- [ ] Refresh the page
- [ ] **Expected:** Task remains in new status column

---

## 10. Responsive Design

### 10.1 Desktop (1920px+)
- [ ] All columns visible in kanban
- [ ] Table displays all columns in list view

### 10.2 Tablet (768px-1024px)
- [ ] Kanban scrolls horizontally if needed
- [ ] Table remains usable

### 10.3 Mobile (< 768px)
- [ ] Kanban columns scroll horizontally
- [ ] Touch drag-and-drop works (if supported)
- [ ] Task detail sheet displays correctly

---

## Test Summary

| Section | Pass | Fail | Blocked |
|---------|------|------|---------|
| 1. Navigation | | | |
| 2. Header | | | |
| 3. Task Creation | | | |
| 4. Kanban Board | | | |
| 5. Task Detail/Edit | | | |
| 6. Task Deletion | | | |
| 7. Filters | | | |
| 8. Error Handling | | | |
| 9. Data Persistence | | | |
| 10. Responsive | | | |

**Overall Result:** [ ] PASS  [ ] FAIL

**Notes:**
_____________________________________________________
_____________________________________________________
_____________________________________________________

**Signed off by:** _______________ **Date:** _______________
