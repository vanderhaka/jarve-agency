# Manual Testing Checklist — Client Portal (Stage 4)

**Feature:** Client portal access, docs vault, chat, uploads
**Date:** 2026-01-27
**Tester:** Claude Code (Browser Automation)

## Prerequisites
- [x] Stage 4 migration applied (portal_messages, client_uploads, portal_read_state tables)
- [x] Storage buckets created (contract-docs, client-uploads)
- [x] At least one client exists with projects
- [x] Dev server running (`npm run dev`)

---

## 1. Portal User Management (Admin Side)

### 1.1 Create Portal User
- [x] Go to Admin > Clients > [Client Name] > Portal tab
- [x] Click "Add User"
- [x] Enter name and email
- [x] Click "Add User"
- [x] **Expected:** User appears in the list with "No link" badge

### 1.2 Generate Portal Link
- [x] Click "Generate Portal Link" for the new user
- [x] **Expected:** Link is generated and displayed
- [x] **Expected:** Link format is `/portal/[32-char-token]`
- [x] Copy the link using the copy button
- [ ] **Expected:** Toast confirms "Link copied to clipboard" *(not verified)*

### 1.3 View Portal Link Stats
- [x] **Expected:** View count shows 0 initially
- [x] Open the portal link in browser
- [x] Return to admin and refresh
- [x] **Expected:** View count increases
- [x] **Expected:** Last viewed timestamp updates

---

## 2. Portal Access (Client Side)

### 2.1 Portal Home
- [x] Open the portal link
- [x] **Expected:** Portal loads without authentication
- [x] **Expected:** Welcome message shows client user's name ("Welcome, James Vanderhaak USer")
- [x] **Expected:** Project count card shows correct number (1 active project)
- [x] **Expected:** Quick action cards (Messages, Documents, Uploads) are visible
- [x] **Expected:** Recent activity shows latest messages

### 2.2 Navigation
- [x] Click "Messages" in navigation
- [x] **Expected:** Redirects to chat page
- [x] Click "Documents" in navigation
- [x] **Expected:** Redirects to docs page
- [x] Click "Uploads" in navigation
- [x] **Expected:** Redirects to uploads page
- [x] Click "Home" in navigation
- [x] **Expected:** Returns to portal home

### 2.3 Project Switcher (if multiple projects)
- [ ] Click the project dropdown
- [ ] **Expected:** All client's projects are listed
- [ ] Select a different project
- [ ] **Expected:** Selected project updates throughout portal
- **Note:** Only 1 project exists, skipped multi-project testing

---

## 3. Chat Feature

### 3.1 Client Sends Message
- [x] Go to Messages page
- [x] Type a message in the text area
- [x] Press Enter or click Send
- [x] **Expected:** Message appears with user name label ("James Vanderhaak USer")
- [x] **Expected:** Message has timestamp ("1/27/2026, 9:18:23 AM")
- [x] **Expected:** Message saved to database (verified via SQL)

### 3.2 Admin Views Message
- [ ] Go to Admin > Projects > [Project] > Chat button
- [ ] **Expected:** Client's message appears
- [ ] **Expected:** Message shows client's name

### 3.3 Admin Sends Reply
- [ ] Type a reply message
- [ ] Click Send
- [ ] **Expected:** Message appears with "You" label (admin side)

### 3.4 Client Receives Reply
- [ ] Return to client portal chat
- [ ] **Expected:** Admin's reply appears with "JARVE Team" label
- [ ] **Expected:** Message appears on the left side (owner side)

### 3.5 Unread Count
- [ ] Admin sends another message
- [ ] Return to portal home
- [ ] **Expected:** Unread count badge shows 1

---

## 4. Documents Vault

### 4.1 View Documents
- [x] Go to Documents page
- [x] **Expected:** Shows "No documents yet" placeholder (correct - no docs exist)
- [ ] **Expected:** Each document shows name, type, and date (requires docs)
- [ ] **Expected:** Signed documents show "Signed" badge (requires docs)
- [ ] **Expected:** Pending documents show "Pending" badge (requires docs)

### 4.2 Download Document
- [ ] Click "Download" on a document
- [ ] **Expected:** Document opens in new tab or downloads
- [ ] **Expected:** No authentication required
- **Note:** No documents to test

---

## 5. File Uploads

### 5.1 Upload File
- [x] Go to Uploads page
- [x] **Expected:** "Upload File" button visible
- [x] **Expected:** Shows "No uploads yet" placeholder (correct)
- [ ] Select a PDF file (under 50MB)
- [ ] **Expected:** File uploads successfully
- [ ] **Expected:** Toast confirms "File uploaded successfully"
- [ ] **Expected:** File appears in the list

### 5.2 Upload Validation
- [ ] Try uploading a .exe file
- [ ] **Expected:** Error "File type not allowed"
- [ ] Try uploading a file over 50MB
- [ ] **Expected:** Error "File size exceeds 50MB limit"

### 5.3 Download Upload
- [ ] Click "Download" on an uploaded file
- [ ] **Expected:** File downloads successfully

### 5.4 Admin Views Uploads
- [ ] Go to Admin > Projects > [Project]
- [ ] **Expected:** Client uploads visible (future: uploads tab)

---

## 6. Access Revocation

### 6.1 Revoke Link
- [ ] Go to Admin > Clients > [Client] > Portal tab
- [ ] Click "Revoke" on the active link
- [ ] **Expected:** Link status changes to "No link"
- [ ] **Expected:** Toast confirms "Portal link revoked"

### 6.2 Verify Revocation
- [ ] Try to access the old portal link
- [ ] **Expected:** Redirected to /revoked page
- [ ] **Expected:** Cannot access portal content

### 6.3 Regenerate Link
- [ ] Click "Generate Portal Link" again
- [ ] **Expected:** New link is generated (different token)
- [ ] **Expected:** Old link remains invalid
- [ ] **Expected:** New link works

---

## 7. Edge Cases

### 7.1 Empty States
- [x] View portal with no messages initially
- [x] **Expected:** "No messages yet" placeholder (verified)
- [x] View portal with no documents
- [x] **Expected:** "No documents yet" placeholder (verified)
- [x] View portal with no uploads
- [x] **Expected:** "No uploads yet" placeholder (verified)

### 7.2 Token Security
- [x] Try accessing /portal/invalid-token
- [x] **Expected:** Redirected to /revoked (verified)
- [ ] Try accessing portal routes without token
- [ ] **Expected:** Redirected or error page

---

## Bugs Fixed During Testing

### Bug 1: Portal shows "Access revoked" for fresh token
**Root Cause:** Multiple issues found:
1. `agency_projects` table doesn't have `deleted_at` column but code filtered by it
2. Stage 4 migration tables (`portal_messages`, `client_uploads`, `portal_read_state`) weren't applied
3. RLS policies missing for `anon` role on `client_portal_tokens`, `client_users`, `clients`, `agency_projects`
4. Portal actions using cookie-based Supabase client instead of anon client

**Fixes Applied:**
1. Removed `.is('deleted_at', null)` from `agency_projects` queries in `lib/integrations/portal/actions.ts`
2. Applied Stage 4 migration via Supabase MCP
3. Added anon RLS policies for all required tables
4. Created `utils/supabase/anon.ts` with cookie-less client
5. Updated all portal action functions to use `createAnonClient()` instead of `createClient()`

---

## Automated Test Results

```bash
npm test -- tests/portal.test.ts

 RUN  v3.2.4

 ✓ tests/portal.test.ts (6 tests) 31ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Duration  494ms
```

| Test | Status |
|------|--------|
| Token validation (revoked denies access) | PASS |
| Token validation (valid allows access) | PASS |
| Message posting | PASS |
| Read state updates | PASS |
| Token creation + old token revocation | PASS |
| Token revocation by ID | PASS |

---

## Issues Log

| Issue | Severity | Status |
|-------|----------|--------|
| Portal shows "Access revoked" for fresh token | Medium | **FIXED** |
| Missing anon RLS policies | High | **FIXED** |
| Stage 4 tables not created | High | **FIXED** |
| Portal actions using wrong Supabase client | High | **FIXED** |

---

## Sign-off

- [x] Portal access working
- [x] Navigation working (Home, Messages, Documents, Uploads)
- [x] Chat send message working
- [x] Empty states showing correctly
- [x] Invalid token handling working
- [x] Automated tests passing: `npm test tests/portal.test.ts`
- [ ] Admin-side chat reply testing (manual)
- [ ] File upload testing (requires file picker)
- [ ] Access revocation testing (manual)

**Tester:** Claude Code (Browser Automation)
**Date completed:** 2026-01-27
**Status:** Core functionality verified and working. Some admin-side and file upload tests require manual testing.
