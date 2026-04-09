

## Phase 11: AI Smart Matching, Profile Editing, Sound Notifications, Settings Page, and Student Dashboard Polish

This is a large scope organized into 5 sub-phases.

---

### Sub-Phase 11A: Critical — Attach Database Triggers (AGAIN)

The triggers are STILL not attached despite two previous migrations. This must be fixed first as notifications, profile auto-creation, etc. all depend on them.

**Migration SQL**: Create triggers on `auth.users` for `handle_new_user`, `handle_new_user_role`, `handle_new_student_or_employer`; on `applications` for `notify_application_status_change`; on `messages` for `notify_new_message`.

---

### Sub-Phase 11B: AI Smart Matching on Student Overview

**Backend**: The edge function `ai-match-internships` already exists. 

**Frontend** (`StudentOverview.tsx`): Replace the current keyword-based recommended section with AI-powered matching:
- Fetch student profile (skills, bio, field_of_study) and active internships
- Call `ai-match-internships` edge function
- Display match score (percentage badge) and AI-generated reason on each recommended card
- Fallback to keyword matching if AI call fails
- Loading skeleton while AI processes

---

### Sub-Phase 11C: Profile/Account Editing (Name, Email, etc.)

**New Settings Page**: `src/pages/dashboard/student/StudentSettings.tsx` and `src/pages/dashboard/employer/EmployerSettings.tsx`

Both pages include:
- **Account section**: Edit full name (updates `profiles` table), email change (via `supabase.auth.updateUser({ email })`), password change
- **Notification preferences**: Toggle switches for sound notifications and browser push notifications (stored in `localStorage`)
- **Theme**: Light/dark toggle (already exists, just surface it here too)
- **AI preferences**: Toggle for AI suggestions (students only)

**Routes**: Add `/dashboard/student/settings` and `/dashboard/employer/settings` to `App.tsx`

**Sidebars**: Add "Settings" item with gear icon to `StudentSidebar.tsx` and `EmployerSidebar.tsx`

**Employer Company page**: Already has name/description/location/website editing — no changes needed there.

---

### Sub-Phase 11D: Sound + Push Notifications

**New file**: `src/lib/notifications.ts`

- `playNotificationSound()`: Uses Web Audio API to generate a short pleasant tone (oscillator-based, no file dependencies)
- `requestPushPermission()`: Requests browser Notification permission
- `sendBrowserNotification(title, body, link?)`: Fires `new Notification(...)` if permission granted
- `isNotificationSoundEnabled()` / `isPushEnabled()`: Read from localStorage

**Integration** in `NotificationBell.tsx`:
- When a new notification arrives via Realtime, also call `playNotificationSound()` and `sendBrowserNotification()`
- Respect user's toggle preferences from localStorage

**Login notification** in `AuthContext.tsx`:
- After successful `signIn`, fire a toast: "Welcome back, [name]! Logged in at [timestamp]"

---

### Sub-Phase 11E: Student Dashboard UI Polish

Page-by-page enhancements using existing Framer Motion + Tailwind. No new dependencies.

**1. Overview Page** (`StudentOverview.tsx`):
- Achievement badges: Add glow animation when newly earned (pulse ring effect)
- Recommendations carousel: Horizontal scroll with snap on mobile
- Profile completion bar: Bouncy spring animation on value change
- Stagger all cards with `StaggerContainer`

**2. Profile Page** (`StudentProfile.tsx`):
- Collapsible sections (click card header to expand/collapse with accordion animation)
- Skill tags: Add subtle glow on hover (`hover:shadow-[0_0_8px_theme(colors.primary/0.3)]`)
- Inline edit mode indicator (pen icon that toggles)

**3. Applications Page** (`StudentApplications.tsx`):
- Timeline view: Vertical timeline connector line between application cards
- Status badges with animated icon (pulsing dot for "applied", checkmark for "offered")
- Filter tabs (All, Applied, Shortlisted, etc.) with fade transition

**4. Saved Page** (`StudentSavedInternships.tsx`):
- Card hover: Scale up slightly + shadow glow (already partially done, enhance)
- Empty state with bounce animation

**5. Projects Page** (`StudentProjects.tsx`):
- Cards slide in from bottom (already using StaggerContainer — verify working)
- Hover: Scale + skill badge glow

**6. Messages Page** (`StudentMessages.tsx`):
- New message slide-in from bottom with fade
- Typing indicator (animated dots) when sending
- Unread badge pulse animation

**7. CV Builder** (`StudentCVBuilder.tsx`):
- Already has AI review — add subtle section transition animations
- Step indicator with animated progress dots

**8. Settings Page** (New — covered in Sub-Phase 11C)

---

### Implementation Order
1. Database migration (attach triggers)
2. AI Smart Matching integration in StudentOverview
3. Settings pages + sidebar links + routes
4. Sound + Push notification system
5. Dashboard UI polish pass (all pages)

### Files to Create
- `src/lib/notifications.ts` (sound + push utilities)
- `src/pages/dashboard/student/StudentSettings.tsx`
- `src/pages/dashboard/employer/EmployerSettings.tsx`
- New migration SQL

### Files to Edit
- `src/pages/dashboard/student/StudentOverview.tsx` (AI matching + polish)
- `src/pages/dashboard/student/StudentProfile.tsx` (collapsible sections, glow)
- `src/pages/dashboard/student/StudentApplications.tsx` (timeline, filters)
- `src/pages/dashboard/student/StudentSavedInternships.tsx` (hover polish)
- `src/pages/dashboard/student/StudentProjects.tsx` (animation verify)
- `src/pages/dashboard/student/StudentMessages.tsx` (slide-in, typing indicator)
- `src/pages/dashboard/student/StudentCVBuilder.tsx` (section transitions)
- `src/components/NotificationBell.tsx` (sound + push integration)
- `src/components/StudentSidebar.tsx` (add Settings link)
- `src/components/EmployerSidebar.tsx` (add Settings link)
- `src/components/MobileTabBar.tsx` (no change needed — already good)
- `src/contexts/AuthContext.tsx` (login welcome toast)
- `src/App.tsx` (new routes)

