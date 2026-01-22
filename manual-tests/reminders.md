# Manual Testing Checklist — Reminders (In-App)

**Feature:** Date-based reminders
**Date:** __________
**Tester:** __________

## Prerequisites
- [ ] Scheduler/cron running
- [ ] Notifications UI exists

## 1. Task Overdue
- [ ] Create task with past due date
- [ ] Run scheduler
- [ ] **Expected:** In-app reminder created

## 2. Milestone Overdue
- [ ] Create milestone with past due date
- [ ] Run scheduler
- [ ] **Expected:** In-app reminder created

## 3. Invoice Overdue
- [ ] Create invoice with past due date (Xero sync)
- [ ] Run scheduler
- [ ] **Expected:** In-app reminder created

## 4. Proposal Pending
- [ ] Send proposal not signed after X days
- [ ] Run scheduler
- [ ] **Expected:** In-app reminder created

## 5. Change Request Pending
- [ ] Create change request not signed after X days
- [ ] Run scheduler
- [ ] **Expected:** In-app reminder created

## Sign-off
- [ ] All checks passed
- [ ] Tester signature: __________
