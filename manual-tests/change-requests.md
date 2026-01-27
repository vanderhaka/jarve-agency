# Manual Testing Checklist — Change Requests

**Feature:** Scope change requests with client signature
**Stage:** 6 - Milestones + Change Requests
**Date:** __________
**Tester:** __________

## Prerequisites
- [ ] Database migration applied (20260124000001_stage_6_milestones_change_requests.sql)
- [ ] At least one project exists in the system
- [ ] Logged in as an employee

---

## 1. Navigate to Change Requests Tab

### Steps
1. Go to Admin > Projects
2. Click on a project to open project details
3. Click on "Change Requests" tab

### Expected Results
- [ ] Change Requests tab is visible alongside Tasks and Milestones tabs
- [ ] Summary cards show: Total Requests, Awaiting Signature, Approved Value, Total Value
- [ ] Empty state message appears if no change requests exist

---

## 2. Create Draft Change Request

### Steps
1. Click "New Change Request" button
2. Enter title: "Additional Landing Page"
3. Enter description: "Add a dedicated landing page for the marketing campaign"
4. Enter amount: 1500
5. Click "Create Draft"

### Expected Results
- [ ] Dialog closes
- [ ] New change request appears in list with "Draft" status (gray badge)
- [ ] Shows:
  - Title: "Additional Landing Page"
  - Amount: $1,500.00
  - GST: + $150.00 GST
  - Created date
- [ ] Summary cards update (Total Requests: 1, Total Value: $1,500)

---

## 3. Edit Draft Change Request

### Steps
1. Click three-dot menu (⋮) on the draft change request
2. Select "Edit"
3. Change amount to 2000
4. Update description
5. Click "Save Changes"

### Expected Results
- [ ] Dialog closes
- [ ] Amount updates to $2,000.00
- [ ] GST updates to + $200.00 GST
- [ ] Total Value in summary updates

---

## 4. Send Change Request for Signature

### Steps
1. Click three-dot menu on draft change request
2. Select "Send for Signature"
3. Confirm the action

### Expected Results
- [ ] Confirmation dialog appears
- [ ] Status changes to "Awaiting Signature" (yellow badge)
- [ ] "Awaiting Signature" count in summary increases
- [ ] Portal link options appear in the menu

---

## 5. Copy Portal Link

### Steps
1. Click three-dot menu on a sent change request
2. Select "Copy Portal Link"

### Expected Results
- [ ] Link is copied to clipboard
- [ ] "Copied!" feedback shown briefly
- [ ] Link format: `/portal/change-request/[token]`

---

## 6. Preview Portal (Admin View)

### Steps
1. Click three-dot menu on sent change request
2. Select "Preview Portal"

### Expected Results
- [ ] Opens in new tab
- [ ] Shows change request details (title, description, amount)
- [ ] Note: Portal signing page may need to be built for full functionality

---

## 7. Client Signs Change Request (Portal Flow)

### Steps
1. Open the portal link (as client would)
2. Review change request details
3. Enter signer name
4. Enter signer email
5. Draw signature
6. Submit

### Expected Results
- [ ] Portal shows change request information
- [ ] Signature pad works
- [ ] After submission:
  - Status changes to "Signed" (green badge)
  - Signed date and signer info recorded
  - New milestone created with "CR: [title]" prefix
  - Awaiting Signature count decreases
  - Approved Value increases

---

## 8. Client Rejects Change Request (Portal Flow)

### Steps
1. Open a different sent change request portal link
2. Click "Reject" option
3. Enter rejection reason
4. Submit rejection

### Expected Results
- [ ] Status changes to "Rejected" (red badge)
- [ ] Rejection reason visible in request details
- [ ] Rejected date recorded
- [ ] Portal token revoked

---

## 9. Archive Change Request

### Steps
1. Click three-dot menu on a signed or rejected change request
2. Select "Archive"

### Expected Results
- [ ] Change request no longer appears in active list
- [ ] Counts and totals update to exclude archived item

---

## 10. Delete Draft Change Request

### Steps
1. Create a new draft change request
2. Click three-dot menu
3. Select "Delete"
4. Confirm deletion

### Expected Results
- [ ] Confirmation dialog appears
- [ ] After confirmation, change request is removed
- [ ] Note: Only drafts can be deleted (sent/signed cannot)

---

## 11. Verify Milestone Creation on Sign

### Steps
1. Send a change request with amount $3,000
2. Sign it via portal
3. Navigate to Milestones tab

### Expected Results
- [ ] New milestone exists with title "CR: [original title]"
- [ ] Milestone amount matches change request amount ($3,000)
- [ ] Milestone status is "Active"
- [ ] Milestone GST rate is 10%

---

## 12. Search Integration

### Steps
1. Create a change request with distinctive title "Database Upgrade Work"
2. Use global search (Cmd/Ctrl + K)
3. Search for "Database Upgrade"

### Expected Results
- [ ] Change request appears in search results under "Change Requests" group
- [ ] Shows project name and amount in subtitle
- [ ] Clicking navigates to project with change-requests tab active

---

## 13. GST Display Verification

### Steps
1. Create change request with amount $4,567.89
2. Observe GST calculation

### Expected Results
- [ ] Amount: $4,567.89
- [ ] GST: + $456.79 GST (10%)
- [ ] "Total with GST" shown in create/edit dialog: $5,024.68

---

## Status Workflow Summary

| From Status | Allowed Transitions |
|-------------|---------------------|
| Draft | → Sent, → Archived, → Delete |
| Sent | → Signed, → Rejected, → Archived |
| Signed | → Archived |
| Rejected | → Archived |
| Archived | (terminal state) |

---

## Edge Cases

### Empty State
- [ ] New project shows "No change requests yet" message
- [ ] "Create one when you need to charge for additional work" text visible

### Validation
- [ ] Cannot create without title (button disabled)
- [ ] Cannot create without amount (button disabled)
- [ ] Cannot send already-sent request

### Portal Token Security
- [ ] Expired tokens return error
- [ ] Already-signed tokens cannot be reused
- [ ] Token revoked after signing/rejection

---

## Sign-off

- [ ] CRUD operations work correctly
- [ ] Status workflow follows expected transitions
- [ ] Portal link generation works
- [ ] Milestone creation on sign works
- [ ] Search integration works
- [ ] GST calculations are accurate

**Tester Signature:** __________
**Date:** __________

---

## Notes
_Add any observations, bugs found, or suggestions below:_



---

*Stage 6 - Portal signing page (/portal/change-request/[token]) needs to be built for full client flow*
*Invoice integration (auto-create Xero draft on sign) deferred until Stage 5 complete*
