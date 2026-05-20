
-- ============================================
-- Batch 1: Verified Trust Layer
-- ============================================

-- 1. Extend students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- 2. Verifications table
CREATE TABLE IF NOT EXISTS public.verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('student','company')),
  method text NOT NULL CHECK (method IN ('email_domain','id_upload','rdb','business_email','manual')),
  evidence_url text,
  evidence_data jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewer_id uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own verifications"
  ON public.verifications FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own verifications"
  ON public.verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own pending verifications"
  ON public.verifications FOR UPDATE
  USING ((auth.uid() = user_id AND status = 'pending') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete verifications"
  ON public.verifications FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_verifications_user ON public.verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON public.verifications(status);

CREATE TRIGGER verifications_updated_at
  BEFORE UPDATE ON public.verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Auto-flip verified flag on approval
CREATE OR REPLACE FUNCTION public.apply_verification_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    NEW.reviewed_at = COALESCE(NEW.reviewed_at, now());
    IF NEW.kind = 'student' THEN
      UPDATE public.students SET verified = true, verified_at = now() WHERE user_id = NEW.user_id;
    ELSIF NEW.kind = 'company' THEN
      UPDATE public.companies SET verified = true WHERE owner_id = NEW.user_id;
    END IF;

    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'verification', 'Verification approved',
            'Your ' || NEW.kind || ' verification has been approved.',
            CASE WHEN NEW.kind = 'student' THEN '/dashboard/student/profile' ELSE '/dashboard/employer/branding' END);
  ELSIF NEW.status = 'rejected' AND (OLD.status IS DISTINCT FROM 'rejected') THEN
    NEW.reviewed_at = COALESCE(NEW.reviewed_at, now());
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'verification', 'Verification rejected',
            COALESCE(NEW.notes, 'Please review your submission and try again.'),
            CASE WHEN NEW.kind = 'student' THEN '/dashboard/student/profile' ELSE '/dashboard/employer/branding' END);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER verifications_apply_status
  BEFORE UPDATE ON public.verifications
  FOR EACH ROW EXECUTE FUNCTION public.apply_verification_approval();

-- 4. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  author_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  subject_role text NOT NULL CHECK (subject_role IN ('student','employer')),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(application_id, author_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews readable by everyone"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Participants can create review"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM applications a
      LEFT JOIN students s ON s.id = a.student_id
      LEFT JOIN internships i ON i.id = a.internship_id
      LEFT JOIN companies c ON c.id = i.company_id
      WHERE a.id = reviews.application_id
        AND (s.user_id = auth.uid() OR c.owner_id = auth.uid())
    )
  );

CREATE POLICY "Authors update own reviews"
  ON public.reviews FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors delete own reviews"
  ON public.reviews FOR DELETE USING (auth.uid() = author_id);

CREATE INDEX IF NOT EXISTS idx_reviews_subject ON public.reviews(subject_id);
CREATE INDEX IF NOT EXISTS idx_reviews_application ON public.reviews(application_id);

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. University domains
CREATE TABLE IF NOT EXISTS public.university_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  university_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.university_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Domains readable by everyone"
  ON public.university_domains FOR SELECT USING (true);

CREATE POLICY "Admins manage domains ins"
  ON public.university_domains FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage domains upd"
  ON public.university_domains FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage domains del"
  ON public.university_domains FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.university_domains (domain, university_name) VALUES
  ('ur.ac.rw', 'University of Rwanda'),
  ('aub.rw', 'Adventist University of Central Africa'),
  ('ines.ac.rw', 'INES-Ruhengeri'),
  ('mku.ac.rw', 'Mount Kenya University Rwanda'),
  ('ulk.ac.rw', 'Kigali Independent University ULK'),
  ('alueducation.com', 'African Leadership University'),
  ('cmu.edu', 'Carnegie Mellon University Africa'),
  ('auca.ac.rw', 'Adventist University of Central Africa')
ON CONFLICT (domain) DO NOTHING;

-- 6. Reputation aggregate view
CREATE OR REPLACE VIEW public.reputation_scores AS
SELECT
  subject_id AS user_id,
  subject_role,
  AVG(rating)::numeric(3,2) AS avg_rating,
  COUNT(*) AS review_count
FROM public.reviews
GROUP BY subject_id, subject_role;

GRANT SELECT ON public.reputation_scores TO anon, authenticated;
