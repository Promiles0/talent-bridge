-- 1. Add FK from students.user_id to profiles.id
ALTER TABLE public.students 
ADD CONSTRAINT students_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- 2. Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 3. Trigger: notify student when application status changes
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _student_user_id UUID;
  _internship_title TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT s.user_id INTO _student_user_id
    FROM students s WHERE s.id = NEW.student_id;

    SELECT i.title INTO _internship_title
    FROM internships i WHERE i.id = NEW.internship_id;

    INSERT INTO notifications (user_id, type, title, body, link)
    VALUES (
      _student_user_id,
      'application_status',
      'Application Update',
      'Your application for "' || COALESCE(_internship_title, 'an internship') || '" is now ' || NEW.status,
      '/dashboard/student/applications'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_application_status_change();

-- 4. Trigger: notify receiver when a new message is sent
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sender_name TEXT;
BEGIN
  SELECT p.full_name INTO _sender_name
  FROM profiles p WHERE p.id = NEW.sender_id;

  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (
    NEW.receiver_id,
    'message',
    'New Message',
    'You have a new message from ' || COALESCE(_sender_name, 'someone'),
    '/dashboard/student/messages'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();