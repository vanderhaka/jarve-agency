# Jarve Agency - Claude Instructions

use /o skill or command every time

## Testing Strategy

**Automate UI testing with Claude in Chrome wherever possible.**

See `.claude/rules/ui-testing.md` for:
- Form input testing patterns
- Tab/modal navigation testing
- Error state verification
- Responsive layout testing
- GIF recording for test evidence
- Accessibility tree verification

## Database Operations

**MCP first, CLI last.**

| Priority | Tool |
|----------|------|
| 1st | Supabase MCP Server |
| 2nd | Migration files |
| Last | Supabase CLI (bash) |

See `.claude/rules/supabase-mcp.md` for:
- Migration workflow
- Query patterns
- Schema verification
- RLS policy testing

## Key Tools

| Tool | Purpose |
|------|---------|
| Claude in Chrome | UI testing, form validation, navigation |
| Supabase MCP | Database queries, migrations, schema ops |

## Testing Workflow

1. **Database setup** - Verify/seed data via Supabase MCP
2. **UI testing** - Automate with Claude in Chrome
3. **Verification** - Check database state via MCP
4. **Documentation** - Generate TESTING.md with results

## Vercel Environment Variables

**CRITICAL: Avoid trailing newlines when setting env vars!**

Using `echo` pipes a trailing newline into the value, breaking URLs and API keys:
```bash
# BAD - adds \n to the value
echo "https://jarve.com.au" | vercel env add NEXT_PUBLIC_SITE_URL production

# GOOD - no trailing newline
printf '%s' 'https://jarve.com.au' | vercel env add NEXT_PUBLIC_SITE_URL production
```

**Always use `printf '%s'` instead of `echo` when piping to `vercel env add`.**

To verify env vars are clean:
```bash
vercel env pull .env.check --environment=production
cat .env.check | od -c | head -20  # Check for embedded \n
rm .env.check
```
use vercel cli when needed