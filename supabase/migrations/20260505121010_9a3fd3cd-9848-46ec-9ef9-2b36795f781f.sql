
-- 1. calendar_events
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  link TEXT,
  related_application_id UUID,
  related_internship_id UUID,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own events" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_calendar_events_user_starts ON public.calendar_events(user_id, starts_at);
CREATE TRIGGER trg_calendar_events_updated BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.talent_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.talent_shortlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employers manage own shortlists" ON public.talent_shortlists FOR ALL USING (auth.uid() = employer_id) WITH CHECK (auth.uid() = employer_id);
CREATE TRIGGER trg_talent_shortlists_updated BEFORE UPDATE ON public.talent_shortlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.shortlist_members (
  shortlist_id UUID NOT NULL REFERENCES public.talent_shortlists(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (shortlist_id, student_id)
);
ALTER TABLE public.shortlist_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage shortlist members" ON public.shortlist_members FOR ALL
  USING (EXISTS (SELECT 1 FROM public.talent_shortlists s WHERE s.id = shortlist_id AND s.employer_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.talent_shortlists s WHERE s.id = shortlist_id AND s.employer_id = auth.uid()));

CREATE TABLE public.presence (
  user_id UUID PRIMARY KEY,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'online'
);
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Presence visible to authenticated" ON public.presence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users upsert own presence ins" ON public.presence FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users upsert own presence upd" ON public.presence FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.typing_indicators (
  conversation_key TEXT NOT NULL,
  user_id UUID NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_key, user_id)
);
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Typing readable by participants" ON public.typing_indicators FOR SELECT TO authenticated
  USING (position(auth.uid()::text in conversation_key) > 0);
CREATE POLICY "Users write own typing ins" ON public.typing_indicators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users write own typing upd" ON public.typing_indicators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own typing" ON public.typing_indicators FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS tagline TEXT,
  ADD COLUMN IF NOT EXISTS story TEXT,
  ADD COLUMN IF NOT EXISTS culture_values JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT,
  ADD COLUMN IF NOT EXISTS brand_color TEXT,
  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT;

CREATE OR REPLACE FUNCTION public.create_deadline_event_on_apply()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user_id UUID;
  _title TEXT;
  _deadline TIMESTAMPTZ;
BEGIN
  SELECT s.user_id INTO _user_id FROM students s WHERE s.id = NEW.student_id;
  SELECT i.title, i.deadline INTO _title, _deadline FROM internships i WHERE i.id = NEW.internship_id;
  IF _user_id IS NOT NULL AND _deadline IS NOT NULL THEN
    INSERT INTO calendar_events (user_id, title, type, starts_at, ends_at, related_application_id, related_internship_id, color)
    VALUES (_user_id, 'Deadline: ' || COALESCE(_title, 'Internship'), 'deadline', _deadline, _deadline, NEW.id, NEW.internship_id, '#ef4444');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_app_create_deadline_event
AFTER INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.create_deadline_event_on_apply();

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.presence; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
