
-- Drop existing triggers if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_student_or_employer ON auth.users;
DROP TRIGGER IF EXISTS on_application_status_change ON public.applications;
DROP TRIGGER IF EXISTS on_new_message ON public.messages;

-- Attach handle_new_user to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Attach handle_new_user_role to auth.users
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Attach handle_new_student_or_employer to auth.users
CREATE TRIGGER on_auth_user_created_student_or_employer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_or_employer();

-- Attach notify_application_status_change to applications
CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_application_status_change();

-- Attach notify_new_message to messages
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();
