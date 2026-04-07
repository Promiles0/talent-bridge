

## Phase 9: Preloader Overhaul, Real-Time Toast Notifications, and Final Polish

---

### 1. Preloader Redesign

Replace the current `Preloader.tsx` with the advanced design from the user's HTML reference. Key differences from current:

- **Letter-drop animation** (CSS keyframes, staggered per letter) instead of Framer Motion character reveal
- **Green dot** after "e" with pulse ring effect (`dotPop` + `ringPulse` keyframes)
- **Underline sweep** gradient line that animates width 0→100%
- **Enhanced progress bar** with shimmer gradient, glowing tip dot with box-shadow
- **Status text** ("Initializing" → percentage) below the bar
- **Particle canvas** background (simple floating dots, pure canvas, no library)
- **Exit animation**: scale(0.94) + blur(6px) + fade out on completion

Keep the same integration in `main.tsx`. The preloader still calls `onComplete` when the bar reaches 100%. Use our emerald green (`#2ECC71` / `hsl(160 84% 50%)`) throughout — matching the reference but with our brand color.

**File**: `src/components/Preloader.tsx` (full rewrite)

---

### 2. Real-Time Notification Toasts on Dashboard

Currently, `NotificationBell.tsx` receives new notifications via Realtime and adds them to the dropdown — but does NOT show a toast. Users only see notifications if they click the bell.

**Fix**: When a new notification arrives via the Realtime subscription in `NotificationBell.tsx`, also fire a `toast()` (sonner) with the notification title and body. Make it clickable to navigate to `n.link`.

This is a small change — add ~3 lines inside the existing `postgres_changes` callback in `NotificationBell.tsx`.

**File**: `src/components/NotificationBell.tsx`

---

### 3. Missing DB Triggers (Critical)

The database shows "There are no triggers in the database" despite having trigger functions (`notify_application_status_change`, `notify_new_message`). This means notifications are NEVER actually created automatically.

**Migration** to attach triggers:
```sql
DROP TRIGGER IF EXISTS on_application_status_change ON applications;
CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON applications FOR EACH ROW
  EXECUTE FUNCTION notify_application_status_change();

DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();
```

Also need INSERT policy on notifications for the trigger functions (they use `SECURITY DEFINER` so this may already work, but verify).

---

### 4. Application Delete Policy (Missing)

Students cannot withdraw applications because there's no DELETE RLS policy on `applications`. Add:
```sql
CREATE POLICY "Students can delete own applications"
ON applications FOR DELETE USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = applications.student_id AND students.user_id = auth.uid())
);
```

---

### 5. Internship Cards — Bookmark Button on Board

Currently the bookmark/save button only exists on the internship detail page. Add a small bookmark icon button to the top-right of every internship card on `/internships` and on the student overview recommended section. Only visible to logged-in students.

**Files**: `src/pages/Internships.tsx`, `src/pages/dashboard/student/StudentOverview.tsx`

---

### 6. Polish Pass

- **Internship cards hover**: Ensure all cards on `/internships` have the lift+glow hover from GlassCard (already using GlassCard, so this should work)
- **Empty state animations**: Add `animate-fade-in` class to all empty state containers across dashboards
- **Preloader respects reduced motion**: Skip animations if `prefers-reduced-motion` is set

---

### Implementation Order
1. Database migration (triggers + delete policy)
2. Preloader rewrite
3. NotificationBell toast integration
4. Bookmark button on internship cards
5. Polish pass

### Files to create/edit
- `supabase/migrations/phase9_triggers.sql` (new)
- `src/components/Preloader.tsx` (full rewrite)
- `src/components/NotificationBell.tsx` (add toast on new notification)
- `src/pages/Internships.tsx` (add bookmark button to cards)
- `src/pages/dashboard/student/StudentOverview.tsx` (add bookmark to recommended cards)

