-- jsc2019-final and jsc2025-final move from ATCODER_OTHERS to ATCODER_MAIN_OFFICIAL_ONSITE in the contest classification (#4316).
-- Rows imported before the change keep OTHERS, so align them; other contests are untouched.
UPDATE "task"
SET "contest_type" = 'ATCODER_MAIN_OFFICIAL_ONSITE'
WHERE "contest_id" IN ('jsc2019-final', 'jsc2025-final')
  AND "contest_type" = 'OTHERS';
