-- jsc2026advance-final reuses the ABC 474 problems (#4352), so it is shown through contest task pairs.
-- Rows that already exist are left untouched.
INSERT INTO "contesttaskpair" ("id", "contestId", "taskTableIndex", "taskId", "createdAt", "updatedAt")
VALUES
  (CAST(gen_random_uuid() AS TEXT), 'jsc2026advance-final', 'G', 'abc474_g', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'jsc2026advance-final', 'F', 'abc474_f', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'jsc2026advance-final', 'E', 'abc474_e', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'jsc2026advance-final', 'D', 'abc474_d', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'jsc2026advance-final', 'C', 'abc474_c', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'jsc2026advance-final', 'B', 'abc474_b', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'jsc2026advance-final', 'A', 'abc474_a', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("contestId", "taskId") DO NOTHING;
