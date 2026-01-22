# Supabase MCP Server

> Use the Supabase MCP server for all database operations and migrations.

## Core Principle

**MCP first, CLI last.**

| Priority | Tool | When to Use |
|----------|------|-------------|
| 1st | Supabase MCP Server | All database queries, schema checks, data operations |
| 2nd | Migration files | Version-controlled schema changes |
| Last resort | Supabase CLI (bash) | Only when MCP cannot accomplish the task |

The MCP Supabase server provides authenticated, safe access to database operations with proper error handling and connection management. Use CLI commands only when MCP lacks the specific capability needed.

---

## Available Operations

### Query Execution
- Run SELECT queries to fetch data
- Execute INSERT/UPDATE/DELETE for data manipulation
- Run complex JOINs and aggregations

### Schema Operations
- Create/alter/drop tables
- Manage indexes
- Define foreign keys and constraints

### Migration Management
- Apply pending migrations
- Track migration history
- Rollback when needed

---

## When to Use Each Tool

### MCP Server (Default Choice)
- Running database queries during development
- Testing database operations
- Verifying migration results
- Debugging data issues
- Schema introspection
- Seeding test data
- Checking RLS policies
- Data validation

### Migration Files
- Production schema changes
- Version-controlled database changes
- Team-shared database updates

### CLI via Bash (Last Resort Only)
Use Supabase CLI commands only when MCP cannot:
- Generate TypeScript types (`supabase gen types`)
- Start/stop local Supabase (`supabase start/stop`)
- Push migrations to remote (`supabase db push`)
- Link to remote project (`supabase link`)
- Database dump/restore operations

**Always try MCP first before falling back to CLI.**

---

## Migration Workflow

### 1. Create Migration File

```bash
# Create new migration in supabase/migrations/
# Format: YYYYMMDDHHMMSS_description.sql
supabase/migrations/20260123120000_add_user_preferences.sql
```

### 2. Write Migration SQL

```sql
-- Migration: Add user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for user lookups
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

### 3. Apply Migration via MCP

Use the Supabase MCP server to apply the migration and verify results.

### 4. Verify Migration

Query the database through MCP to confirm:
- Table exists
- Columns are correct
- Indexes are created
- Constraints are in place

---

## Common Patterns

### Checking Table Schema

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'your_table'
ORDER BY ordinal_position;
```

### Checking Indexes

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'your_table';
```

### Checking Foreign Keys

```sql
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'your_table';
```

### Checking Row Level Security

```sql
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'your_table';
```

---

## Best Practices

### Migrations

1. **One change per migration** - Keep migrations focused
2. **Idempotent when possible** - Use `IF NOT EXISTS`, `IF EXISTS`
3. **Always include rollback plan** - Comment the reverse operation
4. **Test locally first** - Apply to local DB before production
5. **Never edit applied migrations** - Create new migration instead

### Queries via MCP

1. **Use parameterized queries** - Prevent SQL injection
2. **Limit result sets** - Add LIMIT for large tables
3. **Verify before DELETE/UPDATE** - Run SELECT first
4. **Check affected rows** - Confirm expected count

### Testing Database Changes

1. Query table structure after migration
2. Insert test data to verify constraints
3. Check RLS policies are working
4. Verify cascade deletes behave correctly

---

## Integration with Testing

### Before UI Tests

```markdown
1. Verify database is in expected state via MCP
2. Seed necessary test data
3. Run UI tests with Claude in Chrome
4. Verify database state changed correctly
```

### After UI Tests

```markdown
1. Query database to verify expected changes
2. Check for orphaned records
3. Verify timestamps updated
4. Clean up test data if needed
```

---

## Troubleshooting

### Connection Issues
- Verify Supabase MCP server is enabled in settings
- Check project credentials are correct
- Ensure local Supabase is running if testing locally

### Migration Failures
- Check SQL syntax
- Verify referenced tables exist
- Check for constraint violations
- Review migration order dependencies

### Query Errors
- Verify table/column names
- Check data types match
- Review RLS policies for access issues
- Check for null constraint violations

---

## Quick Reference

| Task | Approach |
|------|----------|
| Read data | MCP query |
| Write data | MCP query |
| Schema changes (dev) | MCP or migration file |
| Schema changes (prod) | Migration file only |
| Verify schema | MCP query information_schema |
| Debug RLS | MCP query pg_policies |
| Test constraints | MCP insert/update with test data |
| Seed data | MCP or seed.sql |
