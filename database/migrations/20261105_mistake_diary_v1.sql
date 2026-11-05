-- SJN Mistake Diary V1, staging-only additive schema.
-- Submission, attempts, attempt_items, revisions and scores remain immutable.
-- All queries execute with the authenticated student's RLS context.
BEGIN;

CREATE TABLE IF NOT EXISTS public.sjn_mistake_annotations (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mcq_id bigint NOT NULL REFERENCES public.mcqs(id) ON DELETE CASCADE,
  category text NULL CHECK (category IS NULL OR category IN
    ('information','conceptual','silly','retention')),
  learning_note text NOT NULL DEFAULT '' CHECK (char_length(learning_note) <= 1200),
  review_status text NOT NULL DEFAULT 'need-review' CHECK
    (review_status IN ('need-review','in-progress','mastered')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status_updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id,mcq_id)
);

ALTER TABLE public.sjn_mistake_annotations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sjn_mistake_annotations FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE ON public.sjn_mistake_annotations TO authenticated;

DROP POLICY IF EXISTS sjn_mistakes_student_read ON public.sjn_mistake_annotations;
CREATE POLICY sjn_mistakes_student_read ON public.sjn_mistake_annotations
FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS sjn_mistakes_student_insert ON public.sjn_mistake_annotations;
CREATE POLICY sjn_mistakes_student_insert ON public.sjn_mistake_annotations
FOR INSERT TO authenticated WITH CHECK (
  user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.attempt_items i
    WHERE i.user_id = (SELECT auth.uid()) AND i.mcq_id = sjn_mistake_annotations.mcq_id
      AND i.is_correct = false AND i.selected_index IS NOT NULL
  )
);

DROP POLICY IF EXISTS sjn_mistakes_student_update ON public.sjn_mistake_annotations;
CREATE POLICY sjn_mistakes_student_update ON public.sjn_mistake_annotations
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (
  user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.attempt_items i
    WHERE i.user_id = (SELECT auth.uid()) AND i.mcq_id = sjn_mistake_annotations.mcq_id
      AND i.is_correct = false AND i.selected_index IS NOT NULL
  )
);

CREATE OR REPLACE FUNCTION public.sjn_mistake_annotation_touch()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.review_status IS DISTINCT FROM OLD.review_status THEN
    NEW.status_updated_at := now();
  ELSE
    NEW.status_updated_at := OLD.status_updated_at;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sjn_mistake_annotation_touch() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS sjn_mistake_annotation_touch_trg ON public.sjn_mistake_annotations;
CREATE TRIGGER sjn_mistake_annotation_touch_trg
BEFORE UPDATE ON public.sjn_mistake_annotations
FOR EACH ROW EXECUTE FUNCTION public.sjn_mistake_annotation_touch();

CREATE INDEX IF NOT EXISTS sjn_attempt_items_wrong_student_question
ON public.attempt_items (user_id,mcq_id,attempt_id DESC)
WHERE is_correct = false AND selected_index IS NOT NULL;

-- RLS-invoker view: the latest genuinely incorrect saved response per MCQ,
-- plus count of all incorrect submissions for that student and MCQ.
-- No manufactured question records from legacy summary-only attempts.
CREATE OR REPLACE VIEW public.sjn_mistake_diary_entries
WITH (security_invoker = true) AS
WITH mistakes AS (
 SELECT i.user_id,i.mcq_id,i.mcq_revision_id,i.selected_index,
        i.attempt_id,i.position,at.title AS attempt_title,
        at.selection_json,at.created_at AS attempt_date,
        count(*) OVER (PARTITION BY i.user_id,i.mcq_id) AS wrong_count,
        row_number() OVER (PARTITION BY i.user_id,i.mcq_id
          ORDER BY at.created_at DESC,at.id DESC,i.position DESC) AS rn
 FROM public.attempt_items i
 JOIN public.attempts at ON at.id=i.attempt_id AND at.user_id=i.user_id
 WHERE i.selected_index IS NOT NULL AND i.is_correct=false
   AND at.details_version=1
), latest AS (
 SELECT * FROM mistakes WHERE rn=1
), classified AS (
 SELECT l.*,r.bank,r.subject,r.chapter,r.topic,r.source,r.question,
        r.options_json,r.correct_index,r.explanation,r.mnemonic,
        CASE
          WHEN (l.selection_json->>'courseTestId') ~ '^[0-9]{1,15}$'
             OR r.bank='SJN MedNest Course Tests' THEN 'courses'
          WHEN r.bank <> 'Past Papers Question Bank'
             AND (r.bank ILIKE '%MDCAT Past Papers' OR r.bank ILIKE '%NUMS%Past Papers')
            THEN 'papers'
          ELSE 'banks'
        END AS source_kind
 FROM latest l
 JOIN public.mcq_revisions r ON r.id=l.mcq_revision_id AND r.mcq_id=l.mcq_id
)
SELECT c.user_id,c.mcq_id,c.mcq_revision_id AS revision_id,c.selected_index,
 c.correct_index,c.attempt_id,c.position,c.attempt_title,c.attempt_date AS last_wrong_at,
 c.wrong_count,c.source_kind,c.bank,c.subject,
 COALESCE(c.chapter,'') AS chapter,COALESCE(c.topic,'') AS topic,
 COALESCE(c.source,'') AS source,c.question,c.options_json,
 COALESCE(c.explanation,'') AS explanation,COALESCE(c.mnemonic,'') AS mnemonic,
 CASE WHEN c.source_kind='courses' AND (c.selection_json->>'courseTestId') ~ '^[0-9]{1,15}$'
   THEN (c.selection_json->>'courseTestId')::bigint ELSE NULL END AS course_test_id,
 CASE WHEN c.source_kind='courses' THEN
   CASE WHEN ct.session_code='genome' THEN 'Genome Test Session 2026'
        WHEN ct.session_code IS NOT NULL THEN initcap(replace(ct.session_code,'-',' ')) || ' Session'
        ELSE 'Course Tests' END ELSE '' END AS course_title,
 CASE WHEN c.source_kind='courses' THEN
   COALESCE('Test '||lpad(ct.test_number::text,2,'0')||' — '||ct.title,c.attempt_title)
   ELSE '' END AS test_title,
 CASE WHEN c.source_kind='papers' THEN c.attempt_title ELSE '' END AS paper_title,
 a.category, COALESCE(a.learning_note,'') AS learning_note,
 CASE WHEN a.review_status='mastered' AND c.attempt_date > a.status_updated_at
      THEN 'need-review' ELSE COALESCE(a.review_status,'need-review') END AS review_status,
 a.updated_at AS annotation_updated_at
FROM classified c
LEFT JOIN public.sjn_mistake_annotations a
 ON a.user_id=c.user_id AND a.mcq_id=c.mcq_id
LEFT JOIN public.sjn_course_tests ct
 ON c.source_kind='courses'
 AND ct.id=CASE WHEN (c.selection_json->>'courseTestId') ~ '^[0-9]{1,15}$'
        THEN (c.selection_json->>'courseTestId')::bigint ELSE NULL END;

REVOKE ALL ON public.sjn_mistake_diary_entries FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.sjn_mistake_diary_entries TO authenticated;

-- One lightweight catalog read supports three navigation trees and all-time
-- student-owned status totals; question text and answer options load on demand.
CREATE OR REPLACE FUNCTION public.sjn_mistake_diary_catalog()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 WITH mine AS (
  SELECT source_kind,subject,chapter,course_test_id,course_title,test_title,
         paper_title,review_status,category
  FROM public.sjn_mistake_diary_entries
  WHERE user_id=(SELECT auth.uid())
 ), totals AS (
  SELECT count(*)::integer AS total,
    count(*) FILTER(WHERE review_status='need-review')::integer AS need_review,
    count(*) FILTER(WHERE review_status='in-progress')::integer AS in_progress,
    count(*) FILTER(WHERE review_status='mastered')::integer AS mastered,
    count(*) FILTER(WHERE category IS NULL)::integer AS uncategorized
  FROM mine
 ), groupings AS (
  SELECT source_kind,subject,chapter,course_test_id,course_title,test_title,paper_title,
         count(*)::integer AS mistake_count
  FROM mine GROUP BY source_kind,subject,chapter,course_test_id,
                     course_title,test_title,paper_title
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

COMMIT;
