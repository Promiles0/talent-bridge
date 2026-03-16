
-- Saved internships table
CREATE TABLE public.saved_internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, internship_id)
);
ALTER TABLE public.saved_internships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own saved" ON public.saved_internships FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Student milestones table
CREATE TABLE public.student_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  milestone TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, milestone)
);
ALTER TABLE public.student_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own milestones" ON public.student_milestones FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students insert own milestones" ON public.student_milestones FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Re-attach notification triggers (functions already exist)
DROP TRIGGER IF EXISTS on_application_status_change ON public.applications;
CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_application_status_change();

DROP TRIGGER IF EXISTS on_new_message ON public.messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();

-- Enable realtime for messages (if not already)
ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_internships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_milestones;
