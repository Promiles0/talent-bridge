# Phase 13: Intelligent Dashboards, AI Co-Pilot Everywhere, and Immersive Modern UX

This phase focuses on **deep AI integration into daily workflows**, **missing high-value pages**, and **a layer of premium motion/design polish** that ties the whole product together.

---

## 1. New Pages — Student Dashboard

### 1A. Student Calendar & Scheduling (`/dashboard/student/calendar`)
- Month / week / agenda views (using a custom lightweight grid — no heavy lib)
- Auto-populated events: application deadlines, interview slots (from messages parsing), saved internship deadlines
- AI button: "Plan my week" → Lovable AI suggests a study/application schedule based on pending applications + skill gaps
- Drag-to-reschedule with spring animations
- Sync export (.ics download)

### 1B. Skill Gap Analyzer (`/dashboard/student/skill-gap`)
- Compares student's current skills against the skills required by:
  - Their saved internships
  - Their target field of study
- Visual radar chart (CSS/SVG, no chart lib needed) showing "You vs Market"
- AI-generated learning roadmap with recommended free resources per missing skill
- Progress tracker per skill (mark as "learning" / "completed")

### 1C. Achievements & Gamification (`/dashboard/student/achievements`)
- XP system: profile completion, applications sent, projects added, CV reviewed by AI, etc.
- Tiered badges (Bronze → Diamond) with unlock animations (confetti + scale-bounce)
- Leaderboard (opt-in, anonymized) of top active students this month
- Streak counter (days active) with flame icon animation

### 1D. Notifications Center (`/dashboard/student/notifications`)
- Full-page list (currently only the bell dropdown exists)
- Filters: All / Unread / Applications / Messages / System
- Bulk actions, group by date, swipe-to-dismiss on mobile

---

## 2. New Pages — Employer Dashboard

### 2A. AI Talent Search (`/dashboard/employer/talent-search`)
- Natural language search: "Find me React students in Kigali available for summer"
- AI converts query → structured filters → ranks matching students with reasoning
- Saved searches with alerts when new matching students join
- Card grid with hover preview of student public profile

### 2B. Interview Scheduler (`/dashboard/employer/interviews`)
- Set interview availability slots per internship
- Send slot invitations to shortlisted applicants from inside Applications page
- Status tracker (proposed / accepted / completed / no-show)
- Integrated with Student Calendar above

### 2C. Company Branding Page (`/dashboard/employer/branding`)
- Cover photo, gallery, video intro URL, mission, perks/benefits chips
- Live preview of the public company page beside the editor
- AI button: "Polish my company description" + "Suggest perks based on my industry"

---

## 3. New Pages — Admin Dashboard

### 3A. Reports & Insights (`/dashboard/admin/reports`)
- Cohort analytics: new students/employers per week, retention, DAU/MAU
- Top universities, top hiring companies, most-demanded skills
- Exportable PDF/CSV reports
- AI summary: "This week's platform health in 3 sentences"

### 3B. Audit Log (`/dashboard/admin/audit`)
- All sensitive actions (role changes, content deletions, flag resolutions)
- Filter by user, action type, date range
- Required for trust/compliance

---

## 4. AI Co-Pilot — Everywhere

### 4A. Global Command Palette (Cmd/Ctrl + K)
- Floating glass modal with fuzzy search
- Navigate to any page, run actions ("Apply to internship X", "Generate CV summary"), ask AI
- Recent + suggested commands
- Available on every dashboard

### 4B. Contextual AI Suggestions
- **Student Profile**: "Improve my bio with AI" inline button
- **Student Projects**: "Write project description from title + tech stack"
- **Employer Applications**: AI summary card per applicant ("Top 3 reasons this candidate fits")
- **Employer Messages**: "Suggest reply" button above the input
- **Student Messages**: Same — "Suggest professional reply"

### 4C. Smart Notifications (AI-prioritized)
- Edge function ranks notifications by importance using user context
- Top 3 shown as "Priority" with subtle glow

---

## 5. Design & Motion Polish

### 5A. Aurora Background System
- Subtle animated gradient blobs behind dashboard pages (very low opacity, blur 120px)
- Different palette per role: student=violet/cyan, employer=emerald/blue, admin=amber/rose
- Respects `prefers-reduced-motion`

### 5B. Bento Reorg of Overview Pages
- Convert all three Overview pages (`StudentOverview`, `EmployerOverview`, `AdminOverview`) into bento grids:
  - Mixed card sizes (1×1, 2×1, 2×2)
  - Each card has its own micro-interaction (hover lift, gradient sweep)

### 5C. Motion Upgrades
- Number counters with `useCountUp` on every stat (already exists — apply consistently)
- Page-enter sequence: header fades+slides → cards stagger in (60ms gap)
- Tab switches use a sliding underline + content cross-fade
- New `<MagneticButton>` component (subtle cursor follow on hover) for primary CTAs
- `<Tilt3D>` wrapper for hero cards (3deg max, only on devices with hover)

### 5D. Sound Design (extend `notifications.ts`)
- Distinct subtle tones per event: message (soft chime), achievement unlock (sparkle), error (mute thud)
- Master toggle in Settings

### 5E. Theme Refinements
- Add a third theme: **"Midnight"** (deep blue/purple, electric accents) as an opt-in
- Theme picker in Settings with live preview swatches

---

## 6. Quality & Infrastructure

- Empty-state illustrations: replace generic icons with custom inline SVGs (animated float)
- Skeleton parity: every data-loading page must show a skeleton matching its final layout
- 404/Error boundary redesign: friendly illustration + "go to dashboard" + "report issue"
- Keyboard shortcuts overlay (press `?` to view all shortcuts)

---

## Technical Details

### New files
- Pages: `StudentCalendar.tsx`, `StudentSkillGap.tsx`, `StudentAchievements.tsx`, `StudentNotifications.tsx`, `EmployerTalentSearch.tsx`, `EmployerInterviews.tsx`, `EmployerBranding.tsx`, `AdminReports.tsx`, `AdminAudit.tsx`
- Components: `CommandPalette.tsx`, `MagneticButton.tsx`, `Tilt3D.tsx`, `AuroraBackground.tsx`, `BentoCard.tsx`, `XPBar.tsx`, `BadgeUnlockToast.tsx`, `AISuggestButton.tsx`, `ShortcutsOverlay.tsx`
- Edge functions: `ai-talent-search`, `ai-skill-gap`, `ai-suggest-reply`, `ai-applicant-summary`, `ai-week-planner`
- Tables (migrations): `achievements`, `user_achievements`, `xp_events`, `interview_slots`, `audit_log`, `notification_priority` (or extend existing `notifications`)
- Lib: extend `notifications.ts` with new sound profiles

### Edited files
- `App.tsx` (new routes), all three sidebars (new links), `DashboardLayout.tsx` (mount `CommandPalette` + `AuroraBackground`), Overview pages (bento conversion), Settings pages (theme picker + sound toggles)

### Data model additions
- `xp_events(user_id, event_type, points, created_at)` + view for totals
- `achievements(id, key, title, description, tier, criteria_json)`
- `user_achievements(user_id, achievement_id, unlocked_at)`
- `interview_slots(employer_id, internship_id, application_id, start_at, end_at, status)`
- `audit_log(actor_id, action, target_type, target_id, metadata, created_at)`

### Implementation order
1. Migrations + RLS (XP, achievements, interview slots, audit log)
2. Command Palette + Aurora Background (global infra)
3. Student new pages (Calendar → Skill Gap → Achievements → Notifications)
4. Employer new pages (Talent Search → Interviews → Branding)
5. Admin new pages (Reports → Audit)
6. Contextual AI buttons across existing pages
7. Bento Overview redesigns + motion polish + Midnight theme
8. Cross-device + dark/light/midnight QA

---

## Notes
- All AI features use Lovable AI Gateway (`google/gemini-3-flash-preview` default; `google/gemini-2.5-pro` for complex reasoning like talent search ranking).
- All new tables get strict RLS using existing `has_role()` pattern.
- All new pages follow existing `glass-card-themed`, `motion.div` page transition, and mobile padding (`pb-24`) conventions.
- Fully responsive down to 320px; respects `prefers-reduced-motion` for all new animations.
