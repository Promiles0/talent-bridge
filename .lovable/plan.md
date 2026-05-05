
# Phase 14 — Full Mix: Daily Loop, Marketplace, Trust & Wow

A broad multi-page sweep across all three dashboards. Delivered in 4 sub-batches so each piece ships polished before moving on.

---

## Batch 1 — Foundations (DB + theme + real-time infra)

### 1.1 Database migration
New tables (RLS-protected):

- `calendar_events` — `id, user_id, title, type (deadline|interview|reminder|study|custom), starts_at, ends_at, location, link, related_application_id, color, created_at`
  - RLS: owner-only CRUD.
- `talent_shortlists` — `id, employer_id, name, created_at`
- `shortlist_members` — `shortlist_id, student_id, notes, added_at` (unique pair)
  - RLS: employer who owns the shortlist.
- `presence` — `user_id PK, last_seen_at, status (online|away|offline)`
  - RLS: anyone can read; user updates own row.
- `typing_indicators` — `conversation_key text, user_id, updated_at` (ephemeral, cleaned by trigger >10s)
  - RLS: participants only.
- `company_branding` — extend `companies` with `tagline, story, culture_values jsonb, hero_image_url, brand_color, gallery jsonb`.
- `admin_audit_view` — SQL view joining `audit_log` with `profiles` for actor name.

Triggers:
- `auto_create_event_on_application_deadline` — when an application is created, mirror the internship `deadline` into a personal `calendar_events` row.
- `cleanup_typing_indicators` — scheduled function via cron (every minute).

### 1.2 Midnight theme variant
Add a third theme: `midnight` (deep indigo + neon accent). Update `ThemeProvider` to cycle `light → dark → midnight`. New CSS variables in `index.css`.

### 1.3 Realtime channels helper
New `src/lib/realtime.ts` exposing `usePresence(roomId)` and `useTypingIndicator(key)` hooks built on Supabase Realtime broadcast + presence.

---

## Batch 2 — Student daily loop (14A + 14B-student + 14H student)

### 2.1 Student Calendar — `/dashboard/student/calendar`
- Custom lightweight grid (no heavy lib): month / week / agenda toggle.
- Auto-feeds from `applications` (deadlines), `interview_slots`, and manual `calendar_events`.
- Drag-to-reschedule custom events.
- Side panel: today's focus + next 3 deadlines with countdown chips.
- AI button **"Plan my week"** → new edge function `ai-week-planner` that reads pending applications, deadlines, and skill-gap roadmap, then proposes 5–7 study/application blocks. User accepts → batch insert into `calendar_events`.

### 2.2 Student Bento Overview redesign
Rebuild `StudentOverview.tsx` as a 12-col bento grid:
- Hero greeting card (gradient + AuroraBackground)
- Profile completeness ring + level/XP mini-card (links to achievements)
- Next deadline countdown
- Application funnel sparkline
- Skill-gap radar mini (links to skill-gap)
- AI "Today's tip" card (cached daily via `ai-career-chat`)
- Recent messages preview (real-time)
- Suggested internships carousel

### 2.3 Visual wow (student-side)
- Page transitions via `PageTransition.tsx` wrapper around dashboard `<main>`.
- Hover micro-interactions on bento cards (tilt + glow).
- Subtle Web Audio "whoosh" cue on milestone unlocks (respects existing notification sound prefs).

---

## Batch 3 — Employer marketplace (14C + 14D + 14B-employer)

### 3.1 Talent Search — `/dashboard/employer/talent`
- Filters: skills (multi), university, graduation year, availability, field.
- Result grid of student cards with match score.
- AI search bar: free-text query → edge function `ai-talent-search` returns ranked `student_id`s with reasoning (uses `students` + `student_skills` + `projects`).
- Shortlist drawer: create/rename shortlists, drag students in, send bulk message via existing messages system.
- "Outreach template" generator (AI) prefills message based on internship + student profile.

### 3.2 Employer Branding Studio — `/dashboard/employer/branding`
- Replaces/extends `EmployerCompany` with tabbed editor: **Identity** (logo, brand color, tagline), **Story** (rich text + AI rewrite), **Culture** (values cards + gallery), **Preview** (live public-page preview).
- AI assist buttons: "Rewrite story", "Generate 5 culture values", "Suggest tagline" via new `ai-brand-assist` edge function.
- Public company page route `/companies/:id` consuming `company_branding`.

### 3.3 Employer Bento Overview redesign
Bento layout for `EmployerOverview.tsx`: pipeline funnel, hire-rate, top-applicants live feed, internship slot fill bars, calendar of upcoming interviews, brand-completeness ring.

---

## Batch 4 — Admin trust + cross-role real-time + final polish (14F + 14G + 14H)

### 4.1 Admin Analytics & Audit
- `/dashboard/admin/analytics` — expanded charts: signups by role, weekly active, application conversion, top employers, top skills (recharts).
- `/dashboard/admin/audit` — paginated audit log table (filter by actor/action/target_type), CSV export.
- Admin Bento overview redesign with live KPI tiles and moderation queue preview.

### 4.2 Real-time polish (all roles)
- **Presence**: green dot on avatars in messages + talent search using `presence` table heartbeat (every 30s).
- **Typing indicators** in `StudentMessages` and `EmployerMessages`.
- **Live counts**: NotificationBell, application badges, and admin queue update via Supabase Realtime postgres_changes (no polling).
- **Toast feed**: real-time "X applied to your internship" pop-ins for employers.

### 4.3 Visual wow finale
- Midnight theme polished and added to settings.
- Global page transitions + scroll progress bar visible in dashboards.
- Command Palette extended with new routes (calendar, talent, branding, audit).
- Empty states refreshed with AuroraBackground.

---

## Technical Notes

**New edge functions** (Lovable AI Gateway, model `google/gemini-2.5-flash`):
- `ai-week-planner` — input: user_id; output: array of suggested events.
- `ai-talent-search` — input: query + filters; output: ranked student_ids + rationale.
- `ai-brand-assist` — input: action + company context; output: text suggestions.

All use `corsHeaders`, JWT validation in code, Zod input validation, and structured tool-calling for JSON outputs.

**Files to create (high level)**
```text
src/pages/dashboard/student/StudentCalendar.tsx
src/pages/dashboard/employer/EmployerTalent.tsx
src/pages/dashboard/employer/EmployerBranding.tsx
src/pages/dashboard/admin/AdminAudit.tsx
src/pages/CompanyPublicProfile.tsx
src/components/calendar/{MonthView,WeekView,AgendaView,EventDialog}.tsx
src/components/bento/{BentoCard,StatTile,SparklineCard}.tsx
src/components/talent/{StudentResultCard,ShortlistDrawer,AISearchBar}.tsx
src/components/branding/{IdentityTab,StoryTab,CultureTab,PreviewTab}.tsx
src/components/PresenceDot.tsx
src/components/TypingIndicator.tsx
src/lib/realtime.ts
supabase/functions/ai-week-planner/index.ts
supabase/functions/ai-talent-search/index.ts
supabase/functions/ai-brand-assist/index.ts
supabase/migrations/<ts>_phase14_foundations.sql
```

**Files to edit**: `App.tsx` (routes), `StudentSidebar.tsx`, `EmployerSidebar.tsx`, `AdminSidebar.tsx`, `CommandPalette.tsx`, `ThemeProvider.tsx`, `index.css`, `tailwind.config.ts`, `StudentOverview.tsx`, `EmployerOverview.tsx`, `AdminOverview.tsx`, `NotificationBell.tsx`, `StudentMessages.tsx`, `EmployerMessages.tsx`.

---

## Suggested execution order
1. Batch 1 (foundations) — must land first.
2. Batch 2 (student loop).
3. Batch 3 (employer marketplace).
4. Batch 4 (admin + real-time + wow finale).

Reply **approve** to start with Batch 1, or tell me to reorder / drop anything.
