-- CodeQUEEN 2024-2026 finals (#4317): AtCoder Problems lists some of their problems under adt_* contests,
-- so the admin import cannot register them under the finals. Rows that already exist are left untouched.
INSERT INTO "task" (id, contest_type, contest_id, task_id, task_table_index, title, created_at, updated_at)
VALUES
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2026-final-Public', 'codequeen2026_h', 'H', 'H. 迷子の森', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2026-final-Public', 'codequeen2026_g', 'G', 'G. きみの愛馬は？', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2026-final-Public', 'codequeen2026_f', 'F', 'F. ピアノの練習', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2026-final-Public', 'codequeen2026_e', 'E', 'E. 絶品のバイオリン', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2026-final-Public', 'codequeen2026_d', 'D', 'D. ぶどうの教室', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2026-final-Public', 'codequeen2026_c', 'C', 'C. 王冠づくり', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2026-final-Public', 'codequeen2026_b', 'B', 'B. バレエの練習', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2026-final-Public', 'codequeen2026_a', 'A', 'A. ドレス選び', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2025-final-Public', 'codequeen2025_final_h', 'H', 'H. ライブ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2025-final-Public', 'codequeen2025_final_g', 'G', 'G. 全国ツアー', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2025-final-Public', 'codequeen2025_final_f', 'F', 'F. アクリルスタンド', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2025-final-Public', 'codequeen2025_final_e', 'E', 'E. ブレスレット', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2025-final-Public', 'codequeen2025_final_d', 'D', 'D. 特訓', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2025-final-Public', 'codequeen2025_final_c', 'C', 'C. 整理券', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2025-final-Public', 'codequeen2025_final_b', 'B', 'B. カップリング選抜', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2025-final-Public', 'codequeen2025_final_a', 'A', 'A. ファンレター', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2024-final-N9tn8QqD', 'codequeen2024_final_h', 'H', 'H. Good bye, AtCoder Land.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2024-final-N9tn8QqD', 'codequeen2024_final_g', 'G', 'G. Quintuple Scoop Ice Cream', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2024-final-N9tn8QqD', 'codequeen2024_final_f', 'F', 'F. Divide the Cake', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2024-final-N9tn8QqD', 'codequeen2024_final_e', 'E', 'E. AtCoder Hotel', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2024-final-N9tn8QqD', 'codequeen2024_final_d', 'D', 'D. Attend Many Events', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2024-final-N9tn8QqD', 'codequeen2024_final_c', 'C', 'C. Attraction on Rainy Day', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2024-final-N9tn8QqD', 'codequeen2024_final_b', 'B', 'B. Decode Time Signal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2024-final-N9tn8QqD', 'codequeen2024_final_a', 'A', 'A. Welcome to AtCoder Land 2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (task_id) DO NOTHING;
