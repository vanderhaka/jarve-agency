# Manual Testing Checklist — Agency Settings

**Feature:** Agency Settings & Defaults
**Date:** __________
**Tester:** __________

## Prerequisites
- [ ] Logged in as admin
- [ ] Settings page reachable

## 1. Basics
- [ ] Open settings page
- [ ] **Expected:** Agency settings section is visible

## 2. GST + Currency Defaults
- [ ] GST shows 10% (fixed, read-only)
- [ ] Set currency to AUD
- [ ] Set timezone to Australia/Adelaide
- [ ] Save
- [ ] **Expected:** Values persist after refresh

## 3. Deposit Defaults
- [ ] Set default deposit to 50%
- [ ] Save
- [ ] **Expected:** New project uses 50% deposit by default

## 4. Timesheet Lock Schedule
- [ ] Set weekly lock day/time
- [ ] Save
- [ ] **Expected:** Lock schedule persists after refresh

## 5. Invoice Defaults
- [ ] Set invoice prefix and default terms
- [ ] Save
- [ ] **Expected:** Defaults appear on new invoice draft (Xero sync)

## Sign-off
- [ ] All checks passed
- [ ] Tester signature: __________
