# CodeQUEEN のコンテスト別テーブル（#4317）

## 結論

「日本最強プログラマー学生選手権」と「競プロ典型 90 問」の間に「CodeQUEEN」ボタンを足し、8 コンテストをコンテストごとのテーブルで並べた。順番と見出しはメンテナのスプレッドシートどおり。

| contest_id                                                                             | ContestType                           | seed / 本番                                    |
| -------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------- |
| codequeen2026-final-Public / codequeen2025-final-Public / codequeen2024-final-N9tn8QqD | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE | 8 問ずつ追加。本番へは migration で 24 行      |
| codequeen2023-final-open                                                               | ONSITE（変更なし）                    | 変更なし                                       |
| abc462 / abc410 / abc358 / abc308                                                      | ABC（変更なし）                       | seed に 20 行追加（abc308 は既存）。本番は既存 |

## 決定事項

- **既存の `AtCoderChampionshipProvider` とエントリの配列を使う**（日本大会・世界大会・学生選手権と同じ）。決勝と ABC の予選が交互に並ぶので、contest_id から順番を導けない。却下: CodeQUEEN 専用の Provider（ほぼ同じクラスが 2 つになる）。
- **見出しはエントリに直書きする**（例: 「CodeQUEEN 2026 予選（ABC 462）」）。却下: 決勝だけ `getContestNameLabel` から作る（1 つの配列の中で書き方が分かれる）。
- **ADT で再出題された問題は、task_id から本来の contest_id と記号に戻して seed に入れる**。ABC の問題は ABC の行、決勝の問題（2024 A〜F、2025 A / B / D / E）は決勝の行にする（メンテナの指示）。却下: 貼られた行をそのまま入れる（`adt_*` の contest_id と ADT の記号になり、どのテーブルにも出ない）。
- **本番の 2024〜2026 決勝 24 行は、データ migration（`add_codequeen_final_tasks`）で INSERT する**（メンテナが選択）。管理画面の取り込みは AtCoder Problems の contest_id ごとなので、`adt_*` に載る 10 行は決勝として取り込めない。`ON CONFLICT (task_id) DO NOTHING` で、既存の行は変えない。却下: 10 行だけ migration にして 14 行は管理画面から取り込む（本番の手順が 2 つになる）、Supabase の CSV（手作業で `id` や `contest_type` も埋める）、upsert（本番に直す行が無い）。
- **予選は「ABC 319 〜」「ABC 212 〜 318」にも残す**（#4315 / #4316 と同じ）。
- **命名は `CodeQueen`**（`CODE_QUEEN_ENTRIES`、`code_queen_entries.ts`）。表示名は公式の「CodeQUEEN」。却下: 識別子を `CodeQUEEN` にする（キャメルケースの `codeQUEEN` が読みにくい）。
- **ガイドの「明示的な配列」の節は、4 グループで共通の決まりを箇条書き 1 つにまとめ、違う点だけを表にした**（メンテナの指示）。

## コードと履歴から分からない事実

- **データの出典**: メンテナが貼った AtCoder Problems の 59 行。seed にあった 15 行（2023 決勝 6 行、abc308 8 行、abc358_c）は全項目一致した（貼られた codequeen2023_final_f の name 末尾のタブは落とした）。2024 決勝の contest_id `codequeen2024-final-N9tn8QqD` はメンテナが確認した。atcoder.jp には繋がらないので、問題の URL は開いていない。
- **本番 DB**（2026-11-11 にメンテナが Supabase で確認）: `task_id LIKE 'codequeen%'` は 2023 決勝の 6 行だけ。ABC は 483 まで入っている（#4316 で確認）。
- **migration の検証**: ローカル DB も 2023 決勝の 6 行だけの状態で `migrate dev` を流し、24 行だけが入った（4158 → 4182）。contest_id / contest_type / 記号 / title / grade は seed と一致した。続けて seed を流すと ABC の 20 行だけが入り、migration の SQL を流し直しても 30 行の id・値・`updated_at` は変わらなかった。
- **テストの検出力**: エントリを 1 件消す、2 件の順を入れ替える、codequeen2024_final_a を ADT の記号 `B` に戻す、abc410_a を ADT の contest_id に戻す、のいずれでも足したテストが落ちた。
- **検証**: `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit`（3101 件）/ `git diff --check` が通った。
- **Codex のクロスレビュー**: Critical / Major は無し。Minor 2 件のうち、ガイドがテストの検出範囲を言い過ぎていた点はメンテナの選択で直した。同じコンテストの中で task_id と記号を入れ替えても `code_queen_entries.test.ts` は落ちない点は、メンテナの選択で直していない（seed はスクリプトで作り全件照合済みで、ADT の記号のまま入れる誤りは記号の重複か `I` で落ちる）。
- **画面の表示は確認していない。**

## 残タスク（メンテナ）

main へのマージで、CI が migration を流す（24 行が入る）。管理画面からの取り込みは要らない。
