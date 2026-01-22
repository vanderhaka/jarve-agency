# Manual Testing Checklist — Leads Pipeline

**Feature:** Leads List + Kanban + External Submission
**Date:** __________
**Tester:** __________

## Prerequisites
- [ ] Logged in as admin
- [ ] At least one lead exists
- [ ] Dev server running (`npm run dev`)

---

## 1. List View
- [x] Visit `/admin/leads`
- [x] **Expected:** Leads table renders with columns: name, email, status, created date
- [x] Verify each row is clickable and navigates to lead detail

---

## 2. Kanban View
- [x] Click "Board" toggle
- [x] **Expected:** Leads grouped by status (new, contacted, converted, closed)

### 2.1 Drag-and-Drop
- [x] Drag a lead card from "new" column to "contacted" column
- [x] **Expected:** Card moves immediately (optimistic update)
- [x] **Expected:** Status badge on card updates to "contacted"
- [x] Refresh the page (Cmd+R)
- [x] **Expected:** Lead remains in "contacted" column after refresh
- [x] Check database: `SELECT status FROM leads WHERE id = '<lead_id>'`
- [x] **Expected:** Database shows `status = 'contacted'`

### 2.2 Error Handling
- [x] Disconnect network / pause Supabase
- [x] Drag a lead to another column
- [x] **Expected:** Either reverts OR shows error notification (not silent failure)
  - *Observed: Redirects to login page (auth check fails without network) — acceptable, not silent*

---

## 3. Create Lead (Internal)
- [x] Click "New Lead" button
- [x] Enter: name, email (required), optional fields
- [x] Click Save

### 3.1 Auto-Refresh
- [x] **Expected:** New lead appears in list/kanban WITHOUT manual page refresh
  - *Fixed: Added onSuccess callback to trigger refetch*
- [x] **Expected:** New lead appears within 2 seconds of save
- [x] Verify lead is in "new" status column in kanban

### 3.2 Validation
- [x] Try to save without email
- [x] **Expected:** Form validation error shown
- [x] Try invalid email format (e.g., "notanemail")
- [x] **Expected:** Form validation error shown
  - *Fixed: Added email pattern validation + JS fallback*
- [x] Try duplicate email
- [x] **Expected:** Shows "A lead with this email already exists"
  - *Fixed: Added specific error message for 23505 constraint violation*

---

## 4. External Lead Submission (Website Integration)
- [ ] Open a new incognito/private browser window (not logged in)
- [ ] Navigate to the homepage `/` or wherever contact form lives
- [ ] Fill out contact form with: name, email, message
- [ ] Submit form

### 4.1 Success Case
- [ ] **Expected:** Success message shown to visitor
- [ ] Switch to admin session
- [ ] Visit `/admin/leads`
- [ ] **Expected:** New lead from external submission appears in list
- [ ] **Expected:** Lead has `source` field set (if applicable)

### 4.2 API Route Test (if using API)
- [ ] Using curl/Postman, POST to `/api/leads`:
  ```bash
  curl -X POST http://localhost:3000/api/leads \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Lead","email":"test@example.com","message":"From API"}'
  ```
- [ ] **Expected:** Returns 201 with lead ID
- [ ] **Expected:** Lead appears in admin dashboard

### 4.3 Validation
- [ ] POST to `/api/leads` without email
- [ ] **Expected:** Returns 400 with validation error
- [ ] POST with invalid email format
- [ ] **Expected:** Returns 400 with validation error

---

## 5. Lead Detail Page
- [ ] Click on a lead in the list
- [ ] **Expected:** Lead detail page loads at `/admin/leads/[id]`
- [ ] **Expected:** No "Lead Tasks" button visible (removed in Stage 0)
- [ ] **Expected:** "Add Internal Note" section visible
- [ ] **Expected:** "Internal Timeline" section visible
- [ ] Add an internal note
- [ ] **Expected:** Note appears in timeline without refresh

---

## 6. Real-time Sync (Multi-tab)
- [ ] Open `/admin/leads` in two browser tabs
- [ ] In Tab 1: Create a new lead
- [ ] **Expected:** Tab 2 shows the new lead automatically (within 2-3 seconds)
- [ ] In Tab 1: Drag a lead to change status
- [ ] **Expected:** Tab 2 reflects the status change automatically

---

## Sign-off

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| List view renders | | |
| Kanban drag-drop works | | |
| Drag-drop persists after refresh | | |
| New lead auto-appears | | |
| External submission works | | |
| API validation works | | |
| Lead detail page correct | | |
| Real-time sync works | | |

- [ ] **All checks passed**
- [ ] Tester signature: __________
- [ ] Date completed: __________
