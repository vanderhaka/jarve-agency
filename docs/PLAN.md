# Jarve Agency CRM - Master Plan Index

This is the single entry point for planning. Start here before writing code.

## Non-Negotiables
- TDD for data rules and external integrations.
- Manual checklist required for each stage.
- Do not start the next stage until tests + manual checks pass.
- Reuse working code from `/Users/jamesvanderhaak/Desktop/Development/jarve-website`.
- Use Vercel CLI for env keys (no manual copying).

## Core Planning Files
- `IMPLEMENTATION-PLAN.md` - gated plan, data flows, and stage order.
- `FUTURE-IDEAS.md` - backlog and optional ideas (not MVP).
- `manual-tests/README.md` - index of all manual test checklists.
- `docs/ERROR-RECOVERY.md` - playbook for stuck states (Xero/Stripe failures).

## Status Tracking
Each stage has a STATUS file for quick progress checks:
- `docs/status/STATUS-stage-0.md` ... `STATUS-stage-7.md`
- Shows: current task, blockers, completed items
- Read STATUS files instead of full stage files during active work

## Database Migrations
SQL changes are extracted to numbered migration files:
- `supabase/migrations/YYYYMMDD_XX_stage_N_description.sql`
- Match migrations to stage numbers for traceability

## Stage Files (Step-by-step)
- `docs/stages/00-stage-0-foundation-fixes.md`
- `docs/stages/01-stage-1-lead-to-project.md`
- `docs/stages/02-stage-2-platform-foundations.md`
- `docs/stages/03-stage-3-proposals-contracts.md`
- `docs/stages/04-stage-4-client-portal.md`
- `docs/stages/05-stage-5-xero-stripe.md`
- `docs/stages/06-stage-6-milestones-change-requests.md`
- `docs/stages/07-stage-7-reminders.md`

> **Note:** Time Tracking moved to `FUTURE-IDEAS.md` - implement when you hire contractors.

## How to Use This Plan
1) Read `IMPLEMENTATION-PLAN.md` to understand the full flow.
2) Work one stage file at a time, in order.
3) Check `docs/status/STATUS-stage-N.md` for current progress.
4) Run automated tests and complete the matching manual checklist.
5) If something fails, check `docs/ERROR-RECOVERY.md` for stuck states.
6) Only proceed after the stage is signed off.
