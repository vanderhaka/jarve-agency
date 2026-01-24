# Manual Testing Checklist — Milestones

**Feature:** Project milestones management and billing
**Stage:** 6 - Milestones + Change Requests
**Date:** __________
**Tester:** __________

## Prerequisites
- [ ] Database migration applied (20260124000001_stage_6_milestones_change_requests.sql)
- [ ] At least one project exists in the system
- [ ] Logged in as an employee

---

## 1. Navigate to Milestones Tab

### Steps
1. Go to Admin > Projects
2. Click on a project to open project details
3. Click on "Milestones" tab

### Expected Results
- [ ] Milestones tab is visible alongside Tasks tab
- [ ] Summary cards show: Total Milestones, Total Value, Invoiced, Remaining
- [ ] Empty state message appears if no milestones exist

---

## 2. Create First Milestone

### Steps
1. Click "Add Milestone" button
2. Enter title: "Design Phase"
3. Enter amount: 5000
4. Select due date: 2 weeks from today
5. Leave status as "Planned"
6. Click "Create Milestone"

### Expected Results
- [ ] Dialog closes
- [ ] New milestone appears in the list
- [ ] Milestone shows:
  - Title: "Design Phase"
  - Amount: $5,000.00
  - GST: + $500.00 GST (10%)
  - Status badge: "Planned" (gray)
  - Due date formatted correctly
- [ ] Summary cards update (Total Milestones: 1, Total Value: $5,000)

---

## 3. Create Deposit Milestone

### Steps
1. Click "Add Milestone" button
2. Enter title: "Project Deposit"
3. Enter amount: 2500
4. Check "Deposit milestone" checkbox
5. Set status to "Active"
6. Click "Create Milestone"

### Expected Results
- [ ] Milestone appears with "Deposit" badge
- [ ] Status shows "Active" (blue)
- [ ] Total Value updates to $7,500

---

## 4. Edit Milestone

### Steps
1. Click the three-dot menu (⋮) on any milestone
2. Select "Edit"
3. Change the amount to 6000
4. Change the description to "Updated scope"
5. Click "Save Changes"

### Expected Results
- [ ] Dialog closes
- [ ] Milestone reflects updated amount and description
- [ ] Summary cards update accordingly

---

## 5. Reorder Milestones (Visual Only)

### Steps
1. Observe milestone order (should be by sort_order)
2. Note: Drag-and-drop reordering is visual indicator only in current implementation

### Expected Results
- [ ] Milestones display in order with # index
- [ ] Grip handle visible on each milestone row

---

## 6. Mark Milestone Complete

### Steps
1. Click three-dot menu on a non-complete milestone
2. Select "Mark Complete"
3. Confirm the action in the dialog

### Expected Results
- [ ] Confirmation dialog warns about invoice creation
- [ ] After confirmation, status changes to "Complete" (green)
- [ ] Idempotency: Clicking complete again should not create duplicate action
- [ ] Note: Xero invoice creation deferred to Stage 5

---

## 7. Complete Milestone Idempotency Test

### Steps
1. Select a milestone already marked "Complete"
2. Attempt to mark it complete again (if option visible)

### Expected Results
- [ ] "Mark Complete" option should not appear for already-complete milestones
- [ ] OR if clicked, should return existing state without changes

---

## 8. Delete Milestone

### Steps
1. Click three-dot menu on a milestone
2. Select "Delete"
3. Confirm deletion

### Expected Results
- [ ] Confirmation dialog appears
- [ ] After confirmation, milestone is removed from list
- [ ] Summary cards update (counts and totals decrease)

---

## 9. View Multiple Milestone Statuses

### Steps
1. Create milestones with different statuses:
   - One "Planned"
   - One "Active"
   - One "Complete"

### Expected Results
- [ ] Planned: Gray badge
- [ ] Active: Blue badge
- [ ] Complete: Green badge
- [ ] Invoiced: Purple badge (when Stage 5 integrates)

---

## 10. Verify GST Calculation

### Steps
1. Create milestone with amount $1,234.56
2. Observe GST display

### Expected Results
- [ ] GST shows as + $123.46 GST (10% of amount, rounded)
- [ ] Total with GST would be $1,358.02

---

## 11. Search Integration

### Steps
1. Create a milestone with distinctive title "QA Testing Phase"
2. Use global search (Cmd/Ctrl + K)
3. Search for "QA Testing"

### Expected Results
- [ ] Milestone appears in search results under "Milestones" group
- [ ] Shows project name and amount in subtitle
- [ ] Clicking navigates to project with milestones tab active

---

## Edge Cases

### Empty State
- [ ] New project shows "No milestones yet" message
- [ ] "Create your first milestone" call to action visible

### Validation
- [ ] Cannot create milestone without title (button disabled)
- [ ] Cannot create milestone without amount (button disabled)
- [ ] Negative amounts handled gracefully

### Large Numbers
- [ ] Milestone with $1,000,000 amount displays correctly
- [ ] Currency formatting includes commas

---

## Sign-off

- [ ] All basic CRUD operations pass
- [ ] Status transitions work correctly
- [ ] UI displays correctly across all states
- [ ] Search integration works
- [ ] GST calculations are accurate

**Tester Signature:** __________
**Date:** __________

---

## Notes
_Add any observations, bugs found, or suggestions below:_



---

*Stage 6 - Invoice integration (auto-create Xero draft) deferred until Stage 5 complete*
