Cross‑Cutting

  - Permissions/RLS: are we enforcing row‑level security in Supabase, or relying solely on server actions? Which roles exist (owner/admin/employee) and what can each do?
        RLS if thats best


  - Storage: confirm bucket names, signed URL expiry, and who can download contract docs vs uploads; any retention or delete policy?
    clients can download docs, n=but they persist in db, they cant delete


  - Global search: what is the exact search implementation today (table, view, or RLS‑safe RPC), and how are new entities indexed/updated?
    use best solution


  - Audit trail: should key actions (lead conversion, proposal signed, invoice paid) create timeline entries or a separate audit log?
    timeline entries


  - Email: when is the “one‑off access link email” triggered, and do we need to track delivery status or handle resend requests?
    once proposal is sent, as proposal will be in the portal


  - Environments: for local dev, should we use vercel env pull only, or is a local .env allowed?
    dont mind

  Stage 0 — Foundation Fixes

  - Lead task removal: confirm there are zero legitimate lead‑level tasks, or should we migrate them to project tasks instead of deleting UI?
  no lead tasks at this stage

  - Interaction timeline: do we need a separate “internal notes” table or keep using existing schema?
  existing

  Stage 1 — Lead → Project Conversion

  - Lead contact data: what happens if the lead has no email or name? Is conversion blocked or do we prompt for missing fields?
    we need both, has to be present

  - Client match rules: exact email match (case‑insensitive) only, or should we also match by company/ABN/domain?
    best solution

  - Duplicate contacts: if multiple leads share an email, should we prevent conversion or allow multiple projects per client?
    multiple projects per client are allowed, but they probably wont go through lead process again, but allow it

  - Project defaults: which fields are required on creation (status, type, owner, start date, budget)?
    whats best?

  - Lead archival: should archived leads be excluded from search by default, or still searchable with a filter?
    yes, arhcive search seperate

  Stage 2 — Agency Settings

  - Currency/timezone options: fixed list or free‑text? Which source of truth (IANA timezones)?
  - Invoice terms: should terms be free‑text only or also convert to a due‑date rule (e.g., Net 14)?
  - Deposit % override: where is the per‑project override entered (new project modal only, or editable later)?
  - Single‑row settings: enforce one row via constraint/unique index, or soft‑enforce in code?
  - Integration file copy: should we keep original module paths in new lib/integrations/*, or refactor imports to a common wrapper now?

  Stage 3 — Proposals + Contracts

  - Proposal content schema: define JSON shape (sections, pricing blocks, totals, optional line items, terms).
    figure this out

  - Versioning: is a new version created on every edit, or only when “Create new version” is clicked?
    new version each edit, with history, we have a similar setup in JARVE Painting

  - Sending: do we allow sending multiple versions, and how do we track which version was sent?
    yes, we have this in JARVE Painting


  - Signature requirements: typed name only vs drawn signature required; must client accept terms checkbox?
        name, sig, timestamp, IP

  - MSA lifecycle: what happens if an MSA must be updated (new version vs replace existing)?
    signed and stored in docs plus audit, keep old

  - PDF generation: preferred library/approach and file naming/path convention in storage.
    find the best library for our stack

  Stage 4 — Client Portal

  - Portal chat: should the admin see chat in the admin UI? Any internal‑only notes within the chat view?
    yes in admin UI

  - Webhook: where should “new chat message” go (Slack, Zapier, custom endpoint), and required payload fields?
    in our portal

  - Upload limits: max file size, allowed file types, and virus scanning approach (provider + failure behavior).
    pdf, docx, jpg, png, all the standard

  - Read state: is portal_read_state needed for unread badges, and should it track per‑project and per‑user?
    not sure, best practic

  - Token lifecycle: do we allow multiple active tokens per client user, and do we log regeneration history?
  I don't know what tokens mean. Either explain it to me more simply or do what's best.

  Stage 5 — Xero + Stripe

  - Tenant handling: if multiple Xero tenants exist, how do we select/persist, and can it change later?
  There shouldn't be multiple tenants. This is just for me.

  - Contact mapping: should we create/update Xero contacts from CRM or only link existing contacts?
    We should be able to create them in Xero from our portal.

  - Invoice line items: standard format (e.g., milestone title + description) and rounding rules?
Standard format.

  - Tax codes: which Xero tax rate should be used for GST 10% exclusive (name/code)?
Just GST? I'm not sure what you mean.

  - Due date logic: plan says “due on invoice date,” but Stage 2 stores invoice terms — which wins?
Invoice due on date always

  - Manual “Mark Paid”: which Xero bank account should be used and can it be configured in settings?
The bank account should be in zero already.

  - Stripe flow: confirm using Checkout vs Payment Intents, and where to store Stripe charge IDs.
  Dunno I figured this out.

  Stage 6 — Milestones + Change Requests

  - Deposit amount: 50% of what exact total (proposal total, project budget field, or manual entry)?
  Proposal total.

  
  - Project budget: does a project currently store total contract value? If not, where do we add it?
  I'm not sure you have to check that and do what's best practice.
  
  - Milestone invoice payload: one line item per milestone or include itemized sub‑lines?
  One line item per milestone.
  
  - Duplicate invoice prevention: should completeMilestone be idempotent or require a confirm modal?
  Don't know what you mean. Do what's best.
  
  
  - Change requests: do we need “reject with reason” and revision flow, or just signed/rejected?
  Reject with reason is probably a good idea.
  
  - Change request docs: should signed change requests also appear in contract_docs with doc_type?
Yes


  Stage 7 — Reminders

  - “Overdue” definition: use agency timezone or user timezone? Is “due today” included?
  Use my timezone.
  
  
  - Frequency: daily only, or should we allow configurable cadence later (weekly/monthly)?
  Daily, but make it configurable in settings.
  
  - Duplicate prevention: unique index blocks re‑reminders — is that desired, or should we allow periodic reminders?
  Yes, prevent duplicates.
  
  - Event notifications: should we also create immediate notifications (proposal signed, invoice paid) in addition to overdue?

  Yes.


  Follow‑ups

  - RLS roles: should employees see all clients/projects or only ones they’re assigned to? Can employees see financials (invoices/payments) or only owner/admin?
Only ones that are assigned to

  - Storage: confirm signed URL expiry (e.g., 1 hour vs 24 hours) and whether admins can delete files or nothing is ever deleted.
Admins can delete. I'm not sure what's the best timing for the URO expiry, though. I don't really know what that means.

  - Global search: OK to implement a single search_index table with triggers + tsvector FTS, or do you want per‑entity queries only? Any entities you want excluded by default?
  That sounds good.

  Stage 1

  - Client match rules: confirm exact email match (case‑insensitive) only, or also match by company name/ABN if email doesn’t match.
Exact email address.

  - Project defaults on conversion: should status = planning and type = web by default? Should assigned_to be required (lead owner vs current user)?
  Yep, those defaults are fine. assigned_to shouldn't be required at this stage.

  Stage 2

  - Currency/timezone: full list vs curated (e.g., only AU/NZ/US)? For timezone, full IANA list or Australia‑only list?
I'm hoping to do projects all over the world, so I'll be doing everything in Australian currency, but it probably could be converted to wherever that project is from.

  - Invoice terms: should this be display‑only text (since due date is always issue date), or should we also store numeric “Net X” for future use?
Do what's best.

  - Deposit override: editable only at project creation or also later in project settings?
Project Creation

  - Single‑row settings: enforce with a DB constraint (singleton key) or enforce in code only?
Do what's best.

  - Integration file copy: keep file paths exactly as in jarve‑website (minimal changes) or wrap in a new lib/integrations/index now?
We need to just make sure it works for ours. If it works as is, that's fine. Otherwise, we probably want all the code into this project, though we're not referencing the other one in case that changes. Probably just make sure that the code is in this project as well.


  Stage 3

  - Proposal JSON shape: confirm OK with something like:
      - sections: [{ id, type: 'text'|'list'|'pricing'|'image', title, body, items, order }] 
yes all good


  - PDF generation: prefer @react-pdf/renderer (server‑side), or HTML‑to‑PDF (Playwright/Puppeteer)? Any hosting constraints on Vercel?
  What's the best user experience? Choose that.

  Stage 4

  - Read state: should we add portal_read_state now for unread badges?
Yes, please.

  - Tokens (simple): a token is the long secret link that lets a client log into the portal without a password. Recommended: one active token per client user; regenerating a link revokes the old one, and we
    keep revoked tokens for audit. OK?
    Yes, sounds good.

    Open decisions

  - RLS scope for financials: should employees see invoices/payments for assigned projects, or only owner/admin? (recommend: owner/admin only; employees can read assigned project + tasks)
  No, only owner sees price.
  - Signed URL expiry for downloads (docs/uploads): pick a duration. (recommend: 1 hour; regenerate on each request)
  Do you wanna help?
  - Currency/timezone UI: allow full ISO currency list + full IANA timezone list, default AUD + Australia/Adelaide? Or lock currency to AUD only for now? (recommend: full lists, default AUD)
  Do the recommendation.
  - Invoice terms: store text only, or add optional invoice_terms_days for future while still keeping due date = issue date? (recommend: store text + optional days field, not used yet)
  Do the recommendation.
  - Single‑row agency settings: enforce with a DB singleton constraint? (recommend: singleton boolean with unique index to guarantee one row)
  Do the recommendation.
  - PDF generation: HTML→PDF (Chromium) for best fidelity vs @react-pdf/renderer for simplicity? (recommend: HTML→PDF for better UX)
  Do the recommendation.
  - “Webhook on new chat message”: do you want an external webhook endpoint, or just internal in‑app notifications/timeline entries? (recommend: internal only; skip external webhook)
  Do the recommendation. but i think theres a great webhook library out there
  - Uploads: max file size + virus scanning. (recommend: 50MB limit; skip virus scan for MVP unless you want a provider)
  Do the recommendation.

  - Xero tax code: please provide the exact tax rate name/code from Xero for GST 10% exclusive (e.g., “GST on Income”, code “OUTPUT”).
GST on Income

  - Mark Paid bank account: choose bank account via a setting, or auto‑pick first active bank account in Xero? (recommend: add optional setting with fallback to first active)
  auto

  - Contract value source: should we add contract_value to agency_projects and require it at conversion, or should the deposit invoice/milestone be created when the proposal is signed? (recommend: create
    deposit after proposal signed to guarantee value)
Do the recommendation.

  - Duplicate invoice prevention: OK to make completeMilestone idempotent + confirm modal? (recommend: yes) Do the recommendation.