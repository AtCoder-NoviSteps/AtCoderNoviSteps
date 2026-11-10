# 日本最強プログラマー学生選手権のコンテスト別テーブル（#4316）

## 結論

「AtCoder 日本大会」と「競プロ典型 90 問」の間に「日本最強プログラマー学生選手権」ボタンを足し、15 コンテストをコンテストごとのテーブルで並べた。順番はメンテナのスプレッドシートどおりで、jsc2025advance-final だけはメンテナの指定で ARC 222 の下に置いた。

| contest_id                                                                     | ContestType                                                        |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| jsc2026-final / jsc2024-final / jsc2023-final / jsc2022-final-open / jsc2021ex | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE                              |
| jsc2025-final / jsc2019-final                                                  | OTHERS → ATCODER_MAIN_OFFICIAL_ONSITE（既存行は migration で更新） |
| arc222 / arc201 / arc180                                                       | ARC（変更なし）                                                    |
| abc313 / abc262                                                                | ABC（変更なし）                                                    |
| jsc2025advance-final / jsc2021                                                 | ABC_LIKE（変更なし）                                               |
| jsc2019-qual                                                                   | ARC_LIKE（変更なし）                                               |

## 決定事項

- **既存の `AtCoderChampionshipProvider` と明示的な配列を使う**（日本大会・世界大会と同じ）。決勝と予選が交互に並び、予選が ABC / ARC / ABC_LIKE / ARC_LIKE にまたがるので、contest_id から順番を導けない。却下: JSC 専用の Provider（ほぼ同じクラスが 2 つになる）。
- **`AtCoderChampionshipProvider` の `getHeaderIdsForTask` の上書きを消した**（メンテナが推した）。ABC が初めてエントリに入り、上書きのままでは見出し ID が `Ex`、セルのキーが `H/Ex` になって Ex のセルが空になり、Ex が E と F の間に並んだ。基底クラスはセルのキーと同じ `getTaskTableHeaderName` を通す。却下: 上書きの中で `getTaskTableHeaderName` を通す（同じ処理を 2 か所に持つ）、`generateTable` を上書きして生の記号をキーにする（並び順が直らず、ABC 212〜318 と扱いが分かれる）。
- **見出しはエントリに直書きし、予選は「-予選-（ARC 222）」と詰める**（メンテナが選択）。jsc2025advance-final は `prefixes.ts` の値を使う。
- **jsc2021ex は ContestTaskPair だけにし、ONSITE に分類する**（メンテナが選択、nikkei2019-ex と同じ）。`classifyContest` が `null` だとペアは捨てられる。却下: `contest_id = jsc2021ex` の Task（`task_id` は一意なので ABC 側から消える）、ABC_LIKE（「ABC-Like」に 12 列の行が出る）。
- **ペアが指す ABC の 11 問を、元の ABC の行として seed に足した**（メンテナが選択）。seed は Task の無いペアを、警告を出して飛ばす。
- **既存行の再分類は Prisma のデータ migration で行う**（#4315 と同じ）。
- **予選は既存のテーブルにも残す**（ARC 104 〜 / ABC 212 〜 318 / ABC-Like / ARC-Like。#4315 と同じ）。
- **命名は `JapaneseStudentChampionship`**（AtCoder の英語のコンテスト名）。却下: `Jsc`（略語）、`AtCoderJapaneseStudentChampionship`（公式名に AtCoder が付かない）。

## コードと履歴から分からない事実

- **データの出典**: メンテナが貼った AtCoder Problems の 101 行。AtCoder Problems の contest_id は最後に出題されたコンテストなので、abc313_a〜f / abc262_a〜f（`adt_*`）と jsc2021ex の 12 問は、ID（`abcxxx_y`）から本来の contest_id と記号を復元した（ABC 212〜318 の `_h` は `Ex`）。seed にあった 23 行とは全項目一致し、残りの 78 行を足した。
- **本番 DB**（2026-11-10 にメンテナが Supabase で確認）: jsc2019-final 8 行・jsc2025-final 6 行が OTHERS。arc222 / arc201 / arc180 は 6 行ずつ、jsc2021 / jsc2019-qual はあり、jsc2026 / 2024 / 2023 / 2022 の決勝は無し。`contesttaskpair` は jsc2025advance-final の 7 件だけ。ABC は 483 まで入っている。
- **migration の検証**: ローカルで seed の後に対象の 14 行を OTHERS に戻し、`migrate dev` で 14 行だけが変わった（OTHERS 123 → 109、ONSITE 99 → 113）。
- **テストの検出力**: エントリを 1 件消す、2 件の順を入れ替える、ペアが指す ABC の Task を消す、ペアを消す、ペアの記号を入れ替える、のいずれでも足したテストが落ちた。Provider を直す前は、ABC 313 のケースが見出し `A B C D E Ex F G` で落ちた。
- **検証**: `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit`（3092 件）/ `git diff --check` が通った。
- **Codex のクロスレビュー**: 指摘は Minor 1 件（jsc2021ex の記号と問題の対応をテストしていない）で、メンテナの選択でテストを足した。バグ・migration・過剰な抽象化の指摘は無かった。
- **画面の表示は確認していない。**

## 残タスク（メンテナ）

main へのマージで、CI が migration を流す（14 行）。

1. デプロイの直後に、管理画面から jsc2026-final / jsc2024-final / jsc2023-final / jsc2022-final-open を取り込む。データの無い Provider は空の枠を描く。
2. `contest_task_pairs.ts` の jsc2021ex の 12 件を、Supabase の CSV 取り込みで `contesttaskpair` に入れる（[how-to-add-contest-task-pairs.md](../../../guides/how-to-add-contest-task-pairs.md)）。表示への反映は、キャッシュが切れるまで最大 1 時間かかる。
