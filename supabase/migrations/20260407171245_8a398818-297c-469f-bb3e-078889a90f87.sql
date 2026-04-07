
-- Attach trigger functions that already exist but have no triggers
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

-- Allow students to withdraw (delete) their own applications
CREATE POLICY "Students can delete own applications"
  ON public.applications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = applications.student_id
        AND students.user_id = auth.uid()
    )
  );
