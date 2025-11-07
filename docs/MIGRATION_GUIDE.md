# Migration Guide

Idempotent migrations and safe rollout/rollback practices for this project.

## Principles
- All schema changes are idempotent:
  - `CREATE TABLE/INDEX IF NOT EXISTS`
  - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
  - `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
- New features use additive changes (ADD columns/tables/views) to avoid destructive diffs.
- Data backfills are guarded with `NOT EXISTS` filters.

## Apply Migrations

```bash
# Link once
npx supabase link --project-ref "$SUPABASE_PROJECT_REF"

# Push migrations
SUPABASE_ACCESS_TOKEN="$VITE_SUPABASE_ACCESS_TOKEN" npx supabase db push
```

## Files (Key)
- `20250101000000_initial_schema.sql`: base tables, indexes, RLS, triggers, realtime
- `20250102000000_simplify_admin.sql`: `profiles.role` enum/column/index, removes `admin_users`
- `20250107000000_trials_and_plan.sql`: `character_plans`, `trials`, `trial_results`, view, triggers
- `20250107001000_plan_constraints.sql`: max 20 constraints for plan stats
- `20250107002000_backfill_plans.sql`: create default plans for existing characters

## Rollback Strategy
- Prefer forward fixes (new migrations) over DROP.
- If you must rollback recent additive changes:
  - Drop dependent objects in reverse order:
    1. Views (e.g. `v_weighted_scores`)
    2. Triggers on new tables
    3. Indexes on new tables
    4. New tables (`trial_results`, `trials`, `character_plans`)
  - Do NOT drop base tables (`profiles`, `characters`, `game_rounds`, `prompt_history`) in shared environments.
- For enum changes:
  - Avoid dropping enum types. Add new values or introduce a new enum and remap.

## Verification
```sql
-- Existence checks
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('character_plans','trials','trial_results');

-- Constraints
SELECT conname FROM pg_constraint WHERE conname LIKE 'chk_character_plans_max20%';
```

## Troubleshooting
- `relation already exists`:
  - Safe to ignore if using idempotent guards (migration continues).
- `syntax error near BEGIN` within DO blocks:
  - Use distinct body delimiters (e.g., `$fn$`) for nested function definitions.
- `UnknownIssuer` during deploy:
  - Use `DENO_TLS_CA_STORE=system` (see `scripts/deploy-edge-functions.sh`).


