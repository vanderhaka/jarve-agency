# Manual Testing Checklist — Client Portal (Stage 4)

**Feature:** Client portal access, docs vault, chat, uploads
**Date:** 2026-01-27
**Tester:** Claude Code (Browser Automation) + Manual

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
- **Note:** Browser automation had intermittent issues with dialog submit. User created manually.

### 1.2 Generate Portal Link
- [x] Click "Generate Portal Link" for the new user
- [x] **Expected:** Link is generated and displayed
- [x] **Expected:** Link format is `/portal/[32-char-token]`
- [x] Copy the link using the copy button
- [ ] **Expected:** Toast confirms "Link copied to clipboard" *(not verified)*

### 1.3 View Portal Link Stats
- [x] **Expected:** View count shows 0
- [ ] Open the portal link in a new incognito window
- [ ] Return to admin and refresh
- [ ] **Expected:** View count increases to 1
- [ ] **Expected:** Last viewed timestamp updates
- **Note:** Portal access blocked - see Section 2 issue.

---

## 2. Portal Access (Client Side)

### 2.1 Portal Home
- [x] Open the portal link
- [ ] **Expected:** Portal loads without authentication
- [ ] **Expected:** Welcome message shows client user's name
- [ ] **Expected:** Project count card shows correct number
- [ ] **Expected:** Unread messages count shows correctly
- [ ] **Expected:** Quick action cards (Messages, Documents, Uploads) are visible

**ISSUE FOUND:** Portal shows "Access revoked" page for fresh token.
- Database verified: Token exists, NOT revoked (revoked_at = null)
- Database verified: Client user exists and is linked correctly
- Database verified: Client "Test Client Corp" has 1 project
- **Possible cause:** Token character mismatch (O vs 0) in URL display
- **Recommendation:** Verify token encoding, use monospace font in UI

### 2.2 Navigation
- [ ] Click "Messages" in navigation
- [ ] **Expected:** Redirects to chat page
- [ ] Click "Documents" in navigation
- [ ] **Expected:** Redirects to docs page
- [ ] Click "Uploads" in navigation
- [ ] **Expected:** Redirects to uploads page
- [ ] Click "Home" in navigation
- [ ] **Expected:** Returns to portal home

### 2.3 Project Switcher (if multiple projects)
- [ ] Click the project dropdown
- [ ] **Expected:** All client's projects are listed
- [ ] Select a different project
- [ ] **Expected:** Selected project updates throughout portal

---

## 3. Chat Feature

### 3.1 Client Sends Message
- [ ] Go to Messages page
- [ ] Type a message in the text area
- [ ] Press Enter or click Send
- [ ] **Expected:** Message appears with "You" label
- [ ] **Expected:** Message has timestamp
- [ ] **Expected:** Message appears on the right side (client side)

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
- [ ] Go to Documents page
- [ ] **Expected:** Contract documents are listed (if any exist)
- [ ] **Expected:** Each document shows name, type, and date
- [ ] **Expected:** Signed documents show "Signed" badge
- [ ] **Expected:** Pending documents show "Pending" badge

### 4.2 Download Document
- [ ] Click "Download" on a document
- [ ] **Expected:** Document opens in new tab or downloads
- [ ] **Expected:** No authentication required

---

## 5. File Uploads

### 5.1 Upload File
- [ ] Go to Uploads page
- [ ] Click "Upload File"
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
- [x] Try to access the old portal link
- [x] **Expected:** Redirected to /revoked page *(verified - but for wrong reason)*
- [ ] **Expected:** Cannot access portal content

### 6.3 Regenerate Link
- [ ] Click "Generate Portal Link" again
- [ ] **Expected:** New link is generated (different token)
- [ ] **Expected:** Old link remains invalid
- [ ] **Expected:** New link works

---

## 7. Edge Cases

### 7.1 Empty States
- [ ] View portal with no messages
- [ ] **Expected:** "No messages yet" placeholder
- [ ] View portal with no documents
- [ ] **Expected:** "No documents yet" placeholder
- [ ] View portal with no uploads
- [ ] **Expected:** "No uploads yet" placeholder

### 7.2 Token Security
- [x] Try accessing /portal/invalid-token
- [x] **Expected:** Redirected to /revoked *(verified)*
- [ ] Try accessing portal routes without token
- [ ] **Expected:** Redirected or error page

---

## Automated Test Results

```bash
npm test -- tests/portal.test.ts

 RUN  v3.2.4

 ✓ tests/portal.test.ts (6 tests) 25ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Duration  603ms
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
| Portal shows "Access revoked" for fresh token | Medium | Open |
| Dialog submit button click fails in automation | Low | Workaround (manual) |

---

## Sign-off

- [ ] All checks passed
- [x] Automated tests passing: `npm test tests/portal.test.ts`
- [ ] Tester signature: __________
- [ ] Date completed: __________

**Partial completion:** Portal User Management and Link Generation verified. Portal access blocked by token issue - requires investigation before completing remaining tests.
