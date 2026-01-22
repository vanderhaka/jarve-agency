# Jarve Agency - Claude Instructions

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
