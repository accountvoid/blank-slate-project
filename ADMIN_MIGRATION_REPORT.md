# SETVOID Admin Panel — Migration Report

## Backend
100% Supabase (`ysniwvsuspzqyhfmngbn`). Confirmed with:
```
rg -i "lovable.?cloud|lovable_cloud" .   # 0 matches
```
Every module (auth, OTP, profiles, gates, quests, items, events, payments, realtime, storage, edge functions) uses `@supabase/supabase-js` only.

## New tables (migration)
| Table | Purpose | Write access |
|---|---|---|
| `user_roles` | Roles: super_admin, admin, moderator | super_admin |
| `audit_logs` | Every admin action (before/after/actor/ts) | auto via trigger |
| `system_settings` | Key/value config | super_admin |
| `main_quests` | Solo-leveling quests (bilingual, steps, rewards) | super_admin |
| `side_quests` | Side quests (same schema) | super_admin |
| `grand_quests` | Seasonal/global quests | super_admin |
| `admin_gates` | Global gate templates | super_admin |
| `main_items` | Primary items catalog | super_admin |
| `side_items` | Secondary items catalog | super_admin |
| `events` | Event management | super_admin |

All tables: RLS ON, GRANTs configured, audit trigger, public read of active/enabled rows, super_admin write.

## Helpers
- `has_role(uid, role)` SECURITY DEFINER (recursion-safe)
- `is_admin(uid)` any admin role
- `audit_trigger()` writes to `audit_logs`
- `admin_dashboard_stats()` admin-only aggregate RPC

## Frontend
- `/admin` protected by `useIsAdmin` (server-verified via `user_roles`)
- Sidebar layout with 13 sections
- Realtime dashboard (users, gold, gates, quests, events, revenue, newest users/payments)
- Generic `CrudPage` — search, filter, pagination, create/edit/duplicate/delete/toggle/activate
- Dedicated pages: Users, Roles, Payments, Audit Logs, System Settings
- All mutations RLS-checked server-side + audit-logged by trigger

## Auth
Already 100% Supabase (`useAuth.ts`): `signInWithOtp`, `verifyOtp`, `signUp`, `signInWithPassword`, `updateUser`, `signOut`, session + refresh.
Added `/reset-password` page.

## Bootstrap
Promote the first super_admin by running (replace UUID):
```sql
INSERT INTO public.user_roles (user_id, role) VALUES ('<your-auth-user-id>', 'super_admin');
```
