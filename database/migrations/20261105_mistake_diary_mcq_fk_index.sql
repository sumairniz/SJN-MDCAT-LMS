-- Mistake Diary V1: make the student note table's MCQ foreign key efficient
-- for future content retirement/correction at scale (staging-only).
-- No MCQs, attempts, answers, notes, or grading records are changed.
CREATE INDEX IF NOT EXISTS sjn_mistake_annotations_mcq_idx
 ON public.sjn_mistake_annotations(mcq_id);