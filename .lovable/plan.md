

## Phase 4: Enhancements & Polish

Based on the current state of the app and your suggestions, here is the combined plan:

### 1. Branded Page Preloader ("Talent-Bridge")
Create a `Preloader` component that displays on initial app load before content renders. Inspired by the uploaded image reference:
- Full-screen dark overlay with the "Talent-Bridge" brand name
- Animated typing/reveal effect on the text with an orange/primary-colored progress bar beneath it
- Auto-dismiss after ~2.5 seconds or when the app is ready
- Wrap the entire `App` in the preloader in `main.tsx` using a `useState` + `useEffect` pattern
- Pure CSS/framer-motion animation, no external dependencies

### 2. Default Theme to Light Mode
- Change `ThemeProvider.tsx` default from `"dark"` to `"light"` (when no `localStorage` value exists)
- Change `index.html` from `class="dark"` to `class="light"`
- User preference still persists in `localStorage` as before

### 3. Internships Pagination
- Add pagination state (`page`, `pageSize = 9`) to `Internships.tsx`
- Slice the filtered results by page and render pagination controls at the bottom using the existing `Pagination` UI components
- Show total count and current page indicator

### 4. End-to-End Flow Testing
- Browser-test the full signup-as-student, signup-as-employer, post-internship, apply, and messaging flow
- This will be done interactively after the code changes are implemented

---

### Additional Enhancements (AI-recommended based on current state)

**5. Notification badges on sidebar**
- Show unread message count badges on the Messages nav items in `StudentSidebar` and `EmployerSidebar`

**6. Dashboard empty states**
- Add illustrated empty-state components for when students have no applications, projects, or messages yet -- makes the dashboard feel polished rather than blank

**7. Protected route guards**
- Wrap dashboard routes so unauthenticated users or wrong-role users get redirected to `/login` instead of seeing broken pages

---

### Implementation Order
1. Preloader component + integration in `main.tsx`
2. Theme default change (ThemeProvider + index.html)
3. Internships pagination
4. Protected route guards
5. Sidebar notification badges
6. Dashboard empty states
7. End-to-end testing

All changes are frontend-only except the notification badges which will query the existing `messages` table. No new database migrations needed.

