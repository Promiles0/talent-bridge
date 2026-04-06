

## Phase 8: Form/Input Design System, Dashboard Polish, and Missing Features

After a thorough audit of the entire codebase, here is what needs to be fixed, enhanced, and added — organized into 3 sub-phases to avoid errors.

---

### Sub-Phase 8A: Global Form/Input Design System (Dark Mode Fix)

**Problem**: In dark mode, form inputs use `--input: 0 0% 100% / 0.06` as the border, making inputs nearly invisible. The background inherits from the card (also very dark), so users cannot see where to type. This affects every form: Projects, Profile, CV Builder, Company, Internships, Login, Signup, Messages, Apply dialog.

**Solution**: Create a universal input design system applied via CSS — no need to edit every form file individually.

**Changes to `src/index.css`**:
- Add new CSS rules for `input`, `textarea`, `select`, and `[role="combobox"]` inside `.dark` scope:
  - Background: `hsl(0 0% 8%)` (slightly lighter than card bg)
  - Border: `1px solid hsl(0 0% 100% / 0.12)` (more visible)
  - Focus: emerald glow ring + brighter border `hsl(160 84% 50% / 0.5)`
  - Text color: `hsl(150 18% 93%)` (ensure readable)
  - Placeholder: `hsl(150 10% 45%)`
- Light mode inputs:
  - Background: `hsl(0 0% 100%)` (pure white)
  - Border: `hsl(150 18% 82%)` (slightly darker than current)
  - Focus: emerald glow
- Labels: ensure `font-weight: 500`, `color: foreground`, `margin-bottom: 6px`
- Dialog/popover dark backgrounds: bump `--popover` from `240 4% 6%` to `240 4% 8%` so dialogs have slight contrast from background
- Select dropdown (`SelectContent`): ensure same input bg treatment
- Buttons in forms: ensure primary buttons have sufficient contrast in both modes

**Also fix**: The `AdminAnalytics.tsx` bar chart still uses hardcoded amber `hsl(34, 90%, 44%)` — change to emerald `hsl(160, 84%, 39%)`.

---

### Sub-Phase 8B: Dashboard Enhancements (All 3 Roles)

**Admin Dashboard — Currently bare-bones, needs major upgrade:**
- `AdminOverview.tsx`: Add welcome banner, animated counters (like Student/Employer), quick actions, recent activity feed (last 5 applications + last 5 signups), glassmorphism card styling
- `AdminUsers.tsx`: Add search/filter by role, pagination, user count header, ability to view user details (expand row to see profile info)
- `AdminAnalytics.tsx`: Fix amber chart colors to emerald. Add more charts: signups over time (last 30 days), top skills, top companies by applications. Add date range selector
- `AdminFlags.tsx`: Add filter (open/resolved), search by reason, add "Flag details" expandable with reporter info

**Employer Dashboard enhancements:**
- `EmployerOverview.tsx`: Show applicant names (not "Application #abc123"), add recent internship listings section, profile completion progress (company name, description, logo, website)
- `EmployerInternships.tsx`: Add edit capability (currently can only create/delete/toggle). Add applicant count per listing. Add empty state with illustration
- `EmployerCompany.tsx`: Add logo upload, add industry field, add company size selector

**Student Dashboard enhancements:**
- `StudentProfile.tsx`: Add skills management section (add/remove skills from a searchable list)
- `StudentProjects.tsx`: Add project cover image upload, edit existing projects (currently can only add/delete)
- `StudentCVBuilder.tsx`: Verify it works correctly and add more template options

---

### Sub-Phase 8C: Micro-Interactions and Transition Polish

Apply subtle, non-noisy animations across dashboards:
- **Card hover**: All dashboard cards get `hover:-translate-y-1 hover:shadow-lg transition-all duration-200` (already on GlassCard but not on plain Card usage)
- **Staggered entry**: Wrap dashboard card grids in StaggerContainer so stats cards animate in sequentially on load
- **Dialog animations**: Add scale+fade entry/exit to all Dialog components via CSS (Radix supports `data-[state=open]` and `data-[state=closed]` attributes)
- **Button feedback**: Primary buttons get subtle scale on active (`active:scale-[0.97]`) 
- **Sidebar active indicator**: Add a sliding pill indicator using framer-motion `layoutId` on the active sidebar link
- **Tab bar**: Add a sliding indicator dot on the active mobile tab
- **Empty states**: Ensure all empty states have a subtle fade-in animation
- **Table rows**: Admin user table rows get hover highlight transition

All animations respect `prefers-reduced-motion`.

---

### Implementation Order
1. **8A** — Global input/form CSS fixes (single file: `index.css` + chart color fix in `AdminAnalytics.tsx`)
2. **8B** — Dashboard enhancements per role (multiple files)
3. **8C** — Micro-interactions layer (CSS + minor component tweaks)

### Files to create/edit
- `src/index.css` (input design system, dialog bg, transitions)
- `src/pages/dashboard/admin/AdminOverview.tsx` (full overhaul)
- `src/pages/dashboard/admin/AdminUsers.tsx` (search, pagination, expand)
- `src/pages/dashboard/admin/AdminAnalytics.tsx` (fix colors, add charts)
- `src/pages/dashboard/admin/AdminFlags.tsx` (filters)
- `src/pages/dashboard/employer/EmployerOverview.tsx` (show names, recent listings)
- `src/pages/dashboard/employer/EmployerInternships.tsx` (edit, applicant count)
- `src/pages/dashboard/employer/EmployerCompany.tsx` (logo upload, fields)
- `src/pages/dashboard/student/StudentProfile.tsx` (skills management)
- `src/pages/dashboard/student/StudentProjects.tsx` (edit, cover image)
- `src/components/MobileTabBar.tsx` (active indicator animation)
- `src/components/StudentSidebar.tsx` (active indicator)
- `src/components/EmployerSidebar.tsx` (active indicator)
- `src/components/AdminSidebar.tsx` (active indicator)

