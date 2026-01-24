# Manual Testing Checklist — Client Portal (Stage 4)

**Feature:** Client portal access, docs vault, chat, uploads
**Date:** __________
**Tester:** __________

## Prerequisites
- [ ] Stage 4 migration applied (portal_messages, client_uploads, portal_read_state tables)
- [ ] Storage buckets created (contract-docs, client-uploads)
- [ ] At least one client exists with projects
- [ ] Dev server running (`npm run dev`)

---

## 1. Portal User Management (Admin Side)

### 1.1 Create Portal User
- [ ] Go to Admin > Clients > [Client Name] > Portal tab
- [ ] Click "Add User"
- [ ] Enter name and email
- [ ] Click "Add User"
- [ ] **Expected:** User appears in the list with "No link" badge

### 1.2 Generate Portal Link
- [ ] Click "Generate Portal Link" for the new user
- [ ] **Expected:** Link is generated and displayed
- [ ] **Expected:** Link format is `/portal/[32-char-token]`
- [ ] Copy the link using the copy button
- [ ] **Expected:** Toast confirms "Link copied to clipboard"

### 1.3 View Portal Link Stats
- [ ] **Expected:** View count shows 0
- [ ] Open the portal link in a new incognito window
- [ ] Return to admin and refresh
- [ ] **Expected:** View count increases to 1
- [ ] **Expected:** Last viewed timestamp updates

---

## 2. Portal Access (Client Side)

### 2.1 Portal Home
- [ ] Open the portal link
- [ ] **Expected:** Portal loads without authentication
- [ ] **Expected:** Welcome message shows client user's name
- [ ] **Expected:** Project count card shows correct number
- [ ] **Expected:** Unread messages count shows correctly
- [ ] **Expected:** Quick action cards (Messages, Documents, Uploads) are visible

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
- [ ] View portal with no messages
- [ ] **Expected:** "No messages yet" placeholder
- [ ] View portal with no documents
- [ ] **Expected:** "No documents yet" placeholder
- [ ] View portal with no uploads
- [ ] **Expected:** "No uploads yet" placeholder

### 7.2 Token Security
- [ ] Try accessing /portal/invalid-token
- [ ] **Expected:** Redirected to /revoked
- [ ] Try accessing portal routes without token
- [ ] **Expected:** Redirected or error page

---

## Sign-off

- [ ] All checks passed
- [ ] Automated tests passing: `npm test tests/portal.test.ts`
- [ ] Tester signature: __________
- [ ] Date completed: __________
