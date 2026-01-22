# Manual Testing Checklist — Proposals & Contracts (MSA + SOW)

**Feature:** Proposal builder + signing
**Date:** __________
**Tester:** __________

## Prerequisites
- [ ] Logged in as admin
- [ ] Lead exists
- [ ] Client portal access available

## 1. Create Proposal Draft
- [ ] Create a proposal from a lead
- [ ] Add sections + pricing
- [ ] Save
- [ ] **Expected:** Draft appears in Docs Vault with version 1

## 2. Versioning
- [ ] Edit proposal and save
- [ ] **Expected:** Version increments
- [ ] **Expected:** Both versions visible

## 3. Client View + Sign
- [ ] Send proposal to client portal
- [ ] Client opens proposal
- [ ] Client draws signature + submits
- [ ] **Expected:** Proposal status = signed
- [ ] **Expected:** SOW PDF stored in Docs Vault
- [ ] **Expected:** Project cannot move to Active until MSA + SOW signed

## 4. MSA (One-Time)
- [ ] Create MSA for client
- [ ] Client signs
- [ ] **Expected:** MSA appears in Docs Vault and is locked

## Sign-off
- [ ] All checks passed
- [ ] Tester signature: __________
