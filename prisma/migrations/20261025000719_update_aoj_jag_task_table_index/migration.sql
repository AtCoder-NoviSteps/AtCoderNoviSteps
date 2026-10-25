-- Replace the AOJ problem id in task_table_index with the problem letter (A, B, C...)
-- for the JAG training camps (Summer / Winter / Spring) and JAG Regional, and strip the
-- legacy "<problem id>. " prefix from the training camp titles.
-- ICPC and JAG Prelim were converted in 20261024033928_update_aoj_task_table_index.
-- Each step checks its row count and raises, rolling back the whole migration, when the
-- count is unexpected: 0 for an empty database (prisma migrate reset), the training camps
-- only for a seeded database, and the camps plus all 16 JAG Regional contests elsewhere.
DO $$
DECLARE
  updated_count integer;
BEGIN
  -- (1) Basic rule: letters follow ascending problem id within each contest.
  WITH letters AS (
    SELECT task_id,
           chr(64 + row_number() OVER (
             PARTITION BY contest_id
             ORDER BY task_id::int
           )::int) AS letter
    FROM "task"
    WHERE contest_type = 'AOJ_JAG'
      AND contest_id ~ '^JAG(Summer|Winter|Spring|Regional)'
      -- Rows that already hold a letter (added later with letters) are left as they are.
      AND task_table_index = task_id
  )
  UPDATE "task" AS t
  SET "task_table_index" = letters.letter
  FROM letters
  WHERE t."task_id" = letters.task_id
    -- Redundant with the CTE filter, but keeps the blast radius fixed.
    AND t."contest_type" = 'AOJ_JAG'
    AND t."contest_id" ~ '^JAG(Summer|Winter|Spring|Regional)';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count NOT IN (0, 467, 625) THEN
    RAISE EXCEPTION 'basic rule: updated % rows, expected 0, 467 or 625. Import every JAG Regional contest from the admin page, or none, before migrating.', updated_count;
  END IF;

  -- (2) Contests with problems missing from AOJ: the basic rule shifts their letters, so every
  -- row takes its letter from the maintainer's problem list instead.
  UPDATE "task" AS t
  SET "task_table_index" = fixes.letter
  FROM (VALUES
    ('JAGRegional2005', '2024', 'A'),
    ('JAGRegional2005', '2025', 'B'),
    ('JAGRegional2005', '2026', 'D'),
    ('JAGRegional2005', '2027', 'E'),
    ('JAGRegional2005', '2028', 'G'),
    ('JAGRegional2005', '2029', 'I'),
    ('JAGRegional2013', '2568', 'D'),
    ('JAGRegional2013', '2569', 'E'),
    ('JAGRegional2013', '2570', 'F'),
    ('JAGRegional2013', '2571', 'G'),
    ('JAGRegional2013', '2572', 'H'),
    ('JAGRegional2013', '2573', 'I'),
    ('JAGRegional2013', '2574', 'J'),
    ('JAGSummer2006-day1', '2057', 'B'),
    ('JAGSummer2006-day3', '2067', 'B'),
    ('JAGSummer2006-day3', '2068', 'C'),
    ('JAGSummer2006-day3', '2069', 'D'),
    ('JAGSummer2006-day3', '2070', 'E'),
    ('JAGSummer2006-day3', '2071', 'F'),
    ('JAGSummer2006-day3', '2072', 'G'),
    ('JAGSummer2024-day3', '3637', 'A'),
    ('JAGSummer2024-day3', '3638', 'B'),
    ('JAGSummer2024-day3', '3639', 'C'),
    ('JAGSummer2024-day3', '3640', 'D'),
    ('JAGSummer2024-day3', '3641', 'E'),
    ('JAGSummer2024-day3', '3642', 'F'),
    ('JAGSummer2024-day3', '3644', 'H'),
    ('JAGSummer2024-day3', '3645', 'I'),
    ('JAGSummer2024-day3', '3646', 'J'),
    ('JAGSummer2024-day3', '3647', 'K'),
    ('JAGWinter2006-day2', '2073', 'D'),
    ('JAGWinter2006-day2', '2074', 'F'),
    ('JAGWinter2006-day3', '2075', 'A'),
    ('JAGWinter2006-day3', '2076', 'D'),
    ('JAGWinter2006-day3', '2077', 'G'),
    ('JAGWinter2006-day3', '2078', 'H'),
    ('JAGWinter2007-day3', '2122', 'A'),
    ('JAGWinter2007-day3', '2123', 'B'),
    ('JAGWinter2007-day3', '2124', 'C'),
    ('JAGWinter2007-day3', '2125', 'D'),
    ('JAGWinter2007-day3', '2126', 'F'),
    ('JAGWinter2007-day3', '2127', 'G'),
    ('JAGWinter2007-day3', '2128', 'H'),
    ('JAGWinter2007-day3', '2129', 'I'),
    ('JAGWinter2007-day3', '2130', 'J')
  ) AS fixes (contest_id, task_id, letter)
  WHERE t."task_id" = fixes.task_id
    AND t."contest_id" = fixes.contest_id
    AND t."contest_type" = 'AOJ_JAG';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count NOT IN (0, 32, 45) THEN
    RAISE EXCEPTION 'letter overrides: updated % rows, expected 0, 32 or 45', updated_count;
  END IF;

  -- (3) Strip the legacy "<problem id>. " prefix from the training camp titles.
  UPDATE "task"
  SET "title" = substr("title", length("task_id") + 3)
  WHERE "contest_type" = 'AOJ_JAG'
    AND "contest_id" ~ '^JAG(Summer|Winter|Spring|Regional)'
    AND starts_with("title", "task_id" || '. ');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count NOT IN (0, 467) THEN
    RAISE EXCEPTION 'titles: updated % rows, expected 0 or 467', updated_count;
  END IF;
END $$;
