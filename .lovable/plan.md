## Phase 7: Mobile Tab Bar, Gamification, Recommended Internships, and Platform Polish

### What you asked for

**1. Mobile Bottom Tab Bar** for dashboard pages (student + employer)
**2. Gamification with Achievement Badges** on student dashboard
**3. Recommended Internships** matching student skills

### What I suggest we also ADD, FIX, and REMOVE

**ADD:**

- **Conversation threading in Messages** -- Currently messages show as a flat list with no grouping by contact. Group messages into conversations so users can click a contact and see the thread. This is critical for usability.
- **Internship detail page** (`/internships/:id`) -- Currently there is no dedicated page for viewing a single internship. Users apply from the listing page via a dialog, but there is no way to share or bookmark a specific internship.
- **"Saved/Bookmarked" internships** -- Students can save internships they are interested in and view them later from their dashboard. Requires a small `saved_internships` table.
- **Application withdrawal** -- Students currently cannot withdraw an application. Add a "Withdraw" button on the applications page.

**FIX:**

- **Employer internships default to "draft"** -- When an employer posts an internship, it is created with `status: "draft"`, which means it is NOT visible on the public internships page (RLS requires `status = 'active'`). This is confusing. Change to default to `"active"` so it appears immediately, or add a clear "Publish" flow.
- **StudentPublicProfile query uses wrong join syntax** -- It uses `profiles:user_id(...)` instead of the FK hint `profiles!students_user_id_profiles_fkey(...)`, which may fail with 400.
- **Messages don't show sender names** -- Both student and employer message pages query `messages` with `select("*")` but never join `profiles` to get the sender/receiver names. Users just see raw user IDs or nothing.
- **DB triggers are registered but NOT actually attached** -- The context shows "There are no triggers in the database" despite having trigger functions. The migration may have created functions but not the `CREATE TRIGGER` statements. Need to verify and re-create triggers.

**REMOVE:**

- **"Profile Views" stat card** shows hardcoded `0` on student dashboard -- Remove or replace with something real (like "Skills" count) since there is no view tracking.

---

### Implementation Plan

#### 1. Database Migration

- Create `saved_internships` table (`student_id`, `internship_id`, timestamps, RLS)
- Create `student_milestones` table (`student_id`, `milestone` text, `earned_at` timestamp, RLS) for gamification
- Re-attach the notification triggers if missing (`on_application_status_change`, `on_new_message`)
- Fix the internship insert default: change from `"draft"` to `"active"` in the employer form code (not schema change needed, just code)

#### 2. Mobile Bottom Tab Bar (`src/components/MobileTabBar.tsx`)

- Fixed bottom bar visible only on `< 768px` screens
- Student tabs: Home, Search, Applications, Messages, Profile
- Employer tabs: Home, Internships, Applicants, Messages, Company
- Auto-detect role from `useAuth()` and show appropriate tabs
- Integrate into `DashboardLayout.tsx` -- render below `<main>`

#### 3. Gamification -- Achievement Badges (`StudentOverview.tsx`)

- Milestones tracked: Profile Created, Bio Added, First Skill Added, First Project, First Application, Profile 100% Complete
- On dashboard load, check which milestones are newly earned, insert into `student_milestones`, show celebratory toast
- Display as a horizontal row of badge icons: earned = full color + check, unearned = grayscale
- No external assets -- use Lucide icons styled as badges

#### 4. Recommended Internships (`StudentOverview.tsx`)

- Query student's skills from `student_skills` + `skills`
- Query active internships where `requirements ILIKE any skill name`
- Show as a 3-card grid (desktop) / horizontal scroll (mobile)
- Each card: title, company, location, work type badge, "View & Apply" link
- Fallback: if no matches, show "Browse all internships" CTA

#### 5. Bug Fixes

- Fix `StudentPublicProfile.tsx` join to use `profiles!students_user_id_profiles_fkey`
- Fix messages pages to join `profiles` for sender/receiver names
- Change employer internship creation from `status: "draft"` to `status: "active"`
- Replace "Profile Views: 0" stat with "Skills" count
- Verify and re-attach DB triggers for notifications

#### 6. Message Threading (Conversations)

- Group messages by the other participant's user ID
- Show a contact list on the left, conversation thread on the right
- Fetch profile names for all participants
- Apply to both `StudentMessages.tsx` and `EmployerMessages.tsx`

---

### Implementation Order

1. Database migration (saved_internships, student_milestones, triggers)
2. Bug fixes (join syntax, messages names, draft→active, stat card)
3. Mobile bottom tab bar
4. Achievement badges on student dashboard
5. Recommended internships section
6. Message threading (conversations view)

### Files to create/edit

- `supabase/migrations/new_migration.sql`
- `src/components/MobileTabBar.tsx` (new)
- `src/components/DashboardLayout.tsx` (add MobileTabBar)
- `src/pages/dashboard/student/StudentOverview.tsx` (badges, recommended, fix stat)
- `src/pages/dashboard/student/StudentMessages.tsx` (conversation threading)
- `src/pages/dashboard/employer/EmployerMessages.tsx` (conversation threading)
- `src/pages/dashboard/employer/EmployerInternships.tsx` (status fix)
- `src/pages/StudentPublicProfile.tsx` (join fix)  
  
  
detailed   
----------  
  
## TalentBridge — Phase 7: Mobile Tab Bar, Gamification, Recommended Internships & Platform Polish
  This is a continuation of the TalentBridge codebase. Do not change any existing design,
  branding, or architecture unless explicitly stated below. Implement everything in order.
  ---
  ## 1. DATABASE MIGRATION
  File: supabase/migrations/phase7_migration.sql
  ### New Tables
  -- Saved internships (students bookmarking listings)
  CREATE TABLE saved_internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    internship_id UUID NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, internship_id)
  );
  ALTER TABLE saved_internships ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Students manage own saved" ON saved_internships
    FOR ALL USING (auth.uid() = student_id);
  -- Student achievement milestones (gamification)
  CREATE TABLE student_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    milestone TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, milestone)
  );
  ALTER TABLE student_milestones ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Students read own milestones" ON student_milestones
    FOR ALL USING (auth.uid() = student_id);
  ### Trigger Fix
  Verify that notification triggers are actually attached (not just functions).
  Re-create if missing:
  CREATE OR REPLACE FUNCTION handle_application_status_change()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO notifications(user_id, type, message, object_id)
    VALUES (NEW.student_id, 'application_status', 
            'Your application status changed to: ' || NEW.status, [NEW.id](http://NEW.id));
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  DROP TRIGGER IF EXISTS on_application_status_change ON applications;
  CREATE TRIGGER on_application_status_change
    AFTER UPDATE OF status ON applications
    FOR EACH ROW EXECUTE FUNCTION handle_application_status_change();
  CREATE OR REPLACE FUNCTION handle_new_message()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO notifications(user_id, type, message, object_id)
    VALUES ([NEW.to](http://NEW.to)_user_id, 'new_message', 'You have a new message', [NEW.id](http://NEW.id));
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  DROP TRIGGER IF EXISTS on_new_message ON messages;
  CREATE TRIGGER on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION handle_new_message();
  ---
  ## 2. BUG FIXES (apply these before adding new features)
  ### Fix 1 — StudentPublicProfile.tsx
  Wrong: profiles:user_id(...)
  Fix: profiles!students_user_id_profiles_fkey(display_name, avatar_url, email)
  Apply this join fix wherever the student profile query fetches related profile data.
  ### Fix 2 — Messages sender/receiver names (both StudentMessages + EmployerMessages)
  Wrong: select("*") with no join
  Fix: select("*, sender:profiles!messages_from_user_id_fkey(display_name, avatar_url), receiver:profiles!messages_to_user_id_fkey(display_name, avatar_url)")
  Render sender.display_name and receiver.display_name in the UI instead of raw user IDs.
  ### Fix 3 — Employer internship creation default status
  File: EmployerPostInternship.tsx (or wherever the insert happens)
  Wrong: status: "draft"
  Fix: status: "active"
  The internship must be immediately visible on the public /internships board after posting.
  No schema change needed — this is a code-only fix.
  ### Fix 4 — Student dashboard "Profile Views" stat card
  Remove the hardcoded "Profile Views: 0" stat card entirely.
  Replace with a real "Skills" stat card:
  - Label: "Skills"
  - Value: count of rows in student_skills where student_id = current user
  - Icon: Zap (Lucide)
  ---
  ## 3. MOBILE BOTTOM TAB BAR
  File: src/components/MobileTabBar.tsx (new component)
  - Visible only on screens < 768px (hidden on md+)
  - Fixed to bottom of screen, full width, z-index: 50
  - Height: 64px
  - Style: glassmorphism consistent with the existing TalentBridge design system
    (backdrop-filter: blur, semi-transparent background, top border at 1px with border-color matching theme)
  - Active tab: accent color (amber #F59E0B) icon + label
  - Inactive tab: muted color icon + label
  - No labels on very small screens (< 360px), icons only
  Student tabs (in order):
    1. Home → /dashboard/student (House icon)
    2. Search → /internships (Search icon)
    3. Applications → /dashboard/student/applications (FileText icon)
    4. Messages → /dashboard/student/messages (MessageSquare icon)
    5. Profile → /dashboard/student/profile (User icon)
  Employer tabs (in order):
    1. Home → /dashboard/employer (LayoutDashboard icon)
    2. Internships → /dashboard/employer/internships (Briefcase icon)
    3. Applicants → /dashboard/employer/internships (Users icon)
    4. Messages → /dashboard/employer/messages (MessageSquare icon)
    5. Company → /dashboard/employer/company (Building2 icon)
  Use useAuth() to detect role and render the correct tab set.
  Use useLocation() (React Router) to detect active route and highlight the correct tab.
  Integration:
  File: src/components/DashboardLayout.tsx
  Add <MobileTabBar /> just before the closing </div> of the layout wrapper.
  Add pb-16 (padding-bottom: 64px) to the main content area on mobile so content
  is not hidden behind the tab bar.
  ---
  ## 4. ACHIEVEMENT BADGES (Gamification)
  File: src/pages/dashboard/student/StudentOverview.tsx
  ### Milestones to track (check and award on dashboard load):
  | Milestone key         | Label               | Check condition                          | Lucide Icon    |
  |-----------------------|---------------------|------------------------------------------|----------------|
  | profile_created       | Profile Created     | student row exists                       | UserCheck      |
  | bio_added             | Bio Written         | bio is not null and length > 10          | FileText       |
  | first_skill           | First Skill         | student_skills count >= 1               | Zap            |
  | first_project         | First Project       | projects count >= 1                      | Code2          |
  | first_application     | First Application   | applications count >= 1                  | Send           |
  | profile_complete      | Profile 100%        | all fields filled + cv_url not null      | Star           |
  ### Logic:
  1. On dashboard load, evaluate all 6 conditions against current student data
  2. For each condition that is TRUE and does NOT exist in student_milestones:
     - INSERT into student_milestones (upsert with ON CONFLICT DO NOTHING)
     - Show a celebratory toast: "🏆 Achievement unlocked: [Label]!"
  3. Query all student_milestones for this student to know which badges are earned
  ### UI — Badge Row:
  - Placed below the stats row on the student dashboard
  - Section header: "Your Achievements"
  - Horizontal scrollable row of badge cards
  - Each badge card: icon (large, 32px), label below, earned date if earned
  - Earned: full accent color (amber), checkmark overlay, solid background
  - Unearned: grayscale, 40% opacity, lock icon overlay
  - Tooltip on hover: earned date or "Keep going to unlock this!"
  - Glassmorphism card style matching existing dashboard cards
  ---
  ## 5. RECOMMENDED INTERNSHIPS
  File: src/pages/dashboard/student/StudentOverview.tsx (add section below badges)
  ### Query logic:
  1. Fetch current student's skills: student_skills join skills → array of skill names
  2. Query internships where:
     - is_active = true AND status = 'active'
     - AND (requirements ILIKE '%skill1%' OR requirements ILIKE '%skill2%' ... for each skill)
  3. Limit to 6 results, ordered by created_at DESC
  ### UI:
  - Section header: "Recommended for You" + subtle "Based on your skills" subtext
  - Desktop: 3-column card grid
  - Mobile: horizontal scroll row (overflow-x: auto, snap-x)
  - Each card (glassmorphism, consistent with existing internship cards):
    - Company logo (or placeholder initials avatar)
    - Internship title (bold)
    - Company name (muted)
    - Location + work_type badge (Remote/Hybrid/On-site)
    - Stipend if available
    - "View & Apply" button → links to /internships/:id
  - Fallback (no skill matches or no skills set):
    - Show a single CTA card: "Complete your profile skills to get personalized recommendations"
    - Button: "Add Skills" → /dashboard/student/profile
  ---
  ## 6. SAVED / BOOKMARKED INTERNSHIPS
  File: src/pages/dashboard/student/StudentOverview.tsx + internship cards everywhere
  ### Save button:
  - Add a bookmark icon button to every internship card (top-right corner)
  - Filled bookmark = saved, outline = not saved
  - On click: toggle — INSERT or DELETE from saved_internships
  - Optimistic UI update (don't wait for DB to flip the icon)
  ### Saved internships page:
  File: src/pages/dashboard/student/StudentSavedInternships.tsx (new page)
  Route: /dashboard/student/saved
  - Same layout as the internship board but filtered to saved ones
  - Empty state: "No saved internships yet. Bookmark listings to find them here."
  - Add "Saved" tab/link to the student dashboard sidebar and MobileTabBar
    (replace or add alongside existing nav items — use Bookmark icon)
  ---
  ## 7. APPLICATION WITHDRAWAL
  File: src/pages/dashboard/student/StudentApplications.tsx
  - On the applications list, add a "Withdraw" button for applications with status = 'applied' only
  - On click: show a confirmation modal ("Are you sure you want to withdraw this application?")
  - On confirm: DELETE the application row from the DB
  - Remove from list with optimistic UI
  - Show toast: "Application withdrawn"
  - Do NOT allow withdrawal for statuses: shortlisted, interview, offered, rejected
  ---
  ## 8. INTERNSHIP DETAIL PAGE
  File: src/pages/InternshipDetail.tsx (new page)
  Route: /internships/:id
  This is a new public page (accessible to guests + logged-in users).
  ### Content:
  - Company logo, name, verified badge (if verified), location
  - Internship title (h1)
  - Badges row: work_type, location, duration, stipend (or "Unpaid")
  - Full description (rich text render)
  - Responsibilities section
  - Requirements section
  - "Apply Now" button (opens application modal — same as existing apply flow)
    OR if application_method = 'external_link', button opens application_link in new tab
  - Save/Bookmark button (for logged-in students)
  - Share button (copy URL to clipboard, show toast "Link copied!")
  - Sidebar (desktop): company card with logo, name, website link, "View all openings" 
  - Mobile: company card below main content
  - If internship is_active = false: show "This internship is no longer accepting applications" banner
  Update all existing internship cards on /internships and dashboard to have the title
  as a link to /internships/:id instead of only the apply button triggering a modal.
  ---
  ## 9. MESSAGE THREADING (CONVERSATIONS)
  Files: src/pages/dashboard/student/StudentMessages.tsx
         src/pages/dashboard/employer/EmployerMessages.tsx
  Replace the current flat message list with a two-panel conversation view:
  ### Layout (desktop):
  - Left panel (300px, scrollable): Contact list
    - Each row: avatar, display_name, last message preview (truncated 40 chars), timestamp
    - Unread indicator: amber dot if read_at IS NULL
    - Active contact: highlighted with accent background
  - Right panel (flex-1): Conversation thread
    - Messages grouped by date (show date separator: "Today", "Yesterday", "March 14")
    - Own messages: right-aligned, accent bubble
    - Other's messages: left-aligned, muted bubble
    - Show sender avatar + name above first message in a group
    - Compose box fixed at bottom: textarea (auto-resize) + Send button
    - Auto-scroll to bottom on load and on new message
  ### Layout (mobile):
  - Start on contact list (full screen)
  - Tap a contact → slide to conversation thread (full screen)
  - Back button (ChevronLeft) returns to contact list
  ### Query logic:
  1. Fetch all messages WHERE from_user_id = me OR to_user_id = me
  2. Group by "other participant" (the user who is NOT me)
  3. For each group, show last message as preview, count unread (read_at IS NULL and to_user_id = me)
  4. Join profiles on both from_user_id and to_user_id to get display_name + avatar_url
  5. On contact click: filter messages to that conversation, mark all as read
     (UPDATE messages SET read_at = now() WHERE from_user_id = selected AND to_user_id = me AND read_at IS NULL)
  Apply identical threading logic to both StudentMessages.tsx and EmployerMessages.tsx.
  ---
  ## IMPLEMENTATION ORDER
  Execute strictly in this order to avoid dependency issues:
  1. Database migration (new tables + trigger fix)
  2. Bug fixes (join syntax, message names, draft→active, stat card)
  3. Internship detail page (/internships/:id) + update cards to link to it
  4. Mobile bottom tab bar + DashboardLayout integration
  5. Saved internships (DB logic + UI + saved page)
  6. Application withdrawal
  7. Achievement badges (gamification)
  8. Recommended internships section
  9. Message threading (conversations)
  ---
  ## FILES TO CREATE / MODIFY
  New files:
  - supabase/migrations/phase7_migration.sql
  - src/components/MobileTabBar.tsx
  - src/pages/InternshipDetail.tsx
  - src/pages/dashboard/student/StudentSavedInternships.tsx
  Modified files:
  - src/components/DashboardLayout.tsx
  - src/pages/dashboard/student/StudentOverview.tsx
  - src/pages/dashboard/student/StudentApplications.tsx
  - src/pages/dashboard/student/StudentMessages.tsx
  - src/pages/dashboard/employer/EmployerMessages.tsx
  - src/pages/dashboard/employer/EmployerInternships.tsx (or post form — status fix)
  - src/pages/StudentPublicProfile.tsx (join fix)
  - src/App.tsx or router file (add new routes)
  - Internship card component (add bookmark button + link to detail page)
  ---
  ## CONSTRAINTS & REMINDERS
  - Do NOT change any existing design tokens, color palette, or Tailwind config
  - Maintain glassmorphism card style on all new components (both light and dark mode)
  - All new pages must be responsive (mobile-first)
  - Use existing useAuth(), Supabase client, and toast patterns already in the codebase
  - All Supabase queries must respect existing RLS policies
  - Use Lucide React for all icons — no new icon libraries
  - No new external dependencies unless absolutely necessary  
