# Stage 6 Pre-Merge Manual Testing Checklist

**Feature:** Milestones + Change Requests Management
**PR Branch:** `claude/stage-6-plan-r8JpK`
**Date:** __________
**Tester:** __________

---

## Pre-Testing Requirements

### Database Setup
- [ ] Migration applied: `20260124000001_stage_6_milestones_change_requests.sql`
- [ ] Verify tables exist: `milestones`, `change_requests`
- [ ] RLS policies active for both tables

### Test Data Prerequisites
- [ ] At least one project exists in the system
- [ ] Logged in as an employee with access

---

## Part 1: Milestones Management

### 1.1 Navigation & Empty State
| Step | Expected Result | Pass |
|------|-----------------|------|
| Go to Admin > Projects > [any project] | Project detail page loads | [ ] |
| Click "Milestones" tab | Tab activates, milestones view shows | [ ] |
| (If empty) Check empty state | "No milestones yet" message displays | [ ] |
| Check summary cards | Shows: Total, Value, Invoiced, Remaining (all 0) | [ ] |

### 1.2 Create Milestone
| Step | Expected Result | Pass |
|------|-----------------|------|
| Click "Add Milestone" button | Dialog opens | [ ] |
| Enter title: "Design Phase" | Text appears in field | [ ] |
| Enter amount: 5000 | Amount appears, GST preview shows | [ ] |
| Set due date: 2 weeks from today | Date selected | [ ] |
| Leave status as "Planned" | Default selection | [ ] |
| Click "Create Milestone" | Dialog closes, milestone in list | [ ] |
| Verify GST display | Shows "+ $500.00 GST (10%)" | [ ] |
| Verify summary cards update | Total: 1, Value: $5,000 | [ ] |

### 1.3 Create Deposit Milestone
| Step | Expected Result | Pass |
|------|-----------------|------|
| Click "Add Milestone" | Dialog opens | [ ] |
| Title: "Project Deposit" | — | [ ] |
| Amount: 2500 | — | [ ] |
| Check "Deposit milestone" | Checkbox enabled | [ ] |
| Status: "Active" | — | [ ] |
| Create | Milestone shows with "Deposit" badge | [ ] |
| Verify status badge | "Active" (blue) | [ ] |

### 1.4 Edit Milestone
| Step | Expected Result | Pass |
|------|-----------------|------|
| Click ⋮ menu on any milestone | Dropdown appears | [ ] |
| Select "Edit" | Edit dialog opens with current values | [ ] |
| Change amount to 6000 | Amount updates | [ ] |
| Add description: "Updated scope" | Text entered | [ ] |
| Click "Save Changes" | Dialog closes, values updated | [ ] |

### 1.5 Mark Milestone Complete
| Step | Expected Result | Pass |
|------|-----------------|------|
| Click ⋮ menu on non-complete milestone | — | [ ] |
| Select "Mark Complete" | Confirmation dialog appears | [ ] |
| Confirm action | Status changes to "Complete" (green) | [ ] |

### 1.6 Completion Idempotency
| Step | Expected Result | Pass |
|------|-----------------|------|
| Check ⋮ menu on complete milestone | "Mark Complete" should not appear | [ ] |
| (Or if it appears) Click it | No duplicate action, same state | [ ] |

### 1.7 Delete Milestone
| Step | Expected Result | Pass |
|------|-----------------|------|
| Click ⋮ > "Delete" | Confirmation dialog appears | [ ] |
| Confirm deletion | Milestone removed from list | [ ] |
| Verify summary cards | Counts and totals decrease | [ ] |

### 1.8 Status Badge Colors
| Status | Expected Color | Pass |
|--------|----------------|------|
| Planned | Gray | [ ] |
| Active | Blue | [ ] |
| Complete | Green | [ ] |
| Invoiced | Purple (when Stage 5 integrates) | [ ] |

---

## Part 2: Change Requests Management

### 2.1 Navigation & Empty State
| Step | Expected Result | Pass |
|------|-----------------|------|
| Click "Change Requests" tab | Tab activates | [ ] |
| (If empty) Check empty state | "No change requests yet" message | [ ] |
| Check summary cards | Total, Awaiting Signature, Approved Value, Total Value | [ ] |

### 2.2 Create Draft Change Request
| Step | Expected Result | Pass |
|------|-----------------|------|
| Click "New Change Request" | Dialog opens | [ ] |
| Title: "Additional Landing Page" | Text entered | [ ] |
| Description: "Marketing campaign page" | Text entered | [ ] |
| Amount: 1500 | Amount entered | [ ] |
| Click "Create Draft" | Dialog closes, CR in list | [ ] |
| Verify status | "Draft" badge (gray) | [ ] |
| Verify GST display | "+ $150.00 GST" | [ ] |

### 2.3 Edit Draft Change Request
| Step | Expected Result | Pass |
|------|-----------------|------|
| Click ⋮ > "Edit" on draft CR | Edit dialog opens | [ ] |
| Change amount to 2000 | Amount updates | [ ] |
| Save | Values updated in list | [ ] |

### 2.4 Send for Signature
| Step | Expected Result | Pass |
|------|-----------------|------|
| Click ⋮ > "Send for Signature" | Confirmation appears | [ ] |
| Confirm | Status changes to "Awaiting Signature" (yellow) | [ ] |
| Check summary cards | "Awaiting Signature" count increases | [ ] |

### 2.5 Copy Portal Link
| Step | Expected Result | Pass |
|------|-----------------|------|
| Click ⋮ > "Copy Portal Link" on sent CR | Link copied to clipboard | [ ] |
| "Copied!" feedback | Brief confirmation shown | [ ] |
| Verify link format | `/portal/change-request/[token]` | [ ] |

### 2.6 Archive Change Request
| Step | Expected Result | Pass |
|------|-----------------|------|
| Click ⋮ > "Archive" | — | [ ] |
| Confirm | CR marked as archived / removed from active list | [ ] |

### 2.7 Delete Draft Only
| Step | Expected Result | Pass |
|------|-----------------|------|
| Create a new draft CR | Draft created | [ ] |
| Click ⋮ > "Delete" | Confirmation dialog | [ ] |
| Confirm | Draft deleted | [ ] |
| Verify sent CRs | "Delete" option not available | [ ] |

### 2.8 Status Badge Colors
| Status | Expected Color | Pass |
|--------|----------------|------|
| Draft | Gray | [ ] |
| Awaiting Signature (sent) | Yellow | [ ] |
| Signed | Green | [ ] |
| Rejected | Red | [ ] |
| Archived | Slate/Gray | [ ] |

---

## Part 3: Global Search Integration

### 3.1 Search for Milestone
| Step | Expected Result | Pass |
|------|-----------------|------|
| Create milestone: "QA Testing Phase" | Milestone created | [ ] |
| Open global search (Cmd/Ctrl + K) | Search modal opens | [ ] |
| Search "QA Testing" | Milestone appears in results | [ ] |
| Check result group | "Milestones" section | [ ] |
| Check subtitle | Shows project name and amount | [ ] |
| Click result | Navigates to project with milestones tab | [ ] |

### 3.2 Search for Change Request
| Step | Expected Result | Pass |
|------|-----------------|------|
| Create CR: "Database Upgrade Work" | CR created | [ ] |
| Search "Database Upgrade" | CR appears in results | [ ] |
| Check result group | "Change Requests" section | [ ] |
| Check subtitle | Shows project name and amount | [ ] |
| Click result | Navigates to project with change-requests tab | [ ] |

---

## Part 4: GST Calculations

| Test Amount | Expected GST (10%) | Total with GST | Pass |
|-------------|-------------------|----------------|------|
| $1,000.00 | $100.00 | $1,100.00 | [ ] |
| $5,000.00 | $500.00 | $5,500.00 | [ ] |
| $1,234.56 | $123.46 | $1,358.02 | [ ] |

---

## Part 5: Known Limitations (Stage 6)

### Portal Signing Page
> **Note:** The portal signing page (`/portal/change-request/[token]`) is NOT implemented in this PR.

The following tests **cannot be completed** in Stage 6:
- [ ] Client signs change request via portal
- [ ] Client rejects change request via portal
- [ ] Milestone auto-creation on signature
- [ ] Signer information capture

**Recommendation:** Document as follow-up work or add portal page before merge.

### Invoice Integration
> **Note:** Invoice creation is deferred until Stage 5 (Xero integration) is complete.

- [ ] Auto-create draft invoice on milestone complete → Deferred
- [ ] Link milestone to invoice → Deferred

---

## Edge Cases

### Validation
- [ ] Cannot create milestone without title (button disabled)
- [ ] Cannot create milestone without amount (button disabled)
- [ ] Cannot create CR without title (button disabled)
- [ ] Cannot create CR without amount (button disabled)

### Large Numbers
- [ ] $1,000,000 milestone displays correctly with commas
- [ ] $999,999.99 CR displays correctly

### Empty/Null Handling
- [ ] Milestone with no description saves successfully
- [ ] Milestone with no due date saves successfully
- [ ] CR with no description saves successfully

---

## Test Summary

| Section | Total Tests | Passed | Failed |
|---------|-------------|--------|--------|
| Milestones Navigation & CRUD | 8 | | |
| Change Requests Navigation & CRUD | 8 | | |
| Global Search | 2 | | |
| GST Calculations | 3 | | |
| Edge Cases | 6 | | |
| **TOTAL** | **27** | | |

---

## Sign-off

### Pre-Merge Checklist
- [ ] All automated tests pass (`npm test`)
- [ ] All manual tests above pass (excluding known limitations)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] Migration applied to test database

### Approval
- [ ] Code review complete
- [ ] Manual testing complete
- [ ] Ready to merge to main

**Tester Signature:** __________
**Date:** __________

---

## Notes
_Add any observations, bugs found, or suggestions below:_



---

*Generated: Stage 6 PR Review*
