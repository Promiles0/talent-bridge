
-- Extend interview_slots
ALTER TABLE public.interview_slots
  ADD COLUMN IF NOT EXISTS student_response text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reschedule_reason text;

-- offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  employer_id uuid NOT NULL,
  student_id uuid NOT NULL,
  internship_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  stipend text,
  terms text NOT NULL,
  pdf_url text,
  signature_data jsonb,
  status text NOT NULL DEFAULT 'sent',
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers manage own offers" ON public.offers
FOR ALL USING (auth.uid() = employer_id) WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Students view own offers" ON public.offers
FOR SELECT USING (EXISTS (SELECT 1 FROM students s WHERE s.id = offers.student_id AND s.user_id = auth.uid()));

CREATE POLICY "Students accept/decline own offers" ON public.offers
FOR UPDATE USING (EXISTS (SELECT 1 FROM students s WHERE s.id = offers.student_id AND s.user_id = auth.uid()));

CREATE TRIGGER trg_offers_updated BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- onboarding tasks
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'pending',
  assignee text NOT NULL DEFAULT 'student',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Offer parties read tasks" ON public.onboarding_tasks
FOR SELECT USING (EXISTS (
  SELECT 1 FROM offers o LEFT JOIN students s ON s.id = o.student_id
  WHERE o.id = onboarding_tasks.offer_id
    AND (o.employer_id = auth.uid() OR s.user_id = auth.uid())
));

CREATE POLICY "Employers manage tasks" ON public.onboarding_tasks
FOR ALL USING (EXISTS (SELECT 1 FROM offers o WHERE o.id = onboarding_tasks.offer_id AND o.employer_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM offers o WHERE o.id = onboarding_tasks.offer_id AND o.employer_id = auth.uid()));

CREATE POLICY "Students toggle own tasks" ON public.onboarding_tasks
FOR UPDATE USING (EXISTS (
  SELECT 1 FROM offers o JOIN students s ON s.id = o.student_id
  WHERE o.id = onboarding_tasks.offer_id AND s.user_id = auth.uid()
));

CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.onboarding_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for signed offer PDFs (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('offers', 'offers', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Offer parties read files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'offers' AND EXISTS (
    SELECT 1 FROM public.offers o LEFT JOIN public.students s ON s.id = o.student_id
    WHERE (storage.foldername(name))[1] = o.id::text
      AND (o.employer_id = auth.uid() OR s.user_id = auth.uid())
  )
);

CREATE POLICY "Employers upload offer files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'offers' AND EXISTS (
    SELECT 1 FROM public.offers o
    WHERE (storage.foldername(name))[1] = o.id::text AND o.employer_id = auth.uid()
  )
);

CREATE POLICY "Students upload signed file" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'offers' AND EXISTS (
    SELECT 1 FROM public.offers o JOIN public.students s ON s.id = o.student_id
    WHERE (storage.foldername(name))[1] = o.id::text AND s.user_id = auth.uid()
  )
);

-- Notify student when offer is sent
CREATE OR REPLACE FUNCTION public.notify_offer_sent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _user_id uuid; _title text;
BEGIN
  SELECT user_id INTO _user_id FROM students WHERE id = NEW.student_id;
  SELECT title INTO _title FROM internships WHERE id = NEW.internship_id;
  IF _user_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (_user_id, 'offer', 'New Offer',
            'You received an offer for ' || COALESCE(_title, 'an internship'),
            '/dashboard/student/offers');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_offer_sent AFTER INSERT ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.notify_offer_sent();

-- Notify employer when student responds to offer
CREATE OR REPLACE FUNCTION public.notify_offer_response()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('accepted','declined') THEN
    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (NEW.employer_id, 'offer',
            'Offer ' || NEW.status,
            'A student has ' || NEW.status || ' your offer.',
            '/dashboard/employer/applications');
    IF NEW.status = 'accepted' THEN
      UPDATE applications SET status = 'offered' WHERE id = NEW.application_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_offer_response AFTER UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.notify_offer_response();

-- Notify student when interview slots proposed
CREATE OR REPLACE FUNCTION public.notify_interview_proposed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _user_id uuid; _title text;
BEGIN
  IF NEW.application_id IS NOT NULL THEN
    SELECT s.user_id, i.title INTO _user_id, _title
    FROM applications a
    JOIN students s ON s.id = a.student_id
    JOIN internships i ON i.id = a.internship_id
    WHERE a.id = NEW.application_id;
    IF _user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, body, link)
      VALUES (_user_id, 'interview', 'Interview Proposed',
              'Pick a time for your ' || COALESCE(_title,'') || ' interview',
              '/dashboard/student/interviews');
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_interview_proposed AFTER INSERT ON public.interview_slots
FOR EACH ROW EXECUTE FUNCTION public.notify_interview_proposed();
