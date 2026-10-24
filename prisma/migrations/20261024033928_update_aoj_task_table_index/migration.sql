-- Replace the AOJ problem id in task_table_index with the problem letter (A, B, C...)
-- for ICPC Prelim / ICPC Regional / JAG Prelim.
-- Basic rule: letters follow ascending problem id within each contest.
-- JAG training camps (also AOJ_JAG) are out of scope and excluded by contest_id.

-- (1) Build a task_id -> problem letter lookup table.
WITH letters AS (
  SELECT task_id,
         chr(64 + row_number() OVER (
           PARTITION BY contest_id      -- Restart numbering for each contest.
           ORDER BY task_id::int        -- AOJ problem ids are numeric.
         )::int) AS letter
  FROM "task"
  WHERE contest_type = 'AOJ_ICPC'
     -- AOJ_JAG also covers training camps, so narrow it by contest_id.
     OR (contest_type = 'AOJ_JAG' AND contest_id LIKE 'JAGPrelim%')
)
-- (2) Apply the lookup table to the task rows.
UPDATE "task" AS t
SET "task_table_index" = letters.letter
FROM letters
WHERE t."task_id" = letters.task_id
  -- Redundant with the CTE filter, but keeps the blast radius fixed.
  AND (
    t."contest_type" = 'AOJ_ICPC'
    OR (t."contest_type" = 'AOJ_JAG' AND t."contest_id" LIKE 'JAGPrelim%')
  );

-- Align the AOJ-KUPC2011 title with the plain AOJ title format.
UPDATE "task"
SET "title" = 'Mountain'
WHERE "task_id" = '2279'
  AND "title" = 'I. Mountain';
