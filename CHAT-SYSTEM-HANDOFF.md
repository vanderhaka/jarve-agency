# Chat System Deep-Dive Handoff

Date: 2026-01-28  
Context: Client portal + admin chat system in `jarve-agency` needs to be secure, fast, and reliable. This file explains what was changed, why, and exactly what to do next.

---

## Goals

- Secure admin + client chat so no spoofing or RLS bypass.
- Fast realtime delivery (live updates on both portal and admin views).
- Optional webhook-driven fanout for integrations or DB-triggered events.
- Clear unread tracking and stable UI behavior (auto-scroll only when user is at the bottom).

---

## What was changed (and why)

### 1) Server actions hardened + broadcasting added
File: `lib/integrations/portal/actions/messages.ts`

Changes:
- **Removed client-supplied owner IDs**. `postOwnerMessage()` now derives the author from `requireEmployee()` on the server.
- **Added message validation** (trim + max length 2000).
- **Broadcast messages after insert** (unless `PORTAL_MESSAGES_WEBHOOK_MODE=webhook` is set).

Why:
- Client-supplied author IDs can be spoofed. Using `requireEmployee()` guarantees authenticated owners only.
- Input validation protects DB and ensures predictable UI.
- Broadcast makes chat realtime with minimal latency.

### 2) Realtime broadcast helpers
Files:
- `lib/integrations/portal/realtime.ts`
- `lib/integrations/portal/realtime-server.ts`

Changes:
- Defined channel naming and event key: `portal-chat:${projectId}` and `portal_message`.
- Added a server-side broadcaster using Supabase Realtime REST `/realtime/v1/api/broadcast`.

Why:
- Centralizes channel naming and event schema.
- Keeps realtime dispatch server-side and secure (uses service role key).

### 3) Webhook receiver (Standard Webhooks / Svix)
File: `app/api/webhooks/portal-messages/route.ts`

Changes:
- Added a webhook endpoint that validates either:
  - **Standard Webhooks signatures** (Svix library), or
  - **Simple token** (`x-webhook-token` header).
- Accepts both **Standard Webhooks** payloads and **Supabase DB webhook** payloads.
- Re-broadcasts messages over Realtime.

Why:
- Allows DB-triggered or external event sources to fan out messages.
- Standard Webhooks is a strong, battle-tested verification standard.

### 4) Portal UI realtime + unread state management
Files:
- `app/portal/[token]/components/chat-interface.tsx`
- `app/portal/[token]/components/portal-context.tsx`
- `app/portal/[token]/components/portal-tabs.tsx`

Changes:
- Chat subscribes to realtime broadcast and merges incoming messages.
- Unread counts are now stored in portal context and updated on new messages.
- Auto-scroll only when user is at the bottom.
- `project_id` added to message types to filter incoming events.

Why:
- Prevents stale data and makes chat feel instant.
- Unread counts now update live without a full refresh.
- Auto-scroll avoids hijacking the user when they scroll up.

### 5) Admin UI realtime + secure reads
Files:
- `app/admin/projects/[id]/tabs/chat/index.tsx`
- `app/admin/projects/[id]/chat/admin-chat-interface.tsx`
- `app/admin/projects/[id]/page.tsx`

Changes:
- Admin chat subscribes to realtime and merges incoming messages.
- Auto-scroll same as portal.
- `postOwnerMessage` called without userId.
- Admin message query now selects `project_id` (needed for realtime merge safety).

Why:
- Admin chat now live-updates with client messages.
- Eliminates spoofable author IDs.

### 6) Dependency added
File: `package.json`

Change:
- Added `svix` for Standard Webhooks verification.

Why:
- Top-tier webhook verification library for Standard Webhooks signatures.

---

## Current behavior summary

- Messages are stored in `portal_messages` (DB is source of truth).
- On insert, server actions broadcast over Realtime (unless webhook-only mode).
- Clients/admin subscribe to `portal-chat:${projectId}` and display new messages instantly.
- Portal unread counts increment on owner messages unless the user is actively viewing that project’s messages.

---

## Environment variables required

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional (webhooks):
- `PORTAL_MESSAGES_WEBHOOK_SECRET`  
  Used for Standard Webhooks verification (Svix). If set, incoming payloads must be signed.
- `PORTAL_MESSAGES_WEBHOOK_TOKEN`  
  Simple fallback. Incoming payloads must include `x-webhook-token` header.
- `PORTAL_MESSAGES_WEBHOOK_MODE=webhook`  
  If set to `webhook`, server actions will **not** broadcast directly, and you must send events via webhook.

---

## Exactly what to do next (in detail)

### A) Decide broadcast mode (recommended default is direct broadcast)

**Option 1 (recommended): Direct broadcast from server actions**
- Do nothing. This is already the default.
- Benefits: fastest delivery, fewer moving parts.
- Webhook endpoint stays available for future integrations.

**Option 2: Webhook-only broadcast**
- Set `PORTAL_MESSAGES_WEBHOOK_MODE=webhook`.
- Ensure a webhook sender calls `/api/webhooks/portal-messages` whenever a new message is created.
  - If you use Supabase DB webhooks:
    - Configure a webhook on `portal_messages` INSERT.
    - Send JSON payload with `record` (Supabase format).
    - Set `PORTAL_MESSAGES_WEBHOOK_TOKEN` and pass `x-webhook-token`.
  - If you use Standard Webhooks:
    - Sign the payload with Svix-style headers.
    - Set `PORTAL_MESSAGES_WEBHOOK_SECRET`.

### B) Configure Supabase Realtime

Supabase Realtime must be enabled for Broadcast:
- Ensure Realtime is enabled in Supabase project settings.
- No RLS is required for broadcast; it uses service role key for REST.
- Client subscriptions use anon key from `createClient()` and should work with Broadcast channels (no DB read).

### C) Verify message flow end-to-end

Manual checks:
1. Open admin project chat.
2. Open client portal chat (same project).
3. Send a message from client -> admin should receive instantly.
4. Send a message from admin -> client should receive instantly.
5. Unread badge should increment on portal tabs when client is not viewing messages.
6. When client views Messages tab, unread count should clear.

### D) Recommended follow-ups (if time)

1. **Rate limiting** on chat send endpoints (per user per minute).
2. **Message attachments** (storage + DB references).
3. **Typing indicators** (realtime broadcast-only, no DB).
4. **Error telemetry**: log webhook failures or broadcast failures to a table.

---

## Files touched (for quick diff review)

- `lib/integrations/portal/actions/messages.ts`
- `lib/integrations/portal/realtime.ts`
- `lib/integrations/portal/realtime-server.ts`
- `app/api/webhooks/portal-messages/route.ts`
- `app/portal/[token]/components/chat-interface.tsx`
- `app/portal/[token]/components/portal-context.tsx`
- `app/portal/[token]/components/portal-tabs.tsx`
- `app/admin/projects/[id]/tabs/chat/index.tsx`
- `app/admin/projects/[id]/chat/admin-chat-interface.tsx`
- `app/admin/projects/[id]/page.tsx`
- `package.json`
- `package-lock.json`

---

## Notes for the next agent

- The chat system **does not** currently use Supabase row‑level security for portal access; portal actions use service role + explicit token validation.
- If anything looks broken, check these first:
  - `SUPABASE_SERVICE_ROLE_KEY` missing
  - Realtime not enabled
  - Webhook mode enabled but no webhook sender configured
  - Token validation failing (`client_portal_tokens`)
  - Missing `project_id` in message payloads

If you change payload shapes or event names, update:
- `PORTAL_CHAT_EVENT` in `lib/integrations/portal/realtime.ts`
- Message type definitions in chat components
- Webhook parser in `app/api/webhooks/portal-messages/route.ts`
