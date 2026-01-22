# Manual Testing Checklist — Client Portal

**Feature:** Client portal access, docs, chat, uploads
**Date:** __________
**Tester:** __________

## Prerequisites
- [ ] Client user created
- [ ] Access link issued
- [ ] At least two projects and one document exist

## 1. Access Link
- [ ] Send access link email to the client user
- [ ] **Expected:** Email received with portal link
- [ ] Open client access link
- [ ] **Expected:** Client portal loads without password
- [ ] **Expected:** Link remains valid after logout/login

## 2. Docs Vault
- [ ] Open Docs section
- [ ] **Expected:** Contracts + invoices visible
- [ ] **Expected:** Proposal drafts + versions visible
- [ ] Download a doc
- [ ] **Expected:** Download succeeds and is logged

## 3. Chat (Per Project)
- [ ] Open Project A chat
- [ ] Post a message
- [ ] **Expected:** Message appears with timestamp
- [ ] Switch to Project B chat
- [ ] **Expected:** Project A messages are not shown here

## 4. Uploads
- [ ] Upload a file in Client Uploads
- [ ] **Expected:** File appears in uploads list
- [ ] **Expected:** You receive in-app notification

## 5. Access Revocation
- [ ] Revoke the access link
- [ ] **Expected:** Link no longer works

## Sign-off
- [ ] All checks passed
- [ ] Tester signature: __________
