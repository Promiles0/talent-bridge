

## Phase 5: CV Builder, E2E Testing, and Modern Polish

### 1. Student CV Builder (New Page)
Create `src/pages/dashboard/student/StudentCVBuilder.tsx` with a multi-section form that builds a downloadable PDF CV:
- **Sections:** Personal info (auto-filled from profile), Education (add multiple entries), Work Experience (add multiple entries), Skills (pulled from `student_skills` + manual additions), Languages, and a Summary/Objective
- **Live preview panel** on the right side showing the CV layout in real-time as the user fills sections
- **PDF generation** using an edge function with the Lovable AI model to format content into a professional PDF (using `jspdf` or similar approach client-side), or alternatively generate HTML and use the browser's `window.print()` with a print-optimized stylesheet
- **Approach:** Use client-side PDF generation with a clean template. Install no new deps -- use `window.print()` on a styled hidden div with `@media print` CSS for a clean, modern CV output
- Add route `/dashboard/student/cv-builder` and sidebar link in `StudentSidebar.tsx`

### 2. Students Page: Live Data Instead of Mock
`src/pages/Students.tsx` currently uses hardcoded mock data. Replace with real Supabase queries joining `students`, `profiles`, `student_skills`, and `skills` tables. Link "View Profile" to `/students/:studentId`.

### 3. Homepage Featured Sections: Live Data
`src/pages/Index.tsx` uses hardcoded featured internships and students. Replace with real database queries (limit 3 each, ordered by recency) so the homepage reflects actual platform content.

### 4. Modern UX Polish
- **Smooth page scroll-to-top** on route change (add `useEffect` in Layout or App)
- **Toast notification sounds** -- skip, keep visual only
- **Animated counters** on dashboard overview stats using framer-motion `useMotionValue`
- **Better 404 page** with illustration and navigation links
- **Loading skeletons** instead of spinners on dashboard pages using the existing Skeleton component
- **Responsive improvements** -- ensure all dashboard pages work well on mobile (the sidebar already collapses via SidebarProvider)

### 5. Employer Application Review Enhancement
Currently `EmployerApplications.tsx` shows applications but viewing the applicant's profile could be improved. Add inline expandable cards showing student bio, skills, and CV download link directly in the applications list.

### 6. E2E Flow Testing
After code changes, browser-test the full flow:
1. Sign up as student, fill profile
2. Sign up as employer, create company, post internship (activate it)
3. As student, browse internships, apply
4. As employer, review application, send message
5. As student, check messages and reply

### Implementation Order
1. CV Builder page + route + sidebar link
2. Students page live data
3. Homepage live data
4. UX polish (scroll-to-top, animated counters, better 404, skeletons)
5. Employer application review enhancement
6. E2E testing

### Technical Details
- CV Builder uses `@media print` CSS and `window.print()` for PDF -- zero new dependencies
- Students page queries: `students` joined with `profiles` for name/avatar, and `student_skills` + `skills` for skill tags
- Homepage queries use `.limit(3).eq("status", "active")` for internships
- Animated counters: framer-motion `animate` prop on stat numbers
- Skeletons: use existing `src/components/ui/skeleton.tsx` in dashboard overview cards

