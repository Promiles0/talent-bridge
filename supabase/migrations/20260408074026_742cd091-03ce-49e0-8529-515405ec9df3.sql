
-- Drop existing triggers if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_student_or_employer ON auth.users;
DROP TRIGGER IF EXISTS on_application_status_change ON public.applications;
DROP TRIGGER IF EXISTS on_new_message ON public.messages;

-- 1. Attach handle_new_user (creates profile)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Attach handle_new_user_role (assigns role)
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- 3. Create trigger function for auto student/employer creation
CREATE OR REPLACE FUNCTION public.handle_new_student_or_employer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (NEW.raw_user_meta_data ->> 'role') = 'student' THEN
    INSERT INTO public.students (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  ELSIF (NEW.raw_user_meta_data ->> 'role') = 'employer' THEN
    INSERT INTO public.companies (owner_id, name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'My Company'))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_student_or_employer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_or_employer();

-- 4. Notification triggers
CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_application_status_change();

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();

-- 5. Admin can view all user roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Notification insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 7. Backfill students
INSERT INTO public.students (user_id)
SELECT ur.user_id
FROM public.user_roles ur
WHERE ur.role = 'student'
  AND NOT EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = ur.user_id);

-- 8. Backfill companies
INSERT INTO public.companies (owner_id, name)
SELECT ur.user_id, COALESCE(p.full_name, 'My Company')
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.id = ur.user_id
WHERE ur.role = 'employer'
  AND NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.owner_id = ur.user_id);
