-- STAGING applied 2026-10-30. Production execution is deferred until separately approved.
-- NUMS is an examination provider rather than a province; it belongs in the
-- Past Papers region/category selector but not in province-specific analytics.
-- Both historical constraints exist in staging, so both must include 'nums'.
ALTER TABLE public.past_papers
  DROP CONSTRAINT IF EXISTS past_papers_region_check;
ALTER TABLE public.past_papers
  ADD CONSTRAINT past_papers_region_check
  CHECK (region IN ('sindh','punjab','kpk','balochistan','federal','nums'));
ALTER TABLE public.past_papers
  DROP CONSTRAINT IF EXISTS sjn_past_papers_region_check;
ALTER TABLE public.past_papers
  ADD CONSTRAINT sjn_past_papers_region_check
  CHECK (region IN ('sindh','punjab','kpk','balochistan','federal','nums'));
