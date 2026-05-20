
DROP VIEW IF EXISTS public.reputation_scores;
CREATE VIEW public.reputation_scores
WITH (security_invoker = true) AS
SELECT
  subject_id AS user_id,
  subject_role,
  AVG(rating)::numeric(3,2) AS avg_rating,
  COUNT(*) AS review_count
FROM public.reviews
GROUP BY subject_id, subject_role;

GRANT SELECT ON public.reputation_scores TO anon, authenticated;
