# AOJ コースへの DSL・CGL・NTL 追加 (Issue #3223)

[Issue #3223](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3223) で、AOJ の DSL (18問)・CGL (25問)・NTL (11問) を追加。`AOJ_COURSES` に3件追記するだけで、アーキテクチャ上の変更は不要。`AOJ_COURSES` を参照する関数はデータ駆動のため変更不要。

## 注意事項

AOJ の `/problems?size=N` は存在しない問題を返すことがある。現在の `id` 生成ロジックは `sha256(contest_id + task.title)` のため、タイトル重複時に `Task.id` 一意制約違反 (P2002) が発生する（CGL で確認）。根本対処は `task.id`（API のユニーク識別子）を使うこと。暫定対処として存在する問題のみインポート。
