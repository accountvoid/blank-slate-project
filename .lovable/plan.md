# SETVOID Enterprise Admin Panel

This is a large build. I'll ship it in phases so each piece is reviewable and testable. Nothing in the existing game UI/gameplay will change.

## Phase 0 — Backend audit (already done)

The project is already 100% on your Supabase project (`ysniwvsuspzqyhfmngbn`). Auth, OTP, DB, Realtime, Storage, Edge Functions all use `@supabase/supabase-js` directly. No Lovable Cloud SDK, client, or endpoint is referenced anywhere. The final report will restate this with `rg` proof.

## Phase 1 — Security foundation (DB migration)

New tables + RLS in one migration:

- `app_role` enum: `super_admin | admin | moderator`
- `user_roles(user_id, role)` + `has_role(uid, role)` SECURITY DEFINER (recursion-safe)
- `is_admin(uid)` helper (any admin role)
- `audit_logs(id, actor_id, action, table_name, record_id, before, after, ip, user_agent, created_at)`
- `system_settings(key, value jsonb, updated_by, updated_at)`
- RLS on all new tables (only super_admin manages roles; all admins read audit logs; only super_admin writes settings)
- GRANTs per project rules

## Phase 2 — Admin content tables (DB migration)

- `main_quests` and `side_quests` (identical schema): bilingual title/description, category, difficulty, estimated_minutes, xp/gold reward, bilingual warning, `steps jsonb` (dynamic steps with title/description/duration/reps/custom/order/optional/completion), `rewards jsonb` (xp, gold, items[], custom), is_active, timestamps
- `grand_quests`: name, description, banner, image, start/end, rewards, priority, visibility, is_active
- Extend existing `gates` table only if columns missing (image, background, cooldown, drops, difficulty, open/close time, enabled) — additive, non-breaking
- `main_items`, `side_items`: name, description, rarity, category, image, effect, duration, stackable, sell/buy price, tradable, drop_rate
- `events`: name, description, banner, image, start/end, rules, rewards, visibility, enabled
- Each table: RLS = public read for active rows, write only via `has_role(super_admin)`; audit-log trigger on INSERT/UPDATE/DELETE

## Phase 3 — Admin frontend

- Route: `/admin` (guarded by `useIsAdmin()` — checks `user_roles` server-side via RPC; redirects if not admin)
- Layout: shadcn sidebar with sections: Dashboard, Users, Roles, Main Quests, Side Quests, Grand Quests, Gates, Main Items, Side Items, Events, Payments, Audit Logs, System Settings
- Dashboard: totals (users, gold sum, gates, quests, events, purchases, revenue), today's registrations/logins, newest users/payments, realtime via Supabase channels
- Generic reusable `<CrudTable>` (search, filter, pagination, sort) + `<CrudForm>` driven by a schema descriptor per table → Create/Edit/Delete/Duplicate/Activate/Deactivate/Preview
- Steps editor: dynamic list, drag-reorder, per-step fields
- Rewards editor: XP/Gold/Items multi-select + custom JSON
- Every mutation → audit log entry (server-side trigger, not client-trusted)
- All queries respect RLS; role checked via RPC on every admin page mount

## Phase 4 — OTP / Auth verification

Auth is already 100% Supabase (`useAuth.ts` uses `supabase.auth.signInWithOtp`, `verifyOtp`, `signUp`, `signInWithPassword`, `updateUser`, `signOut`). I'll add a `/reset-password` page if missing and confirm redirect URLs. No code paths call anything else.

## Phase 5 — Final report

Markdown report at `ADMIN_MIGRATION_REPORT.md`:
- List of every module touched
- Every new table + RLS summary
- Grep proof that no `lovable-cloud` / `lovable_cloud` references exist
- CRUD checklist per table
- Role/permission matrix

## Technical notes

- Types file `src/integrations/supabase/types.ts` regenerates automatically after each approved migration — code that depends on new tables lands after the migration.
- I will bootstrap the first `super_admin` by asking you for the email of the user you want promoted (via a separate insert once tables exist). No hardcoded admin.
- Existing tables (`profiles`, `gates`, `payments`, `portals`) are not restructured. Only additive columns where required.
- No changes to game UI, quest card visuals, HUD, dungeon, penalty screens, or bottom nav.

## What I need from you to start

1. Approval of this plan.
2. Email of the account that should become the first `super_admin`.

Once approved I'll start with Phase 1 migration.
