# bogosort / みんなのプロコン 2019 の問題追加（#4158）

[#4158](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/4158) で 3 コンテスト・計 34 問を追加した。手順は [#4143](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/4143) を踏襲し、bogosort のために大学コンテストのラベル生成を拡張した。

## 決定事項

| contest_id              | ContestType  | 表示名                                | 決めた人・根拠                     |
| ----------------------- | ------------ | ------------------------------------- | ---------------------------------- |
| `yahoo-procon2019-qual` | `ARC_LIKE`   | みんなのプロコン 2019                 | Issue の指定                       |
| `bogosortcontest_div1`  | `UNIVERSITY` | bogosort Programming Contest (Div. 1) | ユーザー判断（NoviSteps での扱い） |
| `bogosortcontest_div2`  | `UNIVERSITY` | bogosort Programming Contest (Div. 2) | ユーザー判断（NoviSteps での扱い） |

- `yahoo-procon2019-final` はスコープ外（YAGNI）。
- yahoo の表示は `YAHOO-PROCON2019-QUAL` のまま。`ARC_LIKE` にはラベル生成関数がなく、既存の ARC-Like と同じ扱いにした（#4143 と同じ判断）。
- `getAtCoderUniversityContestLabel('ttpc')` / `('tupc')` の戻り値が `null` から `'TTPC'` / `'TUPC'` に変わる。辞書フォールバックと既存テストが矛盾したため、ユーザーに確認して期待値を更新した。`getContestNameLabel` の結果は従来の大文字化と同じなので、画面表示は変わらない。

## 重複確認（2026-10-18 時点）

`prisma/tasks.ts` の既存 2,419 件と新規 34 件をスクリプトで突き合わせた。

- `task_id`：既存とも新規同士とも重複なし。
- hash id：管理画面のインポートは `Task.id = sha256(contest_id + task.id)` で採番する。連結前の文字列も含めて衝突なし。シードは fabbrica の自動採番なので hash は関係しない。
- `prisma/contest_task_pairs.ts` / `prisma/tasks_for_production.ts` に bogosort・yahoo への言及なし。
- 既存問題との同名なし。
- div1 と div2 に同名の問題が 3 組ある（`Go Robots`：div2_h / div1_d、`Consecutive Pairs`：div2_k / div1_l、`K-Independent Matrix`：div2_l / div1_e）。problems.json 上の `id` が別なので別の Task として登録した。`ContestTaskPair` は 1 つの問題 ID が複数コンテストに出る場合の仕組みなので使わない。
- 本番 DB は確認できていない。`task_id` は `@unique` なので、重複があっても DB 側で拒否される。

## 設計の根拠

- 分類ロジックは変更不要だった。`UNIVERSITY` はプレフィックス一致なので、`ATCODER_UNIVERSITIES` にキーを足すだけで分類できる。先に評価されるルールに新しい ID がマッチしないことも確認した。
- ラベルは修正が必要だった。大学コンテストの正規表現（`xxpc{年}`）に合わず、`BOGOSORTCONTEST_DIV1` と表示されてしまうため。正規表現に合わない ID は `ATCODER_UNIVERSITIES` を完全一致で引くフォールバックにした（`OTHERS` の `generateOthersLabel` と同じやり方）。
- `prisma/tasks.ts` には `UNIVERSITY` の問題のまとまりがなかったので、優先度順の既存の並びに合わせて `fps-24` の後に新しく置いた。両 Div は同時開催なので Div. 1 を先にした。

### 採用しなかった案

- `bogosortcontest` を 1 キーにして両 Div を拾う：ラベルで Div を区別できず、結局 ID ごとの対応表が必要になる。
- 大学コンテストの正規表現を広げる：bogosort は `xxpc{年}` の形ではなく、正規表現が不自然になる。
- ラベル専用の辞書を別に作る：表示名が 2 か所に重複する。`ATCODER_OTHERS` も 1 つの辞書で分類と表示名を兼ねている。
- bogosort を `OTHERS` や `ARC_LIKE` / `ABC_LIKE` に分類する：ユーザー判断で `UNIVERSITY` に決定。

## その他

- クロスレビューは対象外。手で編集したのは 5 ファイルで、認証・スキーマ・公開インターフェースの変更はない（`getAtCoderUniversityContestLabel` はシグネチャを変えていない）。
