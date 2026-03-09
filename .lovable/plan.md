

## TalentBridge — MVP Implementation Plan

### Phase 1: Foundation & Design System
- Set up custom color theme (dark default with `#0A0A0F` background, `#F59E0B` amber accent, `#6366F1` indigo secondary) with light mode toggle
- Import **Outfit** (headings) and **DM Sans** (body) from Google Fonts
- Create dot-grid background texture for dark mode, gradient mesh for light mode
- Build glassmorphism card components for both themes
- Set up TalentBridge wordmark navbar with dark/light toggle
- Create reusable components: skeleton loaders, status badges, skill tags, toast notifications
- Add page transition animations (fade + slide up)

### Phase 2: Database & Auth (Supabase)
- Enable Lovable Cloud (Supabase)
- Create database tables: profiles, students, companies, skills, student_skills, projects, internships, applications, messages, flags
- Create separate `user_roles` table for role management (student/employer/admin) with security definer function
- Set up RLS policies for all tables based on user roles
- Build auth pages: signup (with role selector), login, email verification, password reset
- Create storage buckets for avatars (2MB max) and CVs (5MB max, PDF only)

### Phase 3: Public Pages
- **Landing page** (`/`): Hero with dual search (students + internships), value propositions, CTAs, featured internships
- **Student directory** (`/students`): Searchable/filterable grid with student cards (avatar, name, headline, skills)
- **Student profile** (`/students/:id`): Full public profile with projects, skills, education
- **Internship board** (`/internships`): Filterable list with internship cards (company, location, work type, stipend)
- **Internship detail** (`/internships/:id`): Full description with apply button
- **Company page** (`/companies/:id`): Logo, description, open positions
- About, How it Works, Terms, Privacy pages

### Phase 4: Student Dashboard
- Collapsible sidebar layout (desktop) with bottom tabs (mobile)
- **Home**: Recommended internships, profile completion progress bar, notifications
- **Profile editor**: Personal info, education, skills multi-select, social links, availability
- **Projects**: Portfolio manager with add/edit (title, description, cover image, URLs, tags)
- **CV upload**: Drag & drop PDF uploader with progress bar
- **Applications**: List with status badges (Applied/Interview/Offered/Rejected)
- **Messages**: Conversation inbox with real-time updates
- **Settings**: Account, visibility, theme toggle

### Phase 5: Employer Dashboard
- **Home**: Metrics cards (active posts, total applicants, profile views)
- **Company profile editor**: Logo upload, description, website, location
- **Post internship**: Create/edit form with all fields
- **Manage listings**: Edit, pause, close internships
- **Applicant management**: Per-listing applicant list with profile previews, shortlist, status updates, CV download
- **Student search**: Filtered search across student profiles

### Phase 6: Admin Dashboard
- **Overview**: Platform metrics with charts (students, employers, internships, applications)
- **User management**: Table with suspend/delete actions, role badges
- **Company management**: Verify/unverify, suspend
- **Internship moderation**: Flag/remove listings
- **Flagged content queue**: Review and resolve reports

### Design Details
- All cards use glassmorphism in both light and dark modes
- Card hover: subtle lift with border brightening
- Staggered list animations (50ms delay per card)
- Pagination on all list views (20 items/page)
- Route-based code splitting with React.lazy + Suspense
- Semantic HTML with ARIA labels, keyboard navigation, focus rings
- WCAG AA contrast ratios throughout

