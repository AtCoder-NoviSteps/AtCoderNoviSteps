-- nikkei2019-final moves from ATCODER_OTHERS to ATCODER_MAIN_OFFICIAL_ONSITE in the contest classification (#4315).
-- Rows imported before the change keep OTHERS, so align them; other contests are untouched.
UPDATE "task"
SET "contest_type" = 'ATCODER_MAIN_OFFICIAL_ONSITE'
WHERE "contest_id" = 'nikkei2019-final'
  AND "contest_type" = 'OTHERS';
