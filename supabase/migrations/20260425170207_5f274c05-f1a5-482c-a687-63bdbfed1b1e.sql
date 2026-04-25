-- ============================================
-- XP EVENTS
-- ============================================
CREATE TABLE public.xp_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_xp_events_user ON public.xp_events(user_id, created_at DESC);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own xp events"
ON public.xp_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp events"
ON public.xp_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ACHIEVEMENTS CATALOG
-- ============================================
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze','silver','gold','platinum','diamond')),
  icon TEXT,
  points INTEGER NOT NULL DEFAULT 10,
  criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are viewable by everyone"
ON public.achievements FOR SELECT
USING (true);

CREATE POLICY "Admins can insert achievements"
ON public.achievements FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update achievements"
ON public.achievements FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete achievements"
ON public.achievements FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- USER ACHIEVEMENTS
-- ============================================
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Public unlocked achievements visible"
ON public.user_achievements FOR SELECT
USING (true);

CREATE POLICY "Users can insert own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- INTERVIEW SLOTS
-- ============================================
CREATE TABLE public.interview_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID NOT NULL,
  internship_id UUID NOT NULL,
  application_id UUID,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  meeting_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','accepted','declined','completed','no_show','cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_interview_slots_employer ON public.interview_slots(employer_id, start_at);
CREATE INDEX idx_interview_slots_application ON public.interview_slots(application_id);

ALTER TABLE public.interview_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers manage own interview slots"
ON public.interview_slots FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.owner_id = auth.uid() AND c.id IN (
      SELECT company_id FROM public.internships WHERE id = interview_slots.internship_id
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.owner_id = auth.uid() AND c.id IN (
      SELECT company_id FROM public.internships WHERE id = interview_slots.internship_id
    )
  )
);

CREATE POLICY "Students can view their interview slots"
ON public.interview_slots FOR SELECT
USING (
  application_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.students s ON s.id = a.student_id
    WHERE a.id = interview_slots.application_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Students can update their interview slot status"
ON public.interview_slots FOR UPDATE
USING (
  application_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.students s ON s.id = a.student_id
    WHERE a.id = interview_slots.application_id AND s.user_id = auth.uid()
  )
);

CREATE TRIGGER update_interview_slots_updated_at
BEFORE UPDATE ON public.interview_slots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_actor ON public.audit_log(actor_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.audit_log FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert audit entries"
ON public.audit_log FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = actor_id);

-- ============================================
-- SEED ACHIEVEMENTS
-- ============================================
INSERT INTO public.achievements (key, title, description, tier, icon, points) VALUES
  ('first_steps',         'First Steps',          'Complete your profile basics',                  'bronze',   'sparkles',    10),
  ('skill_collector',     'Skill Collector',      'Add at least 5 skills to your profile',         'bronze',   'tag',         15),
  ('cv_uploaded',         'CV Ready',             'Upload your first CV',                          'bronze',   'file-text',   10),
  ('first_application',   'Application Sent',     'Apply to your first internship',                'silver',   'briefcase',   25),
  ('project_showcaser',   'Showcaser',            'Add 3 projects to your portfolio',              'silver',   'folder',      30),
  ('ai_reviewed',         'AI-Reviewed',          'Get your CV reviewed by AI',                    'silver',   'brain',       20),
  ('five_applications',   'On the Hunt',          'Send 5 applications',                           'gold',     'target',      50),
  ('first_interview',     'Interview Invited',    'Receive your first interview invitation',       'gold',     'calendar',    75),
  ('week_streak',         '7-Day Streak',         'Stay active 7 days in a row',                   'gold',     'flame',       60),
  ('first_offer',         'Offer Received',       'Receive your first internship offer',           'platinum', 'trophy',     150),
  ('top_profile',         'Featured Talent',      'Reach a complete portfolio with skills, projects, and CV', 'platinum', 'star', 100),
  ('legend',              'TalentBridge Legend',  'Earn 1000 total XP',                            'diamond',  'crown',      250);
