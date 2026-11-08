-- Mistake Diary V1.1: aggregate catalog by the navigation identity, not
-- subject/chapter for courses and full-length papers.
-- Does not change mistakes, source answers, annotations or scores.
CREATE OR REPLACE FUNCTION public.sjn_mistake_diary_catalog()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 WITH mine AS (
  SELECT source_kind,subject,chapter,course_test_id,course_title,test_title,
         paper_title,review_status,category
  FROM public.sjn_mistake_diary_entries
  WHERE user_id = (SELECT auth.uid())
 ), totals AS (
  SELECT count(*)::integer AS total,
    count(*) FILTER(WHERE review_status='need-review')::integer AS need_review,
    count(*) FILTER(WHERE review_status='in-progress')::integer AS in_progress,
    count(*) FILTER(WHERE review_status='mastered')::integer AS mastered,
    count(*) FILTER(WHERE category IS NULL)::integer AS uncategorized
  FROM mine
 ), normalized AS (
  SELECT source_kind,
    CASE WHEN source_kind='banks' THEN subject ELSE '' END AS subject,
    CASE WHEN source_kind='banks' THEN chapter ELSE '' END AS chapter,
    CASE WHEN source_kind='courses' THEN course_test_id ELSE NULL END AS course_test_id,
    CASE WHEN source_kind='courses' THEN course_title ELSE '' END AS course_title,
    CASE WHEN source_kind='courses' THEN test_title ELSE '' END AS test_title,
    CASE WHEN source_kind='papers' THEN paper_title ELSE '' END AS paper_title
  FROM mine
 ), groupings AS (
  SELECT source_kind,subject,chapter,course_test_id,course_title,test_title,paper_title,
         count(*)::integer AS mistake_count
  FROM normalized
  GROUP BY source_kind,subject,chapter,course_test_id,course_title,test_title,paper_title
 )
 SELECT jsonb_build_object(
  'totals',(SELECT to_jsonb(t) FROM totals t),
  'groups',COALESCE((SELECT jsonb_agg(to_jsonb(g) ORDER BY g.source_kind,g.subject,
                g.chapter,g.course_title,g.test_title,g.paper_title)
                FROM groupings g),'[]'::jsonb)
 );
$$;
REVOKE ALL ON FUNCTION public.sjn_mistake_diary_catalog() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sjn_mistake_diary_catalog() TO authenticated;
