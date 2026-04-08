

## Phase 10: AI-Powered Features + Critical Auth/Data Bug Fix

---

### CRITICAL BUG FIX (Must be done first)

**Problem**: Users sign up as "student" and can access the student dashboard, but cannot apply for internships ("Only students can apply") and show as "unknown" role in admin.

**Root causes**:
1. **No triggers are attached in the database** — the trigger functions (`handle_new_user`, `handle_new_user_role`, `notify_application_status_change`, `notify_new_message`) all exist but have ZERO triggers pointing to them. The `students` table has 0 rows despite confirmed student signups.
2. **No auto-creation of `students` row** — there is no trigger function that creates a `students` record when a user signs up with role "student". Similarly, no `companies` row is created for employers.
3. **Admin Users query** shows "unknown" because user_roles SELECT policy requires `auth.uid() = user_id`, so the admin can only see their own role — not other users' roles. Need an admin SELECT policy.

**Database migration**:
- Attach all existing trigger functions to their tables (auth.users for `handle_new_user` and `handle_new_user_role`)
- Attach `notify_application_status_change` on applications and `notify_new_message` on messages
- Create a new trigger function `handle_new_student_or_employer` that auto-creates a `students` row (for student role) or `companies` row (for employer role) when a user signs up
- Add an admin-readable SELECT policy on `user_roles` so the admin dashboard can see all roles
- Backfill: create `students` rows for existing student users who are missing them
- Add INSERT policy on `notifications` for trigger functions (they use SECURITY DEFINER so the trigger itself bypasses RLS, but verify)

**Files**: New migration SQL

---

### 1. AI-Powered CV Review (Student CV Builder)

Add an "AI Review" button to `StudentCVBuilder.tsx` that sends the current CV data to a backend function and displays improvement suggestions.

**Backend**: Create edge function `supabase/functions/ai-cv-review/index.ts`
- Accepts CV data (education, experience, skills, summary)
- Calls Lovable AI Gateway with a system prompt focused on CV analysis
- Returns structured suggestions (strengths, improvements, missing sections)

**Frontend**: Add a button + results panel in `StudentCVBuilder.tsx`
- "Get AI Review" button below the CV preview
- Shows suggestions in a card with categorized feedback (strengths in green, improvements in amber)
- Loading state with skeleton

---

### 2. AI Internship Description Generator (Employer)

Add an "AI Generate" button to the internship creation form in `EmployerInternships.tsx`.

**Backend**: Create edge function `supabase/functions/ai-internship-generator/index.ts`
- Accepts job title, company name, optional keywords
- Returns description, requirements, responsibilities as structured text

**Frontend**: Add a sparkle button next to the title field in the create internship dialog
- Click → sends title to edge function → auto-fills description, requirements fields
- Shows a loading spinner while generating

---

### 3. AI Career Advisor Chatbot (Student Dashboard)

Add a floating chat widget on the student dashboard that provides career advice.

**Backend**: Create edge function `supabase/functions/ai-career-chat/index.ts`
- Streaming chat endpoint using Lovable AI Gateway
- System prompt: career advisor for students, interview tips, CV guidance, career planning
- Sends full conversation history for context

**Frontend**: Create `src/components/AIChatWidget.tsx`
- Floating button (bottom-right) with expand/collapse
- Chat interface with message bubbles, markdown rendering
- Streaming token-by-token display
- Only visible on student dashboard pages

---

### 4. AI-Powered Smart Internship Matching (Suggested addition)

Enhance the existing "Recommended Internships" section on StudentOverview to use AI for smarter matching.

**Backend**: Create edge function `supabase/functions/ai-match-internships/index.ts`
- Takes student skills, bio, field of study
- Takes list of active internships
- Returns ranked matches with a short reason for each match

**Frontend**: Update the recommended section in `StudentOverview.tsx` to show match percentage and AI-generated reason ("Your Python and React skills align with this role")

---

### Implementation Order
1. Database migration (triggers + backfill + policies) — fixes the critical bug
2. AI CV Review edge function + CV Builder integration
3. AI Internship Generator edge function + Employer form integration
4. AI Career Chat edge function + floating widget
5. AI Smart Matching edge function + StudentOverview update

### Files to create/edit
- New migration SQL (triggers, policies, backfill)
- `supabase/functions/ai-cv-review/index.ts` (new)
- `supabase/functions/ai-internship-generator/index.ts` (new)
- `supabase/functions/ai-career-chat/index.ts` (new)
- `supabase/functions/ai-match-internships/index.ts` (new)
- `src/pages/dashboard/student/StudentCVBuilder.tsx` (add AI review button + results)
- `src/pages/dashboard/employer/EmployerInternships.tsx` (add AI generate button)
- `src/components/AIChatWidget.tsx` (new floating chat)
- `src/pages/dashboard/student/StudentOverview.tsx` (AI match display)
- `src/components/DashboardLayout.tsx` (include chat widget for students)

