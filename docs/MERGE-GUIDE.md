# Parallel Development Merge Guide

This guide covers the safe merge process for Stages 3-7 when developed in parallel.

## Dependency Chain

```
Stage 2 (complete)
    ↓
Stage 3: Proposals + Contracts
    ↓
Stage 4: Client Portal
    ↓
Stage 5: Xero Integration
    ↓
Stage 6: Milestones + Change Requests
    ↓
Stage 7: Reminders
```

Each stage has explicit preconditions requiring the previous stage to be complete.

---

## Merge Order

**Must merge in order: 3 → 4 → 5 → 6 → 7**

Do not skip stages or merge out of order. Foreign key constraints and code dependencies will cause failures.

---

## Stage 3: Proposals + Contracts

### Creates (Other Stages Depend On)
- `proposals` table
- `proposal_versions` table
- `proposal_signatures` table
- `proposal_templates` table
- `contract_docs` table ← **Used by Stages 4, 5, 6**
- Portal signing view pattern ← **Reused by Stages 4, 6**

### Pre-Merge Checklist
- [ ] Branch is rebased on latest main (with Stage 2)
- [ ] All migrations apply cleanly
- [ ] `npm run test:run` passes
- [ ] `npm run build` succeeds

### Post-Merge Tests
- [ ] Create a proposal from a lead
- [ ] Create a proposal from a project
- [ ] Edit proposal (verify new version created)
- [ ] Send proposal to client
- [ ] Sign proposal in portal
- [ ] Verify signed proposal appears in contract_docs
- [ ] Create and sign MSA for a client
- [ ] Verify project cannot go Active without MSA + SOW

### Integration Points to Verify
```
proposals.lead_id → leads.id
proposals.client_id → clients.id
proposals.project_id → agency_projects.id
proposals.created_by → employees.id
contract_docs.client_id → clients.id
contract_docs.project_id → agency_projects.id
```

---

## Stage 4: Client Portal

### Depends On (From Stage 3)
- `contract_docs` table (lists signed documents)
- Portal token validation pattern
- Signing view components

### Creates (Other Stages Depend On)
- `portal_messages` table
- `client_uploads` table
- `portal_read_state` table
- Full portal UI ← **Stage 6 adds change request signing**

### Pre-Merge Checklist
- [ ] Branch is rebased on main (with Stage 3 merged)
- [ ] All migrations apply cleanly
- [ ] `npm run test:run` passes
- [ ] `npm run build` succeeds
- [ ] Resolve any conflicts in portal components

### Post-Merge Tests
- [ ] Access portal via client link
- [ ] View contract docs (should show Stage 3 signed docs)
- [ ] Post a chat message as client
- [ ] Post a chat message as admin
- [ ] Upload a file as client
- [ ] Verify read state tracking works
- [ ] Revoke portal link and verify access denied
- [ ] Regenerate portal link and verify access restored

### Integration Points to Verify
```
portal_messages.project_id → agency_projects.id
client_uploads.project_id → agency_projects.id
portal_read_state.project_id → agency_projects.id
Portal docs list queries contract_docs table
```

### Likely Conflicts
| File | Resolution |
|------|------------|
| Portal signing view | Stage 4 expands Stage 3's minimal view - keep Stage 4 changes |
| Client page | Merge both stages' additions |

---

## Stage 5: Xero Integration

### Depends On (From Stage 4)
- `contract_docs` table (stores invoice PDFs)
- Portal infrastructure (for future invoice viewing)

### Creates (Other Stages Depend On)
- `xero_settings` table
- `invoices` table ← **Stage 6 milestones reference this**
- `invoice_line_items` table
- `payments` table
- `createXeroInvoice()` action ← **Called by Stage 6**
- `clients.xero_contact_id` column

### Pre-Merge Checklist
- [ ] Branch is rebased on main (with Stage 4 merged)
- [ ] All migrations apply cleanly
- [ ] `npm run test:run` passes
- [ ] `npm run build` succeeds
- [ ] Xero API credentials configured in environment
- [ ] Stripe webhook secret configured in environment

### Post-Merge Tests
- [ ] Connect Xero OAuth flow
- [ ] Select Xero tenant
- [ ] Create draft invoice from project
- [ ] Verify invoice appears in Xero as Draft
- [ ] Sync invoice status from Xero
- [ ] Verify invoice PDF stored in contract_docs
- [ ] Mark invoice as paid
- [ ] Verify payment recorded in Xero
- [ ] Test Stripe webhook (if configured)

### Integration Points to Verify
```
invoices.client_id → clients.id
invoices.project_id → agency_projects.id
invoice_line_items.invoice_id → invoices.id
payments.invoice_id → invoices.id
Invoice PDFs → contract_docs entries
```

### Likely Conflicts
| File | Resolution |
|------|------------|
| Settings page | Add Xero section alongside existing settings |
| Project page | Add finance/invoices tab |
| lib/integrations/xero/client.ts | Stage 2 copied stub, Stage 5 has full implementation - keep Stage 5 |
| lib/integrations/stripe/client.ts | Stage 2 copied stub, Stage 5 has full implementation - keep Stage 5 |

---

## Stage 6: Milestones + Change Requests

### Depends On (From Stage 5)
- `invoices` table (milestones.invoice_id FK)
- `createXeroInvoice()` action (called on milestone complete)
- `contract_docs` table (stores signed change requests)

### Depends On (From Stage 3)
- Portal signing pattern (reused for change request signing)
- `proposal_signatures` pattern (reused for change request signatures)

### Creates (Other Stages Depend On)
- `milestones` table ← **Stage 7 checks for overdue**
- `change_requests` table ← **Stage 7 checks for overdue**

### Pre-Merge Checklist
- [ ] Branch is rebased on main (with Stage 5 merged)
- [ ] All migrations apply cleanly
- [ ] `npm run test:run` passes
- [ ] `npm run build` succeeds
- [ ] Resolve conflicts in portal signing components

### Post-Merge Tests
- [ ] Create milestone on a project
- [ ] Reorder milestones
- [ ] Complete milestone → verify Draft invoice created in Xero
- [ ] Complete same milestone again → verify no duplicate invoice (idempotent)
- [ ] Sign a proposal → verify deposit milestone auto-created
- [ ] Verify deposit invoice created with correct amount (proposal total × deposit %)
- [ ] Create change request
- [ ] Send change request to client
- [ ] Sign change request in portal
- [ ] Verify new milestone created from signed change request
- [ ] Verify change request invoice created
- [ ] Reject a change request with reason

### Integration Points to Verify
```
milestones.project_id → agency_projects.id
milestones.invoice_id → invoices.id
change_requests.project_id → agency_projects.id
Signed change requests → contract_docs entries
completeMilestone() → createXeroInvoice()
onProposalSigned() → creates milestone + invoice
```

### Likely Conflicts
| File | Resolution |
|------|------------|
| Project page | Add milestones tab alongside finance tab |
| Portal signing view | Add change request signing - merge carefully |
| Proposal actions | Add onProposalSigned hook |

---

## Stage 7: Reminders

### Depends On (From Stage 6)
- `milestones` table (checks for overdue)
- `change_requests` table (checks for overdue)

### Depends On (From Stage 5)
- `invoices` table (checks for overdue)

### Creates
- `notifications` table
- Cron job for daily reminders
- Notification UI (bell icon, dropdown)

### Pre-Merge Checklist
- [ ] Branch is rebased on main (with Stage 6 merged)
- [ ] All migrations apply cleanly
- [ ] `npm run test:run` passes
- [ ] `npm run build` succeeds

### Post-Merge Tests
- [ ] Verify notification table created
- [ ] Create overdue task → run cron → verify notification created
- [ ] Create overdue invoice → run cron → verify notification created
- [ ] Create overdue milestone → run cron → verify notification created
- [ ] Verify paid invoice does NOT create notification
- [ ] Verify completed task does NOT create notification
- [ ] Click notification → navigates to correct entity
- [ ] Mark notification as read
- [ ] Mark all notifications as read
- [ ] Verify duplicate notifications prevented (unique index)

### Integration Points to Verify
```
notifications.user_id → employees.id
Cron queries: tasks, milestones, invoices, change_requests
agency_settings.reminder_frequency used by cron
agency_settings.timezone used for overdue calculation
```

### Likely Conflicts
| File | Resolution |
|------|------------|
| App header/layout | Add notification bell icon |
| agency_settings usage | Ensure reminder fields are read correctly |

---

## Conflict Resolution Strategy

### Database Migrations

1. **Check migration timestamps** - Ensure they run in correct order
2. **Verify foreign keys** - Parent tables must exist before child tables
3. **Test rollback** - Each migration should be reversible

```bash
# Check migration order
ls -la supabase/migrations/

# Expected order (timestamps should increase):
# 20260123000001_stage_1_lead_to_project.sql
# 20260123000002_stage_2_agency_settings.sql
# 20260123000003_stage_3_proposals_contracts.sql
# 20260123000004_stage_4_client_portal.sql
# 20260123000005_stage_5_xero_integration.sql
# 20260123000006_stage_6_milestones.sql
# 20260123000007_stage_7_reminders.sql
```

### Code Conflicts

| Conflict Type | Strategy |
|---------------|----------|
| Same file, different sections | Merge both changes |
| Same file, same section | Later stage usually has more complete implementation |
| Import conflicts | Combine imports |
| Type conflicts | Use the more complete type definition |

### Common Files That Will Conflict

```
app/admin/settings/page.tsx          → Stages 5 (Xero section)
app/admin/projects/[id]/page.tsx     → Stages 3, 5, 6 (new tabs)
app/portal/[token]/page.tsx          → Stages 3, 4, 6 (signing + full portal)
components/project-tabs.tsx          → Stages 3, 5, 6 (new tabs)
lib/integrations/xero/client.ts      → Stage 2 stub vs Stage 5 full
lib/integrations/stripe/client.ts    → Stage 2 stub vs Stage 5 full
```

---

## Rollback Procedures

If a merge fails, rollback in reverse order:

### Stage 7 Rollback
```sql
DROP TABLE IF EXISTS notifications;
```

### Stage 6 Rollback
```sql
DROP TABLE IF EXISTS change_requests;
DROP TABLE IF EXISTS milestones;
```

### Stage 5 Rollback
```sql
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoice_line_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS xero_settings;
ALTER TABLE clients DROP COLUMN IF EXISTS xero_contact_id;
```

### Stage 4 Rollback
```sql
DROP TABLE IF EXISTS portal_read_state;
DROP TABLE IF EXISTS client_uploads;
DROP TABLE IF EXISTS portal_messages;
```

### Stage 3 Rollback
```sql
DROP TABLE IF EXISTS proposal_signatures;
DROP TABLE IF EXISTS proposal_versions;
DROP TABLE IF EXISTS proposal_templates;
DROP TABLE IF EXISTS proposals;
DROP TABLE IF EXISTS contract_docs;
```

---

## Quick Reference: Merge Commands

```bash
# 1. Ensure main is up to date
git checkout main
git pull origin main

# 2. Merge Stage 3
git merge stage-3-proposals --no-ff
npm run test:run
npm run build
git push origin main

# 3. Merge Stage 4 (after Stage 3)
git merge stage-4-portal --no-ff
# Resolve conflicts if any
npm run test:run
npm run build
git push origin main

# 4. Merge Stage 5 (after Stage 4)
git merge stage-5-xero --no-ff
# Resolve conflicts if any
npm run test:run
npm run build
git push origin main

# 5. Merge Stage 6 (after Stage 5)
git merge stage-6-milestones --no-ff
# Resolve conflicts if any
npm run test:run
npm run build
git push origin main

# 6. Merge Stage 7 (after Stage 6)
git merge stage-7-reminders --no-ff
# Resolve conflicts if any
npm run test:run
npm run build
git push origin main
```

---

## Post-Merge Full Integration Test

After all stages merged, run the complete flow:

1. [ ] Create lead
2. [ ] Convert lead to project (Stage 1)
3. [ ] Verify agency settings (Stage 2)
4. [ ] Create proposal from project (Stage 3)
5. [ ] Send proposal to client (Stage 3)
6. [ ] Client signs proposal in portal (Stage 3)
7. [ ] Verify MSA + SOW in contract_docs (Stage 3)
8. [ ] Verify deposit milestone auto-created (Stage 6)
9. [ ] Verify deposit invoice created in Xero (Stage 5 + 6)
10. [ ] Access full client portal (Stage 4)
11. [ ] Send chat message (Stage 4)
12. [ ] Upload file (Stage 4)
13. [ ] Complete a milestone (Stage 6)
14. [ ] Verify invoice created in Xero (Stage 5 + 6)
15. [ ] Create and sign change request (Stage 6)
16. [ ] Mark invoice as paid (Stage 5)
17. [ ] Verify overdue notifications (Stage 7)
18. [ ] Run `npm run test:run` - all 91+ tests pass

---

*Last updated: 2026-01-24*
