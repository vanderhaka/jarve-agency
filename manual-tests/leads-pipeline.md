# Manual Testing Checklist — Leads Pipeline

**Feature:** Leads List + Kanban
**Date:** __________
**Tester:** __________

## Prerequisites
- [ ] Logged in as admin
- [ ] At least one lead exists

## 1. List View
- [ ] Visit `/app/leads`
- [ ] **Expected:** Leads table renders
- [ ] Verify each row shows name, email, status, created date

## 2. Kanban View
- [ ] Click “Board”
- [ ] **Expected:** Leads grouped by status
- [ ] Drag a lead to another column
- [ ] **Expected:** Status updates and persists after refresh

## 3. Create Lead
- [ ] Click “New Lead”
- [ ] Enter name + email
- [ ] Save
- [ ] **Expected:** Lead appears in list and board

## Sign-off
- [ ] All checks passed
- [ ] Tester signature: __________
