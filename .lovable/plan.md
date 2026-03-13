

## Phase 6: Color Overhaul, Bug Fixes, Dashboard Enhancement & Notifications

This is a large scope. Here's the prioritized plan:

---

### 1. CRITICAL BUG FIX: Students query 400 errors

**Root cause:** The `students` table has NO foreign key to `profiles`, so `profiles(full_name)` join fails with PGRST200. The `available` column IS a boolean (confirmed in types.ts) so `.eq("available", true)` is correct.

**Fix:**
- Add a database migration: `ALTER TABLE public.students ADD CONSTRAINT students_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);`
- This enables the `profiles(full_name, avatar_url)` join syntax to work
- Update queries in `Index.tsx`, `Students.tsx`, `StudentPublicProfile.tsx` to use explicit hint: `profiles!students_user_id_profiles_fkey(full_name, avatar_url)`

---

### 2. COLOR SCHEME: Emerald Green replaces Orange/Amber

Replace all amber/orange accent colors with emerald green across both modes. Only CSS variable changes in `index.css` and hardcoded color references in components.

**Light Mode (new values):**
- `--primary`: `160 84% 39%` (emerald green, ~hsl(160, 84%, 39%))
- `--secondary`: `160 60% 45%` (slightly lighter emerald)
- `--ring`: matches primary
- Remove all amber/orange references from gradients

**Dark Mode (new values):**
- `--primary`: `160 84% 50%` (brighter emerald for dark bg)
- `--secondary`: `168 76% 50%` (keep teal-ish, shift greener)
- `--ring`: matches primary

**Files to update:**
- `src/index.css` -- all CSS variables and gradient references (amber hsl values → emerald)
- `src/components/Preloader.tsx` -- hardcoded `hsl(36 90% 55%)` → emerald
- `src/components/Navbar.tsx` -- if any hardcoded colors
- `src/components/BackgroundEffects.tsx`, `src/components/ParticleNetwork.tsx` -- any amber references
- `tailwind.config.ts` -- if custom colors defined there

---

### 3. NOTIFICATIONS TABLE + REALTIME

**Database migration:**
- Create `notifications` table: `id`, `user_id` (uuid), `type` (text), `title` (text), `body` (text), `read_at` (timestamptz), `link` (text), `created_at` (timestamptz default now())
- RLS: users can SELECT own notifications, can UPDATE own (to mark read)
- Enable realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;`

**Trigger notifications:**
- Create a database trigger function that inserts a notification when `applications.status` changes
- Create a database trigger function that inserts a notification when a new `messages` row is inserted (for the receiver)

---

### 4. DASHBOARD HEADER: Theme Toggle + Brand Link + Notification Bell

Update `DashboardLayout.tsx` header to include:
- **TalentBridge brand** as a Link to `/` (left side)
- **Theme toggle** button (Sun/Moon icons) using existing `useTheme`
- **Notification bell** with unread count badge, dropdown showing recent 10 notifications
- Realtime subscription for new notifications in the layout component

---

### 5. STUDENT DASHBOARD OVERHAUL (`StudentOverview.tsx`)

- **Welcome banner** with gradient bg, profile completion progress bar
- **Stats cards** remain as 4-card grid (already implemented), enhance with glassmorphism
- **Quick actions bar**: Browse Internships, Update Profile, Add Project, Check Messages
- **Recommended internships** section querying by student skills
- **Career tips widget** rotating through static tips array
- **Empty states** with SVG illustrations and CTAs (already partially done)

---

### 6. EMPLOYER DASHBOARD OVERHAUL (`EmployerOverview.tsx`)

- Welcome banner with company name
- Enhanced stats cards
- Empty state for no internships with CTA
- Notification on new application (via realtime subscription)

---

### 7. MOBILE RESPONSIVENESS

- Bottom tab bar for mobile (`< 768px`) on dashboard pages
- Stats cards: 2x2 grid on mobile (already `grid-cols-2`)
- Sidebar already collapses via SidebarProvider

---

### Implementation Order

1. **Database migration** -- FK for students→profiles, notifications table + triggers
2. **Color scheme update** -- `index.css` variables + all hardcoded amber/orange in components
3. **Bug fix** -- Update student queries to use the new FK join
4. **Dashboard header** -- Brand link, theme toggle, notification bell in `DashboardLayout.tsx`
5. **Student dashboard overhaul** -- Welcome banner, quick actions, recommended internships, tips
6. **Employer dashboard overhaul** -- Same pattern
7. **Mobile bottom tab bar** -- For dashboard pages

### Files to create/edit
- `supabase/migrations/new_migration.sql` (FK + notifications table + triggers)
- `src/index.css` (color variables)
- `src/components/Preloader.tsx` (hardcoded colors)
- `src/components/DashboardLayout.tsx` (header with brand, theme toggle, bell)
- `src/components/NotificationBell.tsx` (new)
- `src/components/MobileTabBar.tsx` (new)
- `src/pages/Index.tsx` (fix student query)
- `src/pages/Students.tsx` (fix student query)
- `src/pages/dashboard/student/StudentOverview.tsx` (full overhaul)
- `src/pages/dashboard/employer/EmployerOverview.tsx` (overhaul)
- `src/components/BackgroundEffects.tsx` (color refs)
- `src/components/ParticleNetwork.tsx` (color refs)

