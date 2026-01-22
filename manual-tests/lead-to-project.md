# Manual Testing Checklist — Lead to Project Conversion

**Feature:** Lead to Client + Project conversion (Stage 1)
**Date:** __________
**Tester:** __________

## Prerequisites
- [ ] Logged in as admin/employee
- [ ] Migration 20260123000001_stage_1_lead_to_project.sql applied
- [ ] At least one lead with name AND email in the system
- [ ] At least one lead WITHOUT email (for error testing)

---

## 1. Conversion Modal UI

### 1.1 Open Modal
- [ ] Navigate to lead detail page (`/admin/leads/{id}`)
- [ ] **Expected:** "Convert to Project" button visible
- [ ] Click "Convert to Project" button
- [ ] **Expected:** Modal opens with form fields

### 1.2 Form Defaults
- [ ] **Expected:** Project name pre-filled from lead name (or company - lead name format)
- [ ] **Expected:** Project type defaults to "Web"
- [ ] **Expected:** Project status defaults to "Planning"
- [ ] **Expected:** Owner field shows employee dropdown

---

## 2. Conversion - New Client

### 2.1 Convert Lead (No Existing Client)
- [ ] Enter project name (or keep default)
- [ ] Select project type
- [ ] Select project status
- [ ] (Optional) Assign an owner
- [ ] Click "Convert Lead"
- [ ] **Expected:** Success - redirected to new project page

### 2.2 Verify Client Created
- [ ] Navigate to `/admin/clients`
- [ ] **Expected:** New client appears with lead's name and email

### 2.3 Verify Project Created
- [ ] Navigate to `/admin/projects`
- [ ] **Expected:** New project appears with entered details
- [ ] **Expected:** Project linked to the new client

### 2.4 Verify Lead Updated
- [ ] Navigate to `/admin/leads` (default view)
- [ ] **Expected:** Converted lead is NOT shown (hidden by default)
- [ ] Toggle "Show archived" switch
- [ ] **Expected:** Converted lead appears with "Converted" badge
- [ ] Click on the converted lead
- [ ] **Expected:** Lead detail shows:
  - Archived badge
  - Converted badge (green)
  - "Conversion Info" section with date
  - "View Client" link (works)
  - "View Project" link (works)

---

## 3. Conversion - Existing Client

### 3.1 Setup
- [ ] Create a new lead with SAME email as an existing client

### 3.2 Convert Lead (Client Email Matches)
- [ ] Open this lead's detail page
- [ ] Click "Convert to Project"
- [ ] Fill in project details
- [ ] Click "Convert Lead"
- [ ] **Expected:** Success message mentions "Linked to existing client"

### 3.3 Verify
- [ ] **Expected:** NO duplicate client created
- [ ] **Expected:** New project linked to existing client
- [ ] **Expected:** Lead archived and linked to existing client

---

## 4. Conversion Validation Errors

### 4.1 Lead Without Email
- [ ] Create or find a lead without an email address
- [ ] Open lead detail page
- [ ] Click "Convert to Project"
- [ ] **Expected:** Error message "Lead must have an email to convert"

### 4.2 Lead Without Name
- [ ] (If possible) Find a lead without a name
- [ ] **Expected:** Error message "Lead must have a name to convert"

### 4.3 Already Converted Lead
- [ ] Toggle "Show archived" and find a converted lead
- [ ] Open the converted lead detail
- [ ] **Expected:** "Convert to Project" button is NOT shown

---

## 5. Archived Leads Filtering

### 5.1 Default View
- [ ] Navigate to `/admin/leads`
- [ ] **Expected:** Only active (non-archived) leads shown
- [ ] **Expected:** "Show archived" toggle is OFF
- [ ] **Expected:** Card title shows "Active Leads"

### 5.2 Toggle Archived
- [ ] Click "Show archived" toggle
- [ ] **Expected:** Only archived leads shown
- [ ] **Expected:** Card title shows "Archived Leads"
- [ ] **Expected:** URL updates to `?archived=true`

### 5.3 Toggle Back
- [ ] Click toggle again to turn off
- [ ] **Expected:** Returns to active leads view
- [ ] **Expected:** URL parameter removed

### 5.4 Direct URL Access
- [ ] Navigate directly to `/admin/leads?archived=true`
- [ ] **Expected:** Archived leads shown, toggle is ON

### 5.5 Kanban View
- [ ] Switch to Kanban view (Board button)
- [ ] **Expected:** Filter still applies to kanban
- [ ] Toggle archived on/off
- [ ] **Expected:** Kanban updates to show correct leads

---

## 6. Edge Cases

### 6.1 Case-Insensitive Email Match
- [ ] Create lead with email "TEST@example.com"
- [ ] Ensure client exists with email "test@example.com"
- [ ] Convert lead
- [ ] **Expected:** Links to existing client (case-insensitive match)

### 6.2 Cancelled Conversion
- [ ] Open conversion modal
- [ ] Click "Cancel" button
- [ ] **Expected:** Modal closes, no changes made
- [ ] **Expected:** Lead still appears in active list

---

## Sign-off

- [ ] All checks passed
- [ ] Any issues documented below
- [ ] Tester signature: __________

### Issues Found
(Document any issues here)

---

*Checklist version: Stage 1*
*Last updated: 2026-01-23*
