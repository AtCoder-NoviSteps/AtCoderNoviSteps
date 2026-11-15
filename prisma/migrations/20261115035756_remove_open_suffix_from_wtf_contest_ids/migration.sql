-- The World Tour Finals main contests accept submissions, so link to them instead of the -open mirrors (#4352).
-- task_id is shared between the two contests, so answers, votes and workbooks are unaffected.
UPDATE "task" SET "contest_id" = 'wtf19' WHERE "contest_id" = 'wtf19-open';
UPDATE "task" SET "contest_id" = 'wtf22-day1' WHERE "contest_id" = 'wtf22-day1-open';
UPDATE "task" SET "contest_id" = 'awtf2024' WHERE "contest_id" = 'awtf2024-open';
UPDATE "task" SET "contest_id" = 'awtf2025algo' WHERE "contest_id" = 'awtf2025algo-open';
