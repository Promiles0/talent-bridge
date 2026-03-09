
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('student', 'employer', 'admin');
CREATE TYPE public.application_status AS ENUM ('applied', 'shortlisted', 'interview', 'offered', 'rejected', 'withdrawn');
CREATE TYPE public.internship_status AS ENUM ('draft', 'active', 'paused', 'closed');
CREATE TYPE public.work_type AS ENUM ('remote', 'on-site', 'hybrid');

-- ============================================================
-- HELPER: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- PROFILES (one per auth user)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- USER ROLES (separate table per security best practice)
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Roles are inserted by trigger only"
  ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- ============================================================
-- COMPANIES
-- ============================================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  location TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies are viewable by everyone"
  ON public.companies FOR SELECT USING (true);
CREATE POLICY "Owners can insert company"
  ON public.companies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update company"
  ON public.companies FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete company"
  ON public.companies FOR DELETE USING (auth.uid() = owner_id);

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- STUDENTS (extended profile for student role)
-- ============================================================
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  university TEXT,
  field_of_study TEXT,
  graduation_year INT,
  cv_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student profiles are viewable by everyone"
  ON public.students FOR SELECT USING (true);
CREATE POLICY "Students can insert own profile"
  ON public.students FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can update own profile"
  ON public.students FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- SKILLS & STUDENT_SKILLS
-- ============================================================
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills are viewable by everyone"
  ON public.skills FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add skills"
  ON public.skills FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE public.student_skills (
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  PRIMARY KEY (student_id, skill_id)
);
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Student skills viewable by everyone"
  ON public.student_skills FOR SELECT USING (true);
CREATE POLICY "Students can manage own skills"
  ON public.student_skills FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid())
  );
CREATE POLICY "Students can remove own skills"
  ON public.student_skills FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid())
  );

-- ============================================================
-- PROJECTS (student portfolio)
-- ============================================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  project_url TEXT,
  repo_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects viewable by everyone"
  ON public.projects FOR SELECT USING (true);
CREATE POLICY "Students can manage own projects"
  ON public.projects FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid())
  );
CREATE POLICY "Students can update own projects"
  ON public.projects FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid())
  );
CREATE POLICY "Students can delete own projects"
  ON public.projects FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid())
  );

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- INTERNSHIPS
-- ============================================================
CREATE TABLE public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  location TEXT,
  work_type work_type NOT NULL DEFAULT 'on-site',
  stipend TEXT,
  duration TEXT,
  spots INT DEFAULT 1,
  status internship_status NOT NULL DEFAULT 'draft',
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active internships viewable by everyone"
  ON public.internships FOR SELECT USING (status = 'active' OR EXISTS (
    SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid()
  ));
CREATE POLICY "Company owners can insert internships"
  ON public.internships FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
  );
CREATE POLICY "Company owners can update internships"
  ON public.internships FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
  );
CREATE POLICY "Company owners can delete internships"
  ON public.internships FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.companies WHERE id = company_id AND owner_id = auth.uid())
  );

CREATE TRIGGER update_internships_updated_at
  BEFORE UPDATE ON public.internships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status application_status NOT NULL DEFAULT 'applied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (internship_id, student_id)
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own applications"
  ON public.applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.internships i
      JOIN public.companies c ON c.id = i.company_id
      WHERE i.id = internship_id AND c.owner_id = auth.uid()
    )
  );
CREATE POLICY "Students can apply"
  ON public.applications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid())
  );
CREATE POLICY "Students can update own applications"
  ON public.applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = student_id AND user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.internships i
      JOIN public.companies c ON c.id = i.company_id
      WHERE i.id = internship_id AND c.owner_id = auth.uid()
    )
  );

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receivers can mark as read"
  ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- ============================================================
-- FLAGS (content moderation)
-- ============================================================
CREATE TABLE public.flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create flags"
  ON public.flags FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own flags"
  ON public.flags FOR SELECT USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update flags"
  ON public.flags FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('cvs', 'cvs', false, 5242880, ARRAY['application/pdf']);

-- Avatar storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- CV storage policies
CREATE POLICY "Users can view own CV"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Employers can view applicant CVs"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'cvs' AND public.has_role(auth.uid(), 'employer')
  );
CREATE POLICY "Users can upload own CV"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users can update own CV"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Users can delete own CV"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX idx_internships_company_id ON public.internships(company_id);
CREATE INDEX idx_internships_status ON public.internships(status);
CREATE INDEX idx_applications_internship_id ON public.applications(internship_id);
CREATE INDEX idx_applications_student_id ON public.applications(student_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_flags_target ON public.flags(target_type, target_id);
