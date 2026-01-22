# Future Ideas - Agency CRM

> Feature ideas for evolving the agency CRM. Organized by category with implementation notes and best practices.

---

## Platform Foundations (Solo Owner)

### Single-Owner Scope

This CRM is for a single agency owner (you), not a multi-tenant SaaS.

- One workspace owned by you.
- Role names in this doc (salesperson, PM, manager) map to you unless you invite a collaborator.
- Internal users are optional; use `user_id` to represent you or a collaborator.
- Client users are separate (`client_user_id`) for portal access.
- Data separation is by client/project, not by organization.

### Current Build Snapshot (Already Implemented)

These exist in the codebase today and should not be re-built from scratch.

- Leads list + kanban pipeline with status updates
- Lead detail view + interaction timeline (calls/notes)
- Clients list + detail view with linked projects
- Projects list + detail view
- Project task board (kanban + list), drag/drop, filters, task detail editing
- “My Tasks” view for assigned work
- Global search + command palette
- Employee invites + basic profile settings
- Soft delete columns + search excludes deleted records

### Known Gaps / Mismatches (Fix Before Expanding)

- Lead tasks UI exists, but the `tasks` table does not include `lead_id`/`assigned_to` fields used by the dialog.
- Lead → Project conversion flow is manual (no one‑click conversion).
- No client portal, proposals, invoices, payments, or milestones yet.

### Agency Settings & Defaults

Set the baseline configuration once so everything else inherits it.

**Core Features:**
- Agency profile: legal name, address, tax ID, logo
- Default currency, timezone, and working hours
- Invoice numbering format and default terms
- Default tax rates and payment methods
- Timesheet weekly lock schedule
- Email domain + sender identity
- Proposal/invoice template defaults

**Data Model:**
```sql
agency_settings (
  id, legal_name, trade_name,
  address, tax_id, phone,
  default_currency, timezone,
  invoice_prefix, invoice_terms,
  default_tax_rate, payment_methods,
  email_from_name, email_from_address,
  logo_url, brand_colors,
  updated_at
)
```

**Best Practices:**
- Keep defaults simple; allow per-client overrides
- Log changes to tax/terms for audit clarity
- Store branding assets in versioned storage
- Validate invoice numbering format on save

### Global Search & Quick Actions

Find anything fast and take action without hunting through menus.

**Status:** Implemented (command palette + `/api/search`)

**Core Features:**
- Universal search across clients, projects, invoices, tasks
- Command palette for quick actions
- Recent items + pinned favorites
- Keyboard shortcuts for power use

**Best Practices:**
- Show type icons (client/project/invoice) in results
- Return recent + exact matches first
- Allow inline actions (open, email, invoice, mark paid)
- Cache frequent searches locally for speed

### Data Portability & Backups

You should always be able to export or recover your data.

**Core Features:**
- CSV import/export for clients, leads, projects, time, invoices
- PDF exports for invoices and proposals
- Full archive export (files + metadata)
- Scheduled backups with restore checks

**Data Model:**
```sql
export_jobs (
  id, export_type, -- csv, pdf, full_archive
  requested_by, status,
  file_path, created_at, completed_at
)
```

**Best Practices:**
- Schedule automatic backups (weekly or monthly)
- Test restore at least quarterly
- Include file metadata + versions in full exports
- Store backups in a separate bucket/location

### Activity & Change History

A single timeline helps you see what happened and when.

**Core Features:**
- Unified activity feed per client/project
- Change history for key fields (status, dates, totals)
- Filter by type (email, invoice, task, file, note)
- Manual notes for context

**Data Model:**
```sql
activity_log (
  id, entity_type, entity_id,
  actor_user_id, action,
  metadata, created_at
)

change_history (
  id, entity_type, entity_id,
  field, old_value, new_value,
  changed_by, changed_at
)
```

**Best Practices:**
- Always log financial changes
- Keep changes readable (no raw JSON dumps)
- Allow manual notes for phone calls/meetings
- Show who/what triggered automation changes

---

## Financial Management

### Invoicing System

Create, send, and track invoices directly from the CRM.

**Core Features:**
- Generate invoices in Xero from milestones or approved extras
- Store Xero invoice IDs + status locally
- Sync invoice PDF from Xero into Docs Vault
- Delivery handled by Xero (email + online payment link)
- Create invoices in Draft by default
- Status tracking: Draft → Sent → Viewed → Paid → Overdue
- Payment reminders (manual and automated)
- Auto-create draft 50% deposit invoice on project creation (editable per project)
- Auto-invoice milestones when marked complete
- Partial payment support
- Credit notes and refunds
- Multi-currency support
- Australian tax invoice compliance (ABN, GST, tax invoice fields)

**Data Model:**
```sql
invoices (
  id, client_id, project_id,
  xero_invoice_id, xero_status,
  invoice_number, currency,
  subtotal, tax_rate, tax_amount, total,
  issue_date, due_date, paid_at,
  xero_pdf_url, last_synced_at,
  notes, terms, created_by
)

invoice_line_items (
  id, invoice_id, description,
  quantity, unit_price, amount,
  tax_rate, sort_order
)

payments (
  id, invoice_id, amount, payment_date,
  payment_method, reference, notes
)
```

**Best Practices:**

*Invoice Numbering:*
- Use sequential, non-guessable numbers (INV-2026-0001)
- Never reuse or delete invoice numbers (legal requirement)
- Support custom prefixes per year/client
- Include checksum digit for validation

*Financial Calculations:*
- Use integer cents (not floats) for all monetary values
- Store currency code with every amount
- Calculate taxes at line-item level, not invoice level
- Round consistently (banker's rounding)
- Support tax-inclusive and tax-exclusive pricing

*PDF Generation:*
- Use Xero-generated PDF as the source of truth
- Label as “Tax Invoice” when GST applies
- Store PDF in Docs Vault for audit trail

*Payment Links:*
- Use Xero online invoice link (Stripe payments via Xero)
- Include invoice reference in Xero metadata
- Support partial payments where Xero allows
- Handle Xero webhook/polling failures with retry queue
- Never store card details locally

*Status Management:*
- Use state machine pattern for status transitions
- Log all status changes with timestamp and actor
- Prevent invalid transitions (can't go Paid → Draft)
- Auto-transition: Sent → Overdue after due_date

**Security Considerations:**
- Access control: only you (and explicitly invited collaborators) can see invoices
- Audit log all financial operations
- PCI compliance: never handle card data directly
- Encrypt sensitive fields at rest
- Rate limit invoice creation to prevent abuse

**UX Patterns:**
- Preview invoice before sending
- Duplicate invoice for recurring billing
- Batch invoice creation from time entries
- Quick actions: Mark as Paid, Send Reminder
- Mobile-responsive invoice view for clients

**Error Handling:**
- Validate totals match line items before save
- Handle Xero sync failures gracefully
- Queue failed Xero jobs for retry
- Alert on payment processing errors
- Reconciliation report for mismatched payments

**Accessibility:**
- Screen reader friendly invoice tables
- Keyboard navigation for all actions
- High contrast mode for financial data
- Clear error messages with recovery steps

---

### Proposal & Quote System

Send professional quotes to leads with pricing breakdowns.

**Core Features:**
- Template-based full proposal builder
- Line items with optional/required flags
- Client-facing view with accept/decline
- E-signature capture inside client portal
- Auto-convert accepted proposal → project + invoice schedule
- Accepted proposal becomes the signed SOW (contract)
- Separate MSA document stored per client
- Track views and engagement analytics
- Version history and comparison
- Collaborative editing

**Data Model:**
```sql
proposals (
  id, lead_id, client_id, title, status,
  total, currency, valid_until,
  created_by, sent_at, viewed_at,
  accepted_at, declined_at,
  signature_data, signer_name, signer_ip
)

proposal_versions (
  id, proposal_id, version_number,
  content_snapshot, created_at, created_by
)

proposal_sections (
  id, proposal_id, section_type,
  heading, content, sort_order
)

proposal_line_items (
  id, section_id, description, quantity,
  unit_price, amount, is_optional, selected
)

proposal_views (
  id, proposal_id, viewed_at, duration_seconds,
  ip_address, user_agent, sections_viewed
)
```

**Best Practices:**

*Pricing Psychology:*
- Present 3 options (Good/Better/Best anchoring)
- Show savings for bundled packages
- Use price anchoring (show "value" crossed out)
- Display ROI calculations where possible
- Optional items increase perceived customization

*Proposal Structure:*
- Lead with executive summary (problem + solution)
- Social proof early (testimonials, case studies)
- Scope before pricing (establish value first)
- Clear timeline with milestones
- Terms at the end (not the focus)

*Tracking & Analytics:*
- Track time spent per section
- Identify which sections get re-read
- Alert you when proposal opened
- Score engagement: views × time × sections
- A/B test different proposal formats

*Acceptance Flow:*
- Simple one-click accept for small proposals
- Drawn e-signature for larger contracts
- Capture IP, timestamp, browser for legal validity
- Send confirmation to both parties immediately
- Allow decline with reason capture
- Project cannot move to Active until MSA + SOW are signed

*Version Control:*
- Auto-save drafts every 30 seconds
- Create version on significant changes
- Allow comparison between versions
- Track who changed what (blame view)
- Restore previous versions

**Security Considerations:**
- Unique, unguessable URLs for client viewing
- Optional password protection for sensitive proposals
- Expire viewing links after acceptance
- Log all access with IP and user agent
- GDPR: allow deletion of proposal data

**UX Patterns:**
- WYSIWYG editor for content sections
- Drag-and-drop section reordering
- Real-time collaboration indicators
- Preview as client will see it
- Mobile-optimized client view
- Dark mode support for long editing sessions

**Common Pitfalls:**
- Don't auto-expire proposals without warning
- Don't allow editing after client views (create new version)
- Don't require login for client to view
- Don't send proposal without preview
- Don't forget to handle timezone differences in expiration

---

### Payment Tracking

Know what's paid, what's outstanding, and what's overdue.

**Core Features:**
- Payment status sync from Xero (source of truth)
- Manual "Mark Paid" for bank transfer
- Outstanding balance per client
- Aging report: 30/60/90 days overdue
- Payment history timeline
- Automatic late fee calculation (configurable)
- Payment plans and installments
- Write-off tracking for bad debt

**Data Model:**
```sql
client_balances (
  -- Materialized view or computed
  client_id, total_invoiced, total_paid,
  outstanding, overdue_amount,
  oldest_unpaid_date
)

payment_schedules (
  id, invoice_id, installment_number,
  amount, due_date, paid_at
)

write_offs (
  id, invoice_id, amount, reason,
  approved_by, written_off_at
)
```

**Best Practices:**

*Aging Buckets:*
- Current (not yet due)
- 1-30 days overdue
- 31-60 days overdue
- 61-90 days overdue
- 90+ days overdue (escalation territory)

*Collection Workflow:*
```
Day 1: Invoice sent
Day -3: Payment due reminder
Day 0: Due date
Day 7: First overdue notice (friendly)
Day 14: Second notice (firm)
Day 30: Final notice (warning)
Day 45: Collection consideration
```

*Late Fees:*
- Clearly state policy in invoice terms
- Calculate automatically but allow override
- Cap maximum late fees (legal limits vary)
- Apply to invoice, not to previous late fees
- Waive for first offense or good customers

*Reconciliation:*
- Daily sync with Xero
- Match payments to invoices automatically
- Flag unmatched payments for review
- Handle overpayments (credit or refund)
- Currency conversion tracking
- When marking paid in CRM, write payment back to Xero

**Reporting Views:**
- AR aging summary
- Cash flow forecast
- Collection effectiveness rate
- Average days to payment by client
- Payment method breakdown

**Automation Opportunities:**
- Auto-send reminders based on schedule
- Auto-apply late fees after grace period
- Auto-flag at-risk accounts
- Auto-generate collection letters
- Escalation to you for high-value overdue

---

### Revenue Dashboard

Financial health at a glance.

**Core Features:**
- Monthly recurring revenue (MRR) from retainers
- Revenue this month vs last month vs same month last year
- Outstanding invoices total
- Revenue by client (top 10)
- Revenue by project type
- Cash flow forecast (based on invoice due dates)
- Profitability trends
- Xero as source of truth for invoiced/paid amounts

**Key Metrics:**

*Revenue Metrics:*
- Gross Revenue: Total invoiced
- Net Revenue: Gross - refunds - write-offs
- MRR: Monthly recurring (retainers)
- ARR: Annual recurring revenue
- ARPC: Average revenue per client

*Health Indicators:*
- Revenue Growth Rate: (This month - Last month) / Last month
- Client Concentration: % revenue from top 3 clients (risk if >50%)
- Collection Rate: Paid / Invoiced
- Average Days to Pay: Mean time from invoice to payment

*Forecasting:*
- Committed: Contracted work not yet invoiced
- Weighted Pipeline: Proposals × probability
- Expected: Based on historical patterns

**Best Practices:**

*Dashboard Design:*
- Most important metrics at top-left (F-pattern reading)
- Use sparklines for trends without taking space
- Color coding: green (good), yellow (warning), red (bad)
- Comparison periods: vs last month, vs same month last year
- Allow drill-down from summary to detail

*Data Freshness:*
- Real-time for critical metrics (outstanding balance)
- Hourly refresh for aggregates
- Show "last updated" timestamp
- Cache computed metrics for performance

*Visualization Best Practices:*
- Line charts for trends over time
- Bar charts for comparisons
- Use consistent color palette
- Start Y-axis at zero for bar charts
- Annotate significant events (big client won, etc.)

**Security:**
- Financial dashboards admin-only by default
- Option to share read-only view with stakeholders
- Audit log for who viewed financial data
- Export restrictions for sensitive data

---

### Retainer & Recurring Revenue

Track monthly maintenance contracts and retainers.

**Core Features:**
- Retainer agreements: client, monthly amount, hours included, start/end dates
- Automatic invoice generation on billing date
- Hours tracking against retainer allocation
- Overage billing when hours exceeded
- Renewal reminders before expiration
- Rollover hours (configurable)
- Rate increases and amendments

**Data Model:**
```sql
retainers (
  id, client_id, name, status,
  monthly_amount, hours_included,
  hourly_overage_rate, billing_day,
  start_date, end_date, auto_renew,
  rollover_hours, max_rollover,
  created_at, created_by
)

retainer_periods (
  id, retainer_id, period_start, period_end,
  hours_allocated, hours_used, hours_rollover,
  overage_hours, overage_amount,
  invoice_id, status
)

retainer_amendments (
  id, retainer_id, effective_date,
  field_changed, old_value, new_value,
  reason, created_by
)
```

**Best Practices:**

*Billing Cycle Management:*
- Bill in advance (standard for retainers)
- Pro-rate first/last month
- Handle mid-month start dates
- Grace period for payment before service pause
- Clear policy on unused hours (use-it-or-lose-it vs rollover)

*Hours Tracking:*
- Real-time "hours remaining" visibility
- Alert at 75%, 90%, 100% usage
- Require approval for overage work
- Clear overage rates in contract
- Monthly utilization report to client

*Renewal Management:*
- 60-day reminder for annual renewals
- 30-day reminder for monthly
- Prepare renewal proposal with rate adjustment
- Track renewal rate as metric
- Win-back workflow for churned retainers

*Rate Increases:*
- Annual CPI adjustment clause
- 30-day notice minimum
- Grandfather existing rate for current term
- Document in amendment history
- Communicate value delivered alongside increase

**Reporting:**
- MRR trend and growth rate
- Retainer utilization by client
- Overage revenue as % of total
- Churn rate and reasons
- Expansion revenue (upgrades)

---

### Project Profitability

Know if you're making money on each project.

**Core Features:**
- Budget tracking: estimated vs actual hours
- Cost calculation: hours × person hourly cost (you or contractor)
- Revenue: invoiced amount
- Profit margin: (revenue - cost) / revenue
- Burn rate indicator
- Scope creep detection
- Post-mortem profitability analysis

**Data Model:**
```sql
project_budgets (
  id, project_id, budget_type, -- fixed, hourly, retainer
  estimated_hours, estimated_revenue,
  hourly_rate, fixed_price
)

project_costs (
  -- Computed from time entries
  project_id, user_id,
  hours_worked, hourly_cost, total_cost
)

project_profitability (
  -- Materialized view
  project_id, total_revenue, total_cost,
  gross_profit, margin_percent,
  budget_hours, actual_hours,
  budget_variance_percent
)
```

**Key Metrics:**

*Per Project:*
- Gross Margin: (Revenue - Direct Costs) / Revenue
- Budget Burn: Actual Hours / Budgeted Hours
- Completion %: Done Tasks / Total Tasks
- Efficiency Ratio: Budget Burn / Completion %
- Effective Rate: Revenue / Actual Hours

*Health Score Calculation:*
```
Schedule Score:
  - Green: completion % >= time elapsed %
  - Yellow: within 10% variance
  - Red: >10% behind

Budget Score:
  - Green: burn rate <= completion %
  - Yellow: burn rate within 20% of completion
  - Red: burn rate >20% ahead of completion

Overall: Average of scores, red if any red
```

**Best Practices:**

*Cost Tracking:*
- Assign cost rate per person (blended or actual)
- Include overhead multiplier (1.3-1.5x salary)
- Track non-billable project time separately
- Allocate shared costs (PM time, meetings)
- Update cost rates annually

*Early Warning System:*
- Alert PM when budget hits 50% with <50% complete
- Weekly profitability pulse for active projects
- Trend line showing projected final margin
- Compare to similar past projects

*Post-Project Analysis:*
- Was estimate accurate? Why/why not?
- What caused scope creep?
- Which phases were most/least profitable?
- Lessons learned for future estimates
- Update estimation templates based on actuals

**Common Pitfalls:**
- Forgetting to track internal meetings
- Not updating budgets when scope changes
- Using revenue estimates instead of actuals
- Ignoring opportunity cost of unprofitable projects
- Not factoring in payment delays (cash flow vs revenue)

---

## Pipeline & Sales Analytics

### Lead Scoring

Prioritize leads by likelihood to close.

**Core Features:**
- Multi-factor scoring model
- Configurable scoring rules
- Score decay over time
- Behavioral and demographic scoring
- Integration with lead assignment

**Scoring Model:**

*Demographic Factors (Fit Score):*
```
Budget:
  - $50k+: +30 points
  - $20-50k: +20 points
  - $10-20k: +10 points
  - <$10k: +5 points

Company Size:
  - Enterprise (500+): +15 points
  - Mid-market (50-500): +20 points
  - SMB (10-50): +15 points
  - Startup (<10): +10 points

Industry Fit:
  - Target industry: +20 points
  - Adjacent industry: +10 points
  - Outside focus: +0 points

Timeline:
  - Immediate (<1 month): +25 points
  - Short (1-3 months): +15 points
  - Medium (3-6 months): +5 points
  - Long (6+ months): +0 points
```

*Behavioral Factors (Engagement Score):*
```
Website Activity:
  - Visited pricing page: +10 points
  - Viewed case studies: +5 points
  - Downloaded resource: +15 points
  - Multiple visits: +5 points per visit (cap 20)

Email Engagement:
  - Opened email: +3 points
  - Clicked link: +5 points
  - Replied: +15 points

Proposal Activity:
  - Viewed proposal: +20 points
  - Time on proposal >5 min: +10 points
  - Viewed multiple times: +5 per view

Response Quality:
  - Responded within 24h: +10 points
  - Asked detailed questions: +10 points
  - Introduced decision makers: +15 points
```

*Score Decay:*
```
- Decay 10% per week of inactivity
- Reset decay timer on any engagement
- Minimum score: 0
- Maximum score: 100
```

**Data Model:**
```sql
lead_scores (
  lead_id, fit_score, engagement_score,
  total_score, last_calculated_at
)

lead_score_events (
  id, lead_id, event_type, points,
  created_at, expires_at
)

scoring_rules (
  id, name, event_type, condition,
  points, is_active
)
```

**Best Practices:**

*Model Calibration:*
- Analyze past won/lost deals for patterns
- Weight factors based on historical correlation
- Review and adjust quarterly
- A/B test different scoring models
- Validate against your own sales intuition

*Score Thresholds:*
```
Hot (80-100): Immediate attention, high priority
Warm (50-79): Active nurturing, regular follow-up
Cool (25-49): Automated nurturing, periodic check-in
Cold (0-24): Low priority, re-engagement campaigns
```

*Integration with Workflow:*
- Auto-assign hot leads to you (or a designated collaborator)
- Trigger notifications at score thresholds
- Adjust follow-up cadence based on score
- Route to appropriate nurture sequence
- Update score in real-time

**Avoid:**
- Over-complicating with too many factors
- Scoring based on data you don't reliably have
- Ignoring negative signals (competitor mentioned)
- Treating score as absolute truth
- Not retraining model as business changes

---

### Conversion Metrics

Understand your sales funnel.

**Core Features:**
- Stage-by-stage conversion rates
- Velocity metrics (time in stage)
- Drop-off analysis
- Cohort analysis
- Win/loss analysis

**Key Metrics:**

*Conversion Rates:*
```
Lead → Contacted: First outreach made
Contacted → Qualified: Meets criteria, has budget
Qualified → Proposal: Proposal sent
Proposal → Won: Deal closed
Overall: Lead → Won
```

*Velocity Metrics:*
```
Time to Contact: Lead created → First outreach
Sales Cycle Length: Lead created → Won/Lost
Time per Stage: Average days in each stage
Proposal to Decision: Proposal sent → Response
```

*Quality Metrics:*
```
Proposal Win Rate: Won / (Won + Lost after proposal)
Qualification Rate: Qualified / Total Leads
No-Decision Rate: Stalled / Total Opportunities
```

**Funnel Visualization:**

```
Stage         | Count | Rate  | Avg Days
--------------|-------|-------|----------
New Leads     | 100   | -     | 0
Contacted     | 85    | 85%   | 1.2
Qualified     | 45    | 53%   | 3.5
Proposal      | 30    | 67%   | 5.0
Won           | 18    | 60%   | 7.5
--------------|-------|-------|----------
Overall       | 18%   conversion over 17.2 days
```

**Best Practices:**

*Data Hygiene:*
- Require stage change reason
- Don't allow skipping stages
- Track stage entry and exit timestamps
- Clean up stale leads regularly
- Audit for gaming (quick stage changes)

*Analysis Dimensions:*
- By lead source
- By lead owner
- By deal size
- By industry/segment
- By time period (seasonality)

*Benchmarking:*
- Track against historical performance
- Compare lead owners fairly (if you add collaborators)
- Industry benchmarks where available
- Set realistic targets based on data

*Loss Analysis:*
```
Required fields when marking Lost:
- Primary reason (dropdown)
- Competitor (if applicable)
- Price feedback
- Notes for learning
```

Common loss reasons:
- Budget/timing
- Chose competitor
- Went with internal solution
- Project cancelled
- No decision/went silent

---

### Lead Source ROI

Know which marketing channels work.

**Core Features:**
- Track source of every lead
- Revenue attribution
- Cost tracking per channel
- ROI calculation
- Multi-touch attribution

**Data Model:**
```sql
lead_sources (
  id, name, category, -- organic, paid, referral
  monthly_cost, is_active
)

lead_attributions (
  lead_id, source_id, attribution_type,
  -- first_touch, last_touch, multi_touch
  attribution_percent
)

source_costs (
  id, source_id, period_start, period_end,
  amount, notes
)
```

**Attribution Models:**

*First Touch:*
- 100% credit to first interaction
- Good for: awareness channels
- Example: Found via Google search

*Last Touch:*
- 100% credit to final interaction before conversion
- Good for: closing channels
- Example: Converted after webinar

*Linear:*
- Equal credit to all touchpoints
- Fair but doesn't account for impact
- Example: 5 touches = 20% each

*Time Decay:*
- More credit to recent touches
- Balances awareness and closing
- Example: 50% last, 30% second-last, 20% earlier

*Position Based (U-shaped):*
- 40% first, 40% last, 20% middle
- Values both introduction and conversion
- Most practical for B2B

**ROI Calculation:**
```
Revenue Attribution = Sum of (Deal Value × Attribution %)
ROI = (Revenue Attribution - Cost) / Cost × 100

Example:
  Google Ads Cost: $5,000/month
  Attributed Revenue: $25,000
  ROI = ($25,000 - $5,000) / $5,000 × 100 = 400%
```

**Best Practices:**

*Source Tracking:*
- UTM parameters for all digital campaigns
- Unique phone numbers for offline tracking
- "How did you hear about us?" on forms
- CRM integration with marketing tools
- Referral source capture and tracking

*Cost Tracking:*
- Include all costs (ad spend, tools, time)
- Pro-rate agency retainers
- Track cost per lead (CPL)
- Track customer acquisition cost (CAC)
- Factor in lifetime value (LTV)

*Reporting Period:*
- Monthly for operational decisions
- Quarterly for strategic review
- Account for sales cycle length
- Cohort by lead creation date
- Lag revenue attribution appropriately

---

### Pipeline Forecasting

Predict future revenue.

**Core Features:**
- Weighted pipeline calculation
- Historical win rate analysis
- Forecast vs actual tracking
- Scenario modeling
- Confidence intervals

**Methodology:**

*Stage-Weighted Forecast:*
```
Stage          | Probability | Example Deal
---------------|-------------|-------------
Qualified      | 20%         | $50k × 20% = $10k
Proposal Sent  | 40%         | $50k × 40% = $20k
Negotiating    | 60%         | $50k × 60% = $30k
Verbal Yes     | 80%         | $50k × 80% = $40k
Contracted     | 95%         | $50k × 95% = $47.5k
```

*Adjusted Probability:*
```
Base probability × Individual factors:
  - Lead owner historical win rate (0.8-1.2x)
  - Deal size vs average (larger = lower prob)
  - Days in stage vs average (longer = lower prob)
  - Engagement score factor
```

*Forecast Categories:*
```
Commit: 90%+ probability, closing this period
Best Case: 60%+ probability
Pipeline: All open opportunities
Upside: Early stage, potential acceleration
```

**Best Practices:**

*Accuracy Tracking:*
- Compare forecast to actual monthly
- Track by lead owner and overall
- Measure forecast accuracy over time
- Identify systematic over/under forecasting
- Adjust probabilities based on actuals

*Sanity Checks:*
- Compare to historical close rates
- Flag unrealistic forecasts
- Pipeline coverage ratio (3x target is healthy)
- Velocity check (deals closing faster than historical?)

*Scenario Planning:*
```
Conservative: Only Commit deals
Expected: Weighted pipeline
Optimistic: All Best Case deals close
```

---

### Stale Lead Alerts

Never let a lead go cold.

**Core Features:**
- Configurable inactivity thresholds
- Multi-channel alerts
- Escalation paths
- Bulk action tools
- Re-engagement automation

**Alert Configuration:**

```yaml
stale_lead_rules:
  - name: "No contact in 7 days"
    condition: "days_since_last_activity > 7"
    stages: ["new", "contacted"]
    alert_to: "assignee"

  - name: "Proposal not viewed in 3 days"
    condition: "proposal_sent AND NOT proposal_viewed AND days_since_proposal > 3"
    alert_to: "assignee"

  - name: "No response to proposal in 7 days"
    condition: "proposal_viewed AND days_since_proposal > 7"
    alert_to: ["assignee", "owner"]

  - name: "Lead stalled 14+ days"
    condition: "days_in_current_stage > 14"
    alert_to: ["assignee", "owner"]
    action: "add_to_re_engagement_sequence"
```

**Best Practices:**

*Alert Fatigue Prevention:*
- Batch notifications (daily digest vs real-time)
- Prioritize by lead score
- Allow snooze with required reason
- Don't alert for intentionally paused leads
- Clear, actionable alert messages

*Escalation Path:*
```
Day 7: Alert assignee
Day 10: Alert + owner CC
Day 14: Owner alert, consider reassignment
Day 21: Mark for review, potential archive
```

*Re-engagement Actions:*
- Automated "checking in" email
- Different approach suggestion
- Change lead owner (if you add a collaborator)
- Move to nurture sequence
- Mark as lost if truly dead

---

## Time & Resource Management

If you stay solo, these are optional. They become valuable when you add contractors or track your own capacity across projects.

### Time Tracking

Log hours against tasks and projects.

**Core Features:**
- Internal-only (contractor logins)
- Manual time entry with date, duration, description
- Billable vs non-billable flag
- Associate time with: task, project, client
- Weekly timesheet view
- Weekly lock schedule (entries read-only after lock)
- Approval workflow (optional, if you add managers)
- Offline support with sync
- Mobile app for on-the-go tracking

**Data Model:**
```sql
time_entries (
  id, user_id, task_id, project_id, client_id,
  date, start_time, end_time, duration_minutes,
  description, billable, billed,
  invoice_id, approved_by, approved_at,
  source, -- manual, timer, import
  created_at, updated_at
)

time_entry_tags (
  time_entry_id, tag -- meeting, development, design, etc.
)

timesheets (
  id, user_id, week_start, status,
  submitted_at, approved_by, approved_at,
  locked_at, locked_by
)
```

**Best Practices:**

*Timer Implementation:*
_(Only if you add timers later)_
```typescript
// Don't rely on browser time alone
interface TimerState {
  startedAt: Date;           // Server timestamp
  localStartedAt: Date;      // Client timestamp
  pausedDuration: number;    // Accumulated pause time
  status: 'running' | 'paused' | 'stopped';
}

// Calculate duration server-side on stop
// Handle browser close: save state to localStorage
// Sync on reconnect
```

*Rounding Policies:*
- Round to nearest 15 minutes (most common)
- Round up (agency-friendly, client may question)
- Exact minutes (fairest, hardest to invoice)
- Make policy configurable per client/project
- Apply rounding at invoice time, not entry time

*Approval Workflow:*
```
Employee submits timesheet
  → Manager reviews entries
    → Approve all / Reject with comments
      → Approved entries become billable
        → Can be added to invoice
```

*Locking Policy:*
- Lock weekly on a fixed schedule (e.g., Monday 9am)
- Allow edits before lock; read-only after lock
- Admin override to unlock when needed

*Data Integrity:*
- Prevent future date entries
- Flag unusually long entries (>8 hours continuous)
- Detect duplicates (same task, overlapping times)
- Require description for all entries
- Lock entries after approval

**UX Patterns:**
- One-click timer start from task
- Recent entries for quick re-entry
- Bulk edit for corrections
- Calendar view with time blocks
- Mobile-first for field workers

**Integrations:**
- Import from Toggl, Harvest, Clockify
- Calendar integration (auto-suggest from meetings)
- Git commit correlation (for developers)
- Browser extension for passive tracking

**Accessibility:**
- Keyboard shortcuts for timer control
- Screen reader announcements for timer state
- High contrast time display
- Voice input for descriptions

---

### Utilization Reports

See capacity and workload (useful if you add contractors).

**Core Features:**
- Individual utilization rates
- Overall utilization overview
- Capacity planning
- Trend analysis
- Forecasting

**Key Metrics:**

*Per Person:*
```
Available Hours = Working hours - PTO - Holidays
Billable Hours = Hours marked billable
Non-Billable Hours = Total logged - Billable
Utilization Rate = Billable / Available × 100

Target utilization varies by role:
  - Developers: 75-85%
  - Designers: 70-80%
  - Project Managers: 50-60%
  - Sales: 20-30%
  - Leadership: 30-40%
```

*Overall Level:*
```
Total Capacity = Sum of available hours
Overall Utilization = Sum of billable / Sum of available
Utilization Distribution = Histogram of individual rates
Bench Time = Available - (Billable + Non-billable project)
```

**Visualization:**

*Heatmap View:*
```
Person      | Mon | Tue | Wed | Thu | Fri | Total | Rate
------------|-----|-----|-----|-----|-----|-------|------
Alice       | 8h  | 7h  | 8h  | 6h  | 8h  | 37h   | 92%
Bob         | 6h  | 4h  | 5h  | 8h  | 5h  | 28h   | 70%
Carol       | 0h  | 0h  | 8h  | 8h  | 8h  | 24h   | 60%
------------|-----|-----|-----|-----|-----|-------|------

Color coding:
  Green: 70-90% (optimal)
  Yellow: 90-100% (risk of burnout)
  Red: <60% (underutilized) or >100% (overworked)
```

**Best Practices:**

*Setting Targets:*
- Account for role differences
- Include buffer for untracked work
- Adjust for experience level
- Review quarterly based on actuals
- Communicate targets transparently

*Avoiding Gaming:*
- Focus on outcomes, not just hours
- Don't penalize vacation time
- Include quality metrics alongside quantity
- Review unusual patterns
- Trust but verify

*Capacity Planning:*
- Forward-looking view of commitments
- Factor in project end dates
- Account for ramp-up time on new projects
- Plan for vacation and training
- Buffer for unexpected work

---

### Resource Allocation View

Visual workload distribution.

**Core Features:**
- Calendar view
- Project-based resource planning
- Conflict detection
- What-if scenario modeling
- Drag-and-drop reassignment

**Views:**

*Timeline/Gantt View:*
```
Week of Jan 20
----------------------------------------------------------
Alice    |████ Project A ████|░░░░░ Project B ░░░░░|
Bob      |████████████ Project A (full time) ████████████|
Carol    |██ Proj C ██|░ Avail ░|████ Project D ████|
----------------------------------------------------------

Legend:
████ = Committed (assigned tasks)
░░░░ = Tentative (planned but not assigned)
     = Available
```

*Capacity Bars:*
```
           Committed  Tentative  Available
Alice      ████████░░░░░░░░░░░░          60%
Bob        ████████████████████░░░░      100% ⚠️
Carol      ████░░░░░░░░░░░░░░░░░░░░      30%
David      ████████████░░░░░░░░░░░░      70%
```

**Best Practices:**

*Assignment Strategy:*
- Match skills to requirements
- Balance workload across collaborators
- Consider timezone for collaboration
- Factor in person preferences
- Avoid single points of failure

*Conflict Resolution:*
```
When over-allocated:
1. Identify priority of competing projects
2. Check for deadline flexibility
3. Consider overtime (with consent)
4. Escalate to PM for trade-off decision
5. Document decision and impact
```

*Forecasting:*
- Use historical velocity for estimates
- Plan at 80% capacity (20% buffer)
- Account for meetings and admin
- Include learning curve for new tech
- Review and adjust weekly

**Technical Implementation:**
- Efficient queries for timeline rendering
- Optimistic UI for drag-and-drop
- Real-time updates via WebSocket
- Conflict checking before save
- Undo/redo support

---

### Billable vs Non-Billable Analysis

Know your effective rate.

**Core Features:**
- Billable ratio tracking
- Effective hourly rate calculation
- Non-billable categorization
- Trend analysis
- Benchmarking

**Metrics:**

*Effective Rate:*
```
Effective Hourly Rate = Total Revenue / Total Hours Worked

Example:
  Revenue this month: $50,000
  Total hours (billable + non-billable): 500
  Effective rate: $100/hour

Compare to:
  Standard billing rate: $150/hour
  Realization rate: $100 / $150 = 67%
```

*Non-Billable Categories:*
```
Internal:
  - Team meetings
  - Training and learning
  - Tool setup and maintenance
  - Internal projects

Admin:
  - Email and communication
  - Time tracking and reporting
  - HR and administrative

Sales:
  - Proposals and pitches
  - Client meetings (pre-sale)
  - Networking

Overhead:
  - PTO, sick leave, holidays
  - Company events
  - Performance reviews
```

**Best Practices:**

*Improving Billable Ratio:*
- Streamline internal processes
- Reduce meeting overhead
- Automate administrative tasks
- Better project scoping (less rework)
- Efficient knowledge sharing

*Analysis Questions:*
- Which projects have lowest realization?
- Which people have highest non-billable?
- What non-billable categories are growing?
- Is training investment paying off?
- Are sales efforts converting efficiently?

---

## Project Enhancements

### Project Templates

Start projects from predefined scopes.

**Core Features:**
- Template library management
- One-click project creation
- Customizable after creation
- Template versioning
- Usage analytics

**Data Model:**
```sql
project_templates (
  id, name, description, category,
  estimated_hours, estimated_duration_days,
  default_billing_type, -- fixed, hourly
  is_active, created_by, version
)

template_phases (
  id, template_id, name, sort_order,
  duration_days, description
)

template_tasks (
  id, template_id, phase_id, title,
  description, estimated_hours,
  task_type, priority, sort_order,
  dependencies -- array of task template ids
)

template_milestones (
  id, template_id, phase_id, name,
  relative_day, -- days from project start
  invoice_percent, description
)

template_documents (
  id, template_id, name, template_content,
  document_type -- checklist, brief, etc.
)
```

**Example Templates:**

*Website Redesign (8 weeks):*
```
Phase 1: Discovery (Week 1-2)
  - Stakeholder interviews (8h)
  - Competitor analysis (4h)
  - User research (8h)
  - Current site audit (4h)
  → Milestone: Discovery Complete (10% invoice)

Phase 2: Strategy & Architecture (Week 2-3)
  - Content strategy (8h)
  - Information architecture (8h)
  - Technical requirements (4h)
  → Milestone: Strategy Approved (10% invoice)

Phase 3: Design (Week 3-5)
  - Wireframes (16h)
  - Visual design concepts (24h)
  - Design revisions (8h)
  - Design system documentation (8h)
  → Milestone: Design Approved (20% invoice)

Phase 4: Development (Week 5-7)
  - Frontend development (40h)
  - CMS integration (16h)
  - Responsive implementation (8h)
  - Performance optimization (4h)
  → Milestone: Development Complete (30% invoice)

Phase 5: Launch (Week 7-8)
  - Content migration (8h)
  - QA testing (8h)
  - Client training (4h)
  - Go-live support (4h)
  → Milestone: Launch Complete (30% invoice)

Total: ~200 hours
```

**Best Practices:**

*Template Design:*
- Base on successful past projects
- Include buffer time in estimates
- Define clear milestone criteria
- Document assumptions
- Review and update quarterly

*Customization Guidelines:*
- Allow task removal/addition
- Support estimate adjustment
- Permit phase reordering
- Enable milestone modification
- Track deviations from template

*Analytics:*
- Which templates are most used?
- Template accuracy (estimated vs actual)
- Common customizations (inform template updates)
- Profitability by template type

---

### Milestones

Major deliverables with billing triggers.

**Core Features:**
- Milestone definition and tracking
- Completion criteria
- Automated invoice triggering
- Client visibility
- Dependency management

**Data Model:**
```sql
milestones (
  id, project_id, name, description,
  due_date, completed_at, status,
  -- pending, in_progress, complete, overdue
  completion_criteria, -- JSON array
  invoice_percent, invoice_amount,
  invoice_id, -- null until invoiced
  client_visible, requires_approval,
  approved_at, approved_by,
  sort_order
)

milestone_criteria (
  id, milestone_id, description,
  is_completed, completed_at, completed_by
)
```

**Best Practices:**

*Defining Milestones:*
- Tie to tangible deliverables
- Make criteria specific and measurable
- Include client approval milestones
- Balance size (not too many, not too few)
- Align with payment schedule

*Completion Criteria Examples:*
```
Design Milestone:
  □ Homepage design approved by client
  □ 3 interior page templates designed
  □ Mobile responsive designs complete
  □ Design system documented

Development Milestone:
  □ All pages built and responsive
  □ CMS fully integrated
  □ Forms functional with validation
  □ Page speed score > 90
  □ Cross-browser testing complete
```

*Client Communication:*
- Send notification when milestone starts
- Progress updates during execution
- Clear completion notification
- Request approval with easy response
- Automatic invoice when you mark complete

*Risk Management:*
- Early warning for at-risk milestones
- Escalation path for blockers
- Document delays and reasons
- Renegotiate timeline proactively
- Link to change request process

---

### Change Requests (Scope Changes)

Keep scope changes visible, priced, and approved.

**Core Features:**
- Simple client request form
- Impact estimate (hours, cost, schedule)
- Approve/decline workflow with notes
- Auto-update project scope when approved
- Optional change-order invoice
- Out-of-scope changes require signature in portal

**Data Model:**
```sql
change_requests (
  id, project_id, requested_by,
  title, description, status,
  -- pending, approved, declined
  impact_hours, impact_cost, impact_days,
  requested_at, approved_at, declined_at,
  approved_by, decline_reason
)

change_request_items (
  id, change_request_id,
  item_type, description,
  hours_delta, cost_delta,
  schedule_delta_days
)
```

**Best Practices:**
- Always show the impact before approval
- Pause work on new scope until approved
- Use plain language in client-facing summaries
- Tie approved changes to a new milestone or invoice
- Keep a running “scope baseline” for reference

**Example Flow:**
```
Client request → Estimate impact → Approve/Decline
→ If approved: update scope + add invoice/milestone
```

---

### Task Board (Kanban + List)

Track project work in a visual board.

**Status:** Implemented for projects (kanban + list + filters + task detail editor)

**Core Features:**
- Drag-and-drop columns (Backlog → Done)
- Task detail editing (priority, type, due date, assignee)
- List view + search/filters
- Overdue indicators

**Remaining Gaps:**
- Lead tasks currently reference columns that don’t exist in the tasks table
- Decide if lead tasks live in the same table or a separate lead_tasks table

---

### Task Dependencies

Control task sequencing.

**Core Features:**
- Multiple dependency types
- Visual dependency display
- Automatic date adjustment
- Circular dependency prevention
- Critical path identification

**Data Model:**
```sql
task_dependencies (
  id, task_id, depends_on_task_id,
  dependency_type,
  -- finish_to_start, start_to_start,
  -- finish_to_finish, start_to_finish
  lag_days -- can be negative for overlap
)
```

**Dependency Types:**

*Finish-to-Start (FS):* Most common
- Task B can't start until Task A finishes
- Example: Can't develop until design is approved

*Start-to-Start (SS):*
- Task B can't start until Task A starts
- Example: QA testing starts when development starts

*Finish-to-Finish (FF):*
- Task B can't finish until Task A finishes
- Example: Documentation finishes when development finishes

*Start-to-Finish (SF):* Rare
- Task B can't finish until Task A starts
- Example: Old system runs until new system launches

**Best Practices:**

*Dependency Management:*
- Only add meaningful dependencies
- Avoid over-constraining
- Use lag for buffer time
- Review dependencies when scope changes
- Don't create circular references

*Date Propagation:*
```
When predecessor changes:
1. Calculate new earliest start for successor
2. If successor has fixed date, flag conflict
3. Cascade to downstream tasks
4. Update critical path
5. Notify affected assignees
```

*Critical Path:*
- Longest path through project
- Any delay on critical path delays project
- Highlight in UI for visibility
- Focus management attention
- Consider resource leveling

**Technical Implementation:**
```typescript
// Prevent circular dependencies
function hasCircularDependency(taskId: string, newDependency: string): boolean {
  const visited = new Set<string>();
  const stack = [newDependency];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === taskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const deps = getDependencies(current);
    stack.push(...deps);
  }
  return false;
}
```

---

### Timeline / Gantt View

Visual project schedule.

**Core Features:**
- Interactive timeline visualization
- Drag-and-drop scheduling
- Dependency arrows
- Milestone markers
- Resource overlay
- Multiple zoom levels

**UI Components:**

```
Timeline Header:
[< Prev] [Jan 2026                    ] [Next >]
[Day] [Week] [Month] [Quarter] View

Legend:
━━━ Task bar
◆ Milestone
→ Dependency
█ Critical path
░ Slack/float
```

**Best Practices:**

*Performance:*
- Virtualize rendering for large projects
- Lazy load task details
- Batch DOM updates
- Use canvas/WebGL for complex views
- Cache computed layouts

*Interaction Design:*
- Snap to grid (day/week)
- Drag handle at ends for resize
- Middle drag for move
- Double-click to edit
- Right-click for context menu

*Visual Hierarchy:*
- Group by phase or assignee
- Collapse/expand groups
- Color code by status or type
- Highlight overdue items
- Show today line prominently

*Mobile Considerations:*
- Simplified view on mobile
- Horizontal scroll priority
- Tap to select, long-press for actions
- Consider list view alternative

**Libraries Comparison:**

| Library | Pros | Cons |
|---------|------|------|
| frappe-gantt | Simple, lightweight | Limited features |
| dhtmlxGantt | Full-featured, professional | Commercial license |
| Bryntum Gantt | Modern, React support | Expensive |
| Custom (D3) | Full control | Significant effort |

---

### Project Health Indicators

Quick status assessment.

**Core Features:**
- Automated health scoring
- Multi-factor assessment
- Trend tracking
- Alert thresholds
- Executive summary

**Health Dimensions:**

*Schedule Health:*
```
Green: % complete >= % time elapsed
Yellow: Within 10% variance
Red: > 10% behind

Calculation:
  Project duration: 40 days
  Days elapsed: 20 (50%)
  Tasks complete: 45%
  Status: Yellow (5% behind)
```

*Budget Health:*
```
Green: Burn rate <= completion rate
Yellow: Burn rate within 20% of completion
Red: Burn rate > 20% ahead

Calculation:
  Budget: 200 hours
  Hours used: 120 (60%)
  Completion: 45%
  Status: Red (60% burned, 45% done)
```

*Scope Health:*
```
Green: No scope changes
Yellow: Minor additions (<10% budget impact)
Red: Significant changes (>10% budget impact)

Track:
  - Tasks added after kickoff
  - Requirement changes
  - Client change requests
```

*Client Satisfaction:*
```
Green: Positive feedback, responsive
Yellow: Some concerns raised
Red: Escalations, complaints

Signals:
  - Response time to communications
  - Feedback sentiment
  - Meeting attendance
  - Approval turnaround
```

**Overall Score:**
```typescript
function calculateProjectHealth(project: Project): HealthScore {
  const scores = {
    schedule: calculateScheduleHealth(project),
    budget: calculateBudgetHealth(project),
    scope: calculateScopeHealth(project),
    client: calculateClientHealth(project),
  };

  // Any red = overall red
  if (Object.values(scores).includes('red')) {
    return { overall: 'red', scores };
  }

  // Multiple yellows = overall yellow
  const yellowCount = Object.values(scores).filter(s => s === 'yellow').length;
  if (yellowCount >= 2) {
    return { overall: 'yellow', scores };
  }

  return { overall: 'green', scores };
}
```

**Best Practices:**

*Automation:*
- Calculate health on every change
- Store historical values for trending
- Send alerts on status change
- Daily health digest to PMs

*Calibration:*
- Adjust thresholds based on project type
- Account for normal variance
- Review false positives/negatives
- Learn from project outcomes

---

## Client Portal

### Client Login

Self-service access for clients.

**Core Features:**
- Email-delivered access link (magic link)
- Link stays valid until revoked
- One link per client person (no shared logins)
- Branded portal experience
- Role-based access within client
- Activity logging

**Data Model:**
```sql
client_users (
  id, client_id, email, name,
  role, -- admin, viewer, approver
  password_hash, last_login_at,
  is_active, invited_by, invited_at
)

client_access_links (
  id, client_user_id, token_hash,
  issued_at, last_used_at, revoked_at,
  ip_address, user_agent
)

client_sessions (
  id, client_user_id, token_hash,
  created_at, expires_at, ip_address
)

portal_activity_log (
  id, client_user_id, action,
  entity_type, entity_id,
  created_at, ip_address
)
```

**Best Practices:**

*Authentication:*
- Email magic link as default
- No passwords unless requested
- Links never expire but are revocable and re-issuable
- Session timeout configuration

*Permissions Model:*
```yaml
client_roles:
  member:
    - View assigned projects
    - Approve deliverables
    - View invoices + contracts
    - Download shared files
    - Post in client chat
```

*Branding:*
- Custom domain support
- Logo and color customization
- White-label option
- Custom welcome message
- Branded email templates

*Security:*
- Separate auth system from internal
- Rate limiting on login
- IP allowlisting option
- Audit all access
- Data isolation per client

---

### Client Portal Docs (Contracts Vault)

Keep all contract docs in one place for the client.

**Core Features:**
- Dedicated Docs section (invoices, proposals, signed agreements)
- Clear “contract docs vs project files” separation
- Download history for accountability
- Client-visible status (draft/sent/signed/paid)
- Show proposal drafts and version history

**Best Practices:**
- Store signed PDFs in an immutable version
- Show the “latest signed” doc first
- Allow re-download without asking
- Tie docs back to the project or invoice

---

### Client Uploads

Let clients upload assets safely.

**Core Features:**
- “Client Uploads” folder per project
- Size limits + allowed file types
- Virus scan on upload
- Notify you when new files arrive

**Best Practices:**
- Keep uploads separate from deliverables
- Auto-tag uploads by project + uploader
- Add an approval step before files become visible to team

---

### Client Portal Chat (Single Thread)

All client communication lives here.

**Core Features:**
- One primary chat thread per project
- Message read receipts + timestamps
- Webhook notifications (Slack, SMS, etc.)
- Files live in Docs/Uploads, tagged in chat

**Rules:**
- “If it’s not in chat, it didn’t happen.”

---

### Client Onboarding & Offboarding

Start and finish client relationships cleanly.

**Core Features:**
- Intake form + kickoff checklist
- Asset and access collection (brand files, logins)
- Contract + deposit completion tracking
- Clear onboarding timeline with reminders
- Offboarding checklist (handover, final invoice, archive)

**Data Model:**
```sql
client_onboarding (
  id, client_id, status,
  kickoff_date, intake_submitted_at,
  contract_signed_at, deposit_invoice_id,
  completed_at
)

onboarding_tasks (
  id, onboarding_id, title,
  owner_type, owner_id, -- you, collaborator, client
  due_date, status, completed_at
)

offboarding_tasks (
  id, client_id, title,
  due_date, status, completed_at
)
```

**Best Practices:**
- Keep onboarding short and focused (1-2 weeks)
- Require essentials before work starts (access, assets, goals)
- Time-box feedback and approvals early
- Use secure credential sharing (password manager link)
- Document final handoff and archive links
- Close out with a final retrospective + testimonial ask

---

### Approval Workflows

Get sign-off on deliverables.

**Core Features:**
- Flexible workflow definition
- Multi-stage approvals
- Parallel approvals support
- Revision tracking
- Deadline management

**Data Model:**
```sql
approval_requests (
  id, project_id, milestone_id,
  title, description, deliverable_url,
  requested_by, requested_at,
  due_date, status,
  -- pending, approved, rejected, revision_requested
  version
)

approval_responses (
  id, approval_request_id,
  responder_id, -- client_user_id
  response, -- approved, rejected, revision
  feedback, responded_at
)

approval_revisions (
  id, approval_request_id,
  version, changes_made,
  submitted_at, submitted_by
)
```

**Workflow Types:**

*Simple (Single Approver):*
```
Request → Client Reviews → Approved/Rejected
```

*Sequential (Multiple Stages):*
```
Request → Marketing Approves → Legal Approves → Final
```

*Parallel (Multiple Approvers):*
```
Request → [CEO, CMO, CTO all review] → All approved = Done
```

*Threshold:*
```
Request → [Board members vote] → 3 of 5 = Approved
```

**Best Practices:**

*Request Preparation:*
- Clear description of what's being approved
- Direct link to deliverable
- Comparison to previous version if applicable
- Specific questions to answer
- Deadline with reminder

*Handling Feedback:*
- Structured feedback form (not just free text)
- Categorize: critical, nice-to-have, question
- Route feedback to you or a collaborator
- Track feedback resolution
- Require re-approval after significant changes

*Communication:*
```
Email sequence:
1. Initial request with deadline
2. Reminder at 50% time remaining
3. Reminder at 24 hours before
4. Escalation if overdue
```

---

### File Sharing

Secure deliverable delivery.

**Core Features:**
- Project-organized files
- Version management
- Access control
- Download tracking
- Expiring links

**Data Model:**
```sql
project_files (
  id, project_id, milestone_id,
  filename, file_path, file_size,
  mime_type, version, description,
  uploaded_by, uploaded_at,
  client_visible, download_count
)

file_versions (
  id, file_id, version_number,
  file_path, uploaded_by, uploaded_at,
  change_notes
)

file_access_log (
  id, file_id, accessed_by, -- internal user or client user
  action, -- view, download, share
  accessed_at, ip_address
)

file_share_links (
  id, file_id, token_hash,
  created_by, expires_at,
  password_hash, download_limit,
  download_count
)
```

**Best Practices:**

*Organization:*
```
/Project Name
  /01 - Briefs & Requirements
  /02 - Research & Discovery
  /03 - Design
    /Concepts
    /Approved
    /Assets
  /04 - Development
  /05 - Final Deliverables
```

*Version Control:*
- Clear naming: `logo_v1.png`, `logo_v2_final.png`
- Auto-increment versions
- Keep all versions accessible
- Highlight current version
- Show version comparison

*Security:*
- Signed URLs for downloads
- Virus scan on upload
- File type restrictions
- Size limits by plan/client
- Encryption at rest

*External Sharing:*
- Expiring links (default 7 days)
- Password protection option
- Download limit option
- Track access and downloads
- Revoke access capability

---

### Client Feedback Collection

Structured feedback at milestones.

**Core Features:**
- Customizable feedback forms
- Automated trigger points
- Response tracking
- Sentiment analysis
- NPS integration

**Data Model:**
```sql
feedback_surveys (
  id, name, questions, -- JSON array
  trigger_type, -- milestone, project_complete, periodic
  is_active
)

feedback_requests (
  id, survey_id, project_id, client_user_id,
  sent_at, due_date, completed_at
)

feedback_responses (
  id, request_id, responses, -- JSON
  nps_score, sentiment_score,
  submitted_at
)
```

**Survey Types:**

*Milestone Check-in:*
```
1. How satisfied are you with this deliverable? (1-5)
2. Was communication clear? (1-5)
3. Were deadlines met? (Yes/No)
4. Any concerns? (Open text)
```

*Project Completion:*
```
1. Overall satisfaction (1-5)
2. Would you recommend us? (0-10 NPS)
3. What went well? (Open)
4. What could improve? (Open)
5. Can we use your feedback as a testimonial? (Yes/No)
```

**Best Practices:**

*Survey Design:*
- Keep it short (5 questions max)
- Mix quantitative and qualitative
- Use consistent scales
- Include open-ended option
- Mobile-friendly format

*Timing:*
- Request at natural pause points
- Don't over-survey
- Allow response time (3-5 days)
- Gentle reminder if needed
- Thank for feedback

*Acting on Feedback:*
- Review all responses within 24 hours
- Address concerns immediately
- Share positive feedback with collaborators (or save as testimonials)
- Track trends over time
- Close the loop with client

---

## Communication & Automation

**Current Direction:** Client communication lives in portal chat. Email is limited to one-off portal access link delivery.

### Email Templates

Quick responses for common scenarios.

**Status:** Deferred (no email workflows for now)

**Core Features:**
- Template library
- Variable substitution
- Preview before send
- Performance tracking
- A/B testing

**Data Model:**
```sql
email_templates (
  id, name, category, subject,
  body_html, body_text,
  variables, -- available placeholders
  is_active, created_by,
  send_count, open_rate, response_rate
)

template_categories:
  - Lead nurturing
  - Proposal follow-up
  - Project updates
  - Invoice reminders
  - Feedback requests
```

**Example Templates:**

*Lead Follow-up (Day 1):*
```
Subject: Great chatting, {{lead.first_name}}!

Hi {{lead.first_name}},

Thanks for reaching out about {{lead.project_type}}.
Based on what you shared, I think we could help
{{lead.company_name}} {{value_proposition}}.

I'd love to learn more about your timeline and goals.
Are you available for a quick call this week?

{{calendar_link}}

Best,
{{sender.first_name}}
```

*Proposal Follow-up (Day 3):*
```
Subject: Quick question about your {{project_type}} proposal

Hi {{lead.first_name}},

I wanted to check in on the proposal I sent over.
Have you had a chance to review it?

If you have any questions or would like to discuss
the options, I'm happy to jump on a quick call.

{{calendar_link}}

Best,
{{sender.first_name}}
```

**Best Practices:**

*Template Design:*
- Personalize beyond just name
- Keep subject lines short (<50 chars)
- Clear call-to-action
- Mobile-friendly formatting
- Match brand voice

*Variables System:*
```typescript
const availableVariables = {
  lead: ['first_name', 'last_name', 'email', 'company_name', 'project_type'],
  client: ['first_name', 'last_name', 'company_name'],
  project: ['name', 'start_date', 'end_date', 'status'],
  sender: ['first_name', 'last_name', 'title', 'phone'],
  system: ['calendar_link', 'portal_link', 'proposal_link'],
};
```

*Performance Tracking:*
- Track open rates by template
- Track response rates
- A/B test subject lines
- Iterate based on data
- Archive underperforming templates

---

### Email Integration

Bi-directional email sync.

**Status:** Deferred (portal chat is source of truth; only access-link email is allowed)

**Core Features:**
- Automatic email logging
- Send from CRM
- Thread organization
- Contact matching
- Activity creation

**Integration Approaches:**

*Option A: BCC Dropbox*
```
Setup:
1. Generate unique email: agency-abc123@mail.yourcrm.com
2. User BCCs this address on relevant emails
3. System parses and logs email

Pros: Simple, no OAuth, privacy-friendly
Cons: Manual, easy to forget
```

*Option B: OAuth Integration*
```
Setup:
1. User connects Gmail/Outlook via OAuth
2. System syncs relevant emails automatically
3. Match by contact email address

Pros: Automatic, complete history
Cons: Privacy concerns, OAuth complexity
```

*Option C: Email API (Nylas/Postmark)*
```
Setup:
1. Connect to email API service
2. Configure sync rules
3. API handles OAuth complexity

Pros: Reliable, maintained
Cons: Additional cost, third-party dependency
```

**Best Practices:**

*Email Matching:*
```typescript
function matchEmailToRecord(email: Email): Match | null {
  // 1. Check recipients against known contacts
  const contacts = [email.from, ...email.to, ...email.cc];

  for (const contact of contacts) {
    // Check leads
    const lead = await findLeadByEmail(contact);
    if (lead) return { type: 'lead', id: lead.id };

    // Check clients
    const client = await findClientByEmail(contact);
    if (client) return { type: 'client', id: client.id };
  }

  return null; // Unknown contact
}
```

*Thread Management:*
- Group by thread ID or subject
- Show latest reply on top
- Collapse long threads
- Track who replied (internal vs external)

*Privacy:*
- Only sync work emails (filter personal)
- Allow user to exclude specific threads
- Clear data retention policy
- Comply with email provider ToS

---

### Automated Follow-up Reminders

Never forget to follow up.

**Core Features:**
- Manual reminder setting
- Automatic inactivity triggers
- Multi-channel delivery
- Snooze and dismiss
- Escalation rules

**Data Model:**
```sql
reminders (
  id, entity_type, entity_id,
  reminder_type, -- manual, auto_inactivity, sequence
  due_at, message,
  assigned_to, created_by,
  completed_at, snoozed_until,
  notification_sent_at
)

reminder_rules (
  id, name, entity_type,
  condition, -- days_inactive > 7
  delay_days, message_template,
  assigned_to_type, -- owner, creator, specific_user
  is_active
)
```

**Trigger Examples:**

*Manual:*
- "Remind me to follow up in 3 days"
- "Remind Sarah about proposal next Monday"

*Automatic:*
- Lead untouched for 7 days → Remind owner
- Proposal viewed but no response in 3 days → Remind
- Task overdue (current date past due_date and not done) → Remind assignee + owner

*Sequence:*
- Day 3: First follow-up
- Day 7: Second follow-up
- Day 14: Final follow-up
- Day 21: Archive consideration

**Best Practices:**

*Notification Design:*
- Clear, actionable message
- One-click action (call, email, complete)
- Context included (last interaction, deal value)
- Priority indicator
- Easy snooze options

*Preventing Fatigue:*
- Batch similar reminders
- Daily digest option vs real-time
- Smart scheduling (not outside work hours)
- Learn from dismissal patterns
- Allow bulk actions

---

### Workflow Automation

Reduce manual work with triggers and actions.

**Core Features:**
- Visual workflow builder
- Trigger on any event
- Conditional logic
- Multiple action types
- Execution logging

**Data Model:**
```sql
automations (
  id, name, description,
  trigger_type, trigger_config,
  is_active, created_by,
  run_count, last_run_at
)

automation_conditions (
  id, automation_id, sort_order,
  field, operator, value,
  logic_operator -- AND, OR
)

automation_actions (
  id, automation_id, sort_order,
  action_type, action_config,
  delay_minutes
)

automation_logs (
  id, automation_id, trigger_entity,
  started_at, completed_at,
  status, error_message
)
```

**Trigger Types:**
- Record created
- Record updated
- Field changed
- Status changed
- Date reached
- Webhook received
- Manual trigger

**Action Types:**
- Create record
- Update record
- Send email
- Send notification
- Create task
- Assign to user
- Call webhook
- Delay/wait

**Example Workflows:**

*Lead Conversion:*
```yaml
Trigger: Lead status changed to "converted"

Actions:
  1. Create client record (copy lead data)
  2. Create project record (if project_type specified)
  3. Send welcome email to client
  4. Notify owner
  5. Create onboarding task
```

*Invoice Overdue:*
```yaml
Trigger: Invoice due_date passed AND status = "sent"

Conditions:
  - Days overdue >= 7

Actions:
  1. Update status to "overdue"
  2. Send reminder email to client
  3. Notify owner
  4. If days >= 14, escalate to owner
```

**Best Practices:**

*Building Automations:*
- Start simple, add complexity as needed
- Test with single record before enabling
- Include failure handling
- Log all actions for debugging
- Version control automation changes

*Avoiding Loops:*
- Prevent automation from triggering itself
- Limit recursion depth
- Detect and break infinite loops
- Rate limit execution
- Alert on unusual patterns

---

### Internal Comments

Internal notes on records (you + any collaborators).

**Core Features:**
- Comments on any entity
- @mentions with notifications
- Threaded replies
- Rich text support
- Activity feed

**Data Model:**
```sql
comments (
  id, entity_type, entity_id,
  content, content_html,
  parent_id, -- for threading
  created_by, created_at,
  updated_at, is_deleted
)

comment_mentions (
  id, comment_id, user_id,
  notified_at
)

comment_reactions (
  id, comment_id, user_id,
  reaction -- emoji
)
```

**Best Practices:**

*Comment UX:*
- Inline commenting (no page navigation)
- Real-time updates via WebSocket
- Optimistic UI for fast feel
- Collapse long threads
- Jump to new comments

*@Mentions:*
- Autocomplete on @ symbol
- Show user avatar in suggestions
- Notify immediately
- Link to profile
- Highlight mention in comment

*Separate from Client Communication:*
- Internal comments vs interactions
- Clear visual distinction
- Never expose internal comments to client
- Audit log for compliance
- Archive with record

---

## Documents & Contracts

### Proposal Builder

Create professional proposals in-app.

**Core Features:**
- Drag-and-drop editor
- Content blocks library
- Dynamic pricing tables
- Branding customization
- PDF export

**Content Blocks:**

```yaml
block_types:
  - text: Rich text content
  - heading: Section header
  - image: Single image
  - gallery: Image collection
  - pricing_table: Line items with totals
  - timeline: Project phases
  - team: Your bio / collaborator bios
  - testimonial: Client quote
  - case_study: Previous work
  - terms: Legal terms
  - signature: E-signature field
```

**Best Practices:**

*Editor Design:*
- Block-based (like Notion)
- Inline editing
- Drag handles visible on hover
- Add block between existing blocks
- Keyboard shortcuts

*Pricing Tables:*
```
| Item                    | Qty | Rate    | Total     |
|-------------------------|-----|---------|-----------|
| Website Design          | 1   | $8,000  | $8,000    |
| Development             | 1   | $12,000 | $12,000   |
| Content Migration       | 1   | $2,000  | $2,000    |
| [Optional] SEO Setup    | 1   | $3,000  | $3,000    |
|-------------------------|-----|---------|-----------|
| Subtotal                |     |         | $22,000   |
| Optional Items          |     |         | $3,000    |
| Total (if all selected) |     |         | $25,000   |
```

*PDF Generation:*
- Server-side rendering for consistency
- Embedded fonts
- Print-optimized layout
- Proper page breaks
- Clickable links

---

### Contract Templates

Standard agreements ready to customize.

**Core Features:**
- Template library
- Variable substitution
- Clause library
- Version tracking
- Compliance checking

**Template Types:**

*Master Services Agreement (MSA):*
- Governs overall relationship
- Payment terms
- IP ownership
- Confidentiality
- Liability limits
- Termination clauses

*Statement of Work (SOW):*
- Specific project scope
- Deliverables list
- Timeline
- Pricing
- Acceptance criteria
- References MSA (generated from accepted proposal)

*Non-Disclosure Agreement (NDA):*
- Mutual or one-way
- Definition of confidential info
- Exclusions
- Term and survival
- Return of materials

**Best Practices:**

*Variable System:*
```
{{client.legal_name}}
{{client.address}}
{{project.name}}
{{project.start_date}}
{{pricing.total}}
{{today_date}}
```

*Clause Library:*
- Pre-approved legal language
- Drag into templates
- Track clause versions
- Flag non-standard clauses
- Legal review workflow (you or external counsel)

*Review Process:*
- Legal review for non-standard terms (you or external counsel)
- Approval workflow before send
- Redline comparison
- Negotiation tracking
- Final version locking

---

### E-Signatures

Get contracts signed digitally.

**Core Features:**
- Document preparation
- Signature field placement
- Multi-signer support
- Audit trail
- Legal compliance

**Integration Options:**

| Provider | Pros | Cons |
|----------|------|------|
| DocuSign | Industry standard, compliant | Expensive |
| HelloSign | Simple, good UX | Less features |
| PandaDoc | Full proposal + sign | Higher cost |
| SignWell | Affordable | Less known |
| Built-in (Portal) | Full control, no per-sign cost | Dev effort, compliance risk |

**Best Practices:**

*Document Preparation:*
- Clear signing instructions
- Visible signature placement
- Required vs optional fields
- Initial fields for multi-page
- Date auto-fill

*Portal E-Sign Preference:*
- Keep signing inside the client portal
- Capture drawn signature + name + timestamp + IP
- Lock document after signing

*Signing Flow:*
```
1. Sender prepares document
2. Assigns signers and fields
3. Signers receive email invitation
4. Signer authenticates (email/SMS)
5. Signer reviews and signs
6. All parties notified
7. Executed document distributed
8. Stored with audit trail
```

*Compliance:*
- ESIGN Act / UETA compliance
- Audit trail with timestamps
- Signer authentication
- Document integrity (hash)
- Long-term storage format (PDF/A)

---

### Document Storage

Centralized file management.

**Core Features:**
- Hierarchical organization
- Search and filtering
- Version management
- Access control
- Audit logging

**Best Practices:**

*Storage Architecture:*
```
Options:
1. Supabase Storage: Integrated, simple
2. AWS S3: Scalable, cost-effective
3. Google Cloud Storage: Good for Google ecosystem
4. Cloudflare R2: No egress fees

Recommendations:
- Use object storage, not filesystem
- Supabase Storage is the default choice
- Signed URLs for secure access
- CDN for frequently accessed files
- Separate buckets by sensitivity
```

*File Organization:*
```
/clients
  /{client_id}
    /contracts
    /deliverables
    /correspondence
/projects
  /{project_id}
    /briefs
    /client_uploads
    /design
    /development
    /final
/templates
  /proposals
  /contracts
```

*Metadata:*
```sql
files (
  id, storage_path, filename, mime_type,
  size_bytes, checksum,
  entity_type, entity_id,
  tags, description,
  uploaded_by, uploaded_at,
  access_level -- internal, client, public
)
```

---

## Notifications & Alerts

### Deadline Reminders

Stay on top of due dates.

**Core Features:**
- Configurable reminder timing
- Multi-channel delivery
- Snooze and acknowledge
- Escalation paths
- Calendar integration

**Reminder Schedule:**
```yaml
task_reminders:
  - trigger: due_date - 1 day
    message: "Task due tomorrow"
    channels: [in_app]
    condition: status != "Done"

  - trigger: due_date
    message: "Task due today"
    channels: [in_app]
    condition: status != "Done"

  - trigger: due_date + 1 day
    message: "Task overdue"
    channels: [in_app]
    escalate_to: owner
    condition: status != "Done"

  - trigger: due_date + 3 days
    message: "Task overdue 3 days"
    channels: [in_app]
    escalate_to: [owner]
    condition: status != "Done"
```

**Best Practices:**

*Timing:*
- Respect timezone and work hours
- Don't notify at night
- Batch low-priority notifications
- Instant for critical items

*Channel Selection:*
- In-app only (single source of truth)

---

### Activity Alerts

Know what's happening in real-time.

**Core Features:**
- Event-driven notifications
- Customizable preferences
- Activity feed view
- Read/unread tracking
- Bulk actions

**Alert Types:**
```yaml
alert_types:
  lead_assigned:
    message: "You were assigned to lead: {{lead.name}}"
    default_channels: [in_app]

  proposal_viewed:
    message: "{{lead.name}} viewed your proposal"
    default_channels: [in_app]

  payment_received:
    message: "Payment received: {{amount}} from {{client.name}}"
    default_channels: [in_app]

  mention:
    message: "{{actor.name}} mentioned you in {{entity.type}}"
    default_channels: [in_app]
```

**Best Practices:**

*User Preferences:*
```sql
notification_preferences (
  user_id, alert_type,
  in_app_enabled
)
```

*Batching:*
- Immediate: Assignments, mentions, urgent
- Hourly digest: Low-priority activity
- Daily digest: Summary and stats

---

### Inactivity Warnings

Catch neglected relationships.

**Core Features:**
- Configurable thresholds
- Multi-entity support
- Escalation rules
- Bulk remediation

**Configuration:**
```yaml
inactivity_rules:
  client_inactive:
    entity: client
    condition: days_since_last_interaction > 30
    alert_to: owner
    message: "No activity with {{client.name}} in 30 days"

  project_stalled:
    entity: project
    condition: days_since_task_update > 14
    alert_to: owner
    message: "Project {{project.name}} has no updates in 14 days"

  lead_cold:
    entity: lead
    condition: days_in_stage > 14
    alert_to: assigned_to
    escalate_after: 7 days
    escalate_to: owner
```

---

## Reporting & Analytics

### KPI Dashboard

Executive overview of agency health.

**Core Features:**
- Configurable widgets
- Real-time data
- Drill-down capability
- Export and sharing
- Goal tracking

**Key Metrics:**

*Financial:*
- Revenue (MTD, QTD, YTD)
- Revenue vs target
- Outstanding AR
- Cash flow forecast
- MRR growth

*Sales:*
- Pipeline value
- Win rate
- Average deal size
- Sales cycle length
- Leads this month

*Operations:*
- Team utilization
- Project health summary
- On-time delivery rate
- Client satisfaction (NPS)

**Best Practices:**

*Dashboard Design:*
- Limit to 8-12 widgets
- Most important at top-left
- Consistent time periods
- Clear comparisons (vs last period)
- Mobile-responsive

*Performance:*
- Pre-compute aggregates
- Cache with TTL
- Incremental updates
- Background refresh

---

### Custom Reports Builder

Ad-hoc reporting for any question.

**Core Features:**
- Data source selection
- Field picker
- Filter builder
- Grouping and sorting
- Visualization options
- Save and schedule

**Architecture:**
```sql
saved_reports (
  id, name, description,
  data_source, -- leads, clients, projects, etc.
  selected_fields,
  filters, -- JSON
  group_by, sort_by,
  chart_type, chart_config,
  created_by, is_shared
)

scheduled_reports (
  id, report_id, frequency,
  recipients, next_run_at
)
```

**Best Practices:**

*Query Building:*
- Validate field access permissions
- Limit result set size
- Timeout long queries
- Cache common reports

*Export Options:*
- CSV for data analysis
- PDF for presentation
- Excel for complex data
- API for integration

---

## Integrations

### Xero Integration

Primary accounting system (source of truth for invoices + payments).

**Features:**
- Sync client contacts to Xero
- Create invoices from milestones + change requests
- Pull invoice status + payment updates
- Download/store invoice PDFs in Docs Vault
- Webhook or scheduled sync for reliability

**Data Model:**
```sql
xero_connections (
  id, access_token, refresh_token,
  tenant_id, expires_at, created_at
)

clients (
  ...
  xero_contact_id
)
```

### Calendar Sync

Keep meetings in sync.

**Features:**
- Two-way sync
- Auto-log meetings as interactions
- Availability checking
- Meeting scheduling

**Implementation:**
- Google Calendar API
- Microsoft Graph API
- CalDAV for others

---

### Slack Integration

Team notifications where you work.

**Features:**
- Channel notifications
- Slash commands
- Interactive buttons
- Direct messages

**Commands:**
```
/crm search [query] - Search leads, clients
/crm lead [email] - Quick lead lookup
/crm pipeline - Show pipeline summary
/crm tasks - Show my tasks due today
```

---

### Zapier / Make

Connect to thousands of apps.

**Triggers:**
- New lead
- Lead status change
- New client
- Project created
- Invoice paid

**Actions:**
- Create lead
- Update lead
- Create task
- Log interaction

---

## Priority Ranking

**Foundational (do alongside Tier 1):**
- Agency settings & defaults
- Global search & quick actions
- Activity & change history
- Data portability & backups
- Client onboarding & offboarding
- Change requests (scope control)
- Lead → Project conversion flow
- Xero integration (invoice sync)

**Already Built (avoid redoing):**
- Leads list + kanban pipeline
- Projects + clients list/detail
- Project task board (kanban/list)
- Global search + command palette

### Tier 1 - Core Business Needs (Implement First)
1. **Invoicing System** - Get paid efficiently
2. **Time Tracking** - Know where hours go
3. **Proposal System** - Close deals faster
4. **Payment Tracking** - Manage cash flow
5. **Follow-up Reminders** - Never lose a deal

### Tier 2 - Growth & Efficiency
6. Revenue Dashboard
7. Utilization Reports
8. Project Templates
9. Lead Scoring
10. Client Portal (basic)

### Tier 3 - Scale & Sophistication
11. Workflow Automation
12. E-Signatures
13. Pipeline Forecasting
14. Resource Allocation
15. Custom Reports

---

## Implementation Approach

**Phase 1: Foundation (Months 1-3)**
- Platform foundations (settings, search, activity log, backups)
- Client onboarding + change requests
- Lead → project conversion
- Xero integration (contacts + invoices)
- Invoicing + Payments
- Time Tracking
- Basic reporting

**Phase 2: Sales (Months 4-6)**
- Proposal builder
- Lead scoring
- Email templates (deferred)

**Phase 3: Operations (Months 7-9)**
- Project templates
- Milestones
- Client portal (docs + chat)

**Phase 4: Intelligence (Months 10-12)**
- Automation workflows
- Advanced analytics
- Integrations

---

## Time Tracking (Contractors)

> Moved from MVP stages - implement when you hire contractors.

### Goal
Allow contractors to log time manually, and lock entries weekly based on settings.

### Data Model
```sql
-- Contractor flag
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS employment_type text NOT NULL DEFAULT 'contractor';
-- allowed: contractor, staff

-- Time entries
CREATE TABLE time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES agency_projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  hours numeric NOT NULL,
  description text NOT NULL,
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Features
- Contractor-only access
- Weekly lock schedule from agency settings
- Edits allowed until lock time, then read-only
- Time entries logged against tasks (preferred) or directly against a project
- No payroll or payouts in scope

### Implementation Notes
- Server action `createTimeEntry(data)` - only contractors allowed
- Server action `updateTimeEntry(id, data)` - blocked if `locked_at` set
- Cron job `lockWeeklyTimesheets()` - sets `locked_at` for entries before lock cutoff
- Contractor "Time" page: add/edit entries for a date, with optional task selection
- Admin view: list all entries (read-only if locked)

---

*Last updated: January 2026*
