# 日本最強プログラマー学生選手権のコンテスト別テーブル（#4316）

## 概要

「AtCoder 日本大会」と「競プロ典型 90 問」の間に「日本最強プログラマー学生選手権」ボタンを足し、次の 15 コンテストをコンテストごとのテーブル（AtCoder 日本大会と同じレイアウト）で上から順に並べる。順番はメンテナのスプレッドシートに、メンテナが指定した jsc2025advance-final（ARC 222 の下）を足したもの。

| #   | contest_id           | 見出し                                                 | ContestType（現在 → 変更後）          | seed                           |
| --- | -------------------- | ------------------------------------------------------ | ------------------------------------- | ------------------------------ |
| 1   | jsc2026-final        | 第七回日本最強プログラマー学生選手権 -決勝-            | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE | 無し → 7 問                    |
| 2   | arc222               | 第七回日本最強プログラマー学生選手権 -予選-（ARC 222） | ARC（変更なし）                       | 無し → 6 問                    |
| 3   | jsc2025advance-final | 日本最強プログラマー学生選手権～Advance～              | ABC_LIKE（変更なし）                  | pair 7 件（ABC 422）           |
| 4   | jsc2025-final        | 第六回日本最強プログラマー学生選手権 -決勝-            | OTHERS → ATCODER_MAIN_OFFICIAL_ONSITE | 無し → 6 問                    |
| 5   | arc201               | 第六回日本最強プログラマー学生選手権 -予選-（ARC 201） | ARC（変更なし）                       | 無し → 6 問                    |
| 6   | jsc2024-final        | 第五回日本最強プログラマー学生選手権 -決勝-            | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE | 無し → 6 問                    |
| 7   | arc180               | 第五回日本最強プログラマー学生選手権 -予選-（ARC 180） | ARC（変更なし）                       | 無し → 6 問                    |
| 8   | jsc2023-final        | 第四回日本最強プログラマー学生選手権 -決勝-            | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE | 無し → 7 問                    |
| 9   | abc313               | 第四回日本最強プログラマー学生選手権 -予選-（ABC 313） | ABC（変更なし）                       | 8 問（一致）                   |
| 10  | jsc2022-final-open   | 第三回日本最強プログラマー学生選手権 -決勝-            | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE | 無し → 7 問                    |
| 11  | abc262               | 第三回日本最強プログラマー学生選手権 -予選-（ABC 262） | ABC（変更なし）                       | 無し → 8 問                    |
| 12  | jsc2021ex            | 第二回日本最強プログラマー学生選手権 エキシビジョン    | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE | pair 無し → 12 件（pair のみ） |
| 13  | jsc2021              | 第二回日本最強プログラマー学生選手権（ABC-like）       | ABC_LIKE（変更なし）                  | 8 問（一致）                   |
| 14  | jsc2019-final        | 第一回日本最強プログラマー学生選手権決勝               | OTHERS → ATCODER_MAIN_OFFICIAL_ONSITE | 無し → 8 問                    |
| 15  | jsc2019-qual         | 第一回日本最強プログラマー学生選手権-予選-（ARC-like） | ARC_LIKE（変更なし）                  | 6 問（一致）                   |

- 問題データはメンテナが貼った AtCoder Problems の 101 行で、seed の形に直して 2 つのファイルに分けた。
  - [tasks.json](./tasks.json): `tasks.ts` の形の 101 行。ABC の問題は、ID（`abcxxx_y`）から本来の `contest_id` と記号を復元してある（ABC 212〜318 の `_h` は `Ex`）。
  - [contest_task_pairs.json](./contest_task_pairs.json): `contest_task_pairs.ts` の形の、jsc2021ex の 12 件（A = abc152_b 〜 L = abc167_d）。
- tasks.json のうち seed にある 23 行（abc313 / jsc2021 / jsc2019-qual / abc167_d）は、seed と全項目一致した。seed に足すのは残りの 78 行。
- jsc2021ex は ABC の 12 問を流用しただけなので、pair だけにする（`contest_id = jsc2021ex` の Task は作らない）。ペアが指す 12 問のうち abc167_d 以外の 11 問は seed に無く、seed は Task の無いペアを飛ばすので、ABC の問題として `tasks.ts` に足す（メンテナが選択）。
- 本番には ABC 483 まで入っている（メンテナ）ので、ABC の問題を足すのは seed だけ。

## 設計判断

- **既存の `AtCoderChampionshipProvider` とエントリの配列を使う**（日本大会・世界大会と同じ形）。決勝と予選が交互に並び、予選は ARC / ABC / ABC_LIKE / ARC_LIKE にまたがるので、contest_id から並び順を導けない。
- **見出しはエントリに直書きする**（日本大会と同じ）。ARC / ABC は `getContestNameLabel` が `ARC 222` を返し、ABC_LIKE / ARC_LIKE にはラベル生成が無い。予選の書き方は日本大会に揃えて「-予選-（ARC 222）」と詰める（メンテナが選択）。jsc2025advance-final は `prefixes.ts` の値をそのまま使う。
- **`AtCoderChampionshipProvider` の `getHeaderIdsForTask` の上書きを消し、基底クラスの実装を使う**（メンテナも上書きしない案を推した）。ABC が初めてエントリに入り、いまの上書きでは次の 2 つが起きる。
  - セルのキーは `generateTable` が `getTaskTableHeaderName` で `Ex` → `H/Ex` に変えるのに、見出し ID は `task_table_index` のまま `Ex` なので、`innerTaskTable[contestId]['Ex']` が引けず Ex のセルが空になる。
  - 数値比較の `localeCompare` で `A B C D E Ex F G` の順になる。
  - 基底クラスはセルのキーと同じ `getTaskTableHeaderName` を通してから並べるので、ABC 212〜318 のテーブルと同じく `A … G H/Ex` になる。既存の 16 エントリは記号が A〜H と C1 / C2 だけなので、見出しもセルのキーも変わらない（node で確かめた）。
- **jsc2021ex は `ATCODER_MAIN_OFFICIAL_ONSITE` に分類する**（メンテナが選択、nikkei2019-ex と同じ）。`classifyContest` が `null` だと `getMergedTasksMap()` がペアを捨てる。
- **分類**: `ATCODER_MAIN_OFFICIAL_ONSITE`（完全一致）に 7 件を足し、`ATCODER_OTHERS`（前方一致）から jsc2019-final / jsc2025-final を消す。ABC_LIKE / ARC_LIKE / ARC / ABC の回は変えない。ContestType は追加しないので、enum と優先度は変わらない。
- **既存行の再分類は Prisma のデータ migration で行う**（#4315 の nikkei2019-final と同じ）。本番には jsc2019-final が 8 行、jsc2025-final が 6 行、OTHERS のまま入っている（2026-11-10 にメンテナが Supabase で確認）。
- **重複表示**: ARC 222 / 201 / 180 は「ARC 104 〜」、ABC 313 / 262 は「ABC 212 〜 318」、jsc2021 / jsc2025advance-final は「ABC-Like」、jsc2019-qual は「ARC-Like」にも残す（#4315 でメンテナが選んだ扱いと同じ）。
- **命名は `JapaneseStudentChampionship`**。AtCoder の英語のコンテスト名（Japanese Student Championship 2021）に合わせた。

## 却下した案

- **上書きを残し、中で `getTaskTableHeaderName` を通す**: 基底クラスと同じ処理を 2 か所に持つことになる。
- **`generateTable` を上書きし、生の記号をセルのキーにする**: Ex が E と F の間に並ぶ問題が残り、ABC 212〜318 と扱いが分かれる。
- **JSC 専用の Provider やサブクラスを作る**: ほぼ同じクラスが 2 つになる（#4314 で却下した理由と同じ）。
- **jsc2021ex の 12 問を `contest_id = jsc2021ex` の Task として入れる**: `task_id` は一意なので、ABC 側のテーブルから消える。
- **jsc2021ex を ABC_LIKE にする**: 「ABC-Like」テーブルにも A〜L の 12 列の行が出る。
- **命名**: `Jsc` は略語（coding-style で禁止）。`AtCoderJapaneseStudentChampionship` は公式名に AtCoder が付かず、長い。

## 主要な型と関数

```typescript
// src/features/tasks/utils/contest-table/japanese_student_championship_entries.ts
export const JAPANESE_STUDENT_CHAMPIONSHIP_ENTRIES: Readonly<AtCoderChampionshipEntries>; // 15 entries, table order above

// src/features/tasks/utils/contest-table/atcoder_championship_provider.ts
export class AtCoderChampionshipProvider extends ContestTableProviderBase {
  // getHeaderIdsForTask override removed: the base class maps H / Ex to H/Ex, as generateTable does.
}

// src/features/tasks/utils/contest-table/contest_table_provider_groups.ts
JapaneseStudentChampionship: () => ContestTableProviderGroup; // '日本最強プログラマー学生選手権' / ariaLabel 'Filter Japanese Student Championship'
contestTableProviderGroups.japaneseStudentChampionship; // between atcoderJapanChampionship and typical90
```

コンポーネントの props / events は変えない。

## フェーズ（低リスク → 高リスク）

### Phase 1: 分類とラベル（`src/lib/contests/`）

- テスト先行: `fixtures/contest_type.ts` の jsc2019-final / jsc2025-final を `atCoderOthers` から `atCoderMainOfficialOnsite` へ移し、jsc2021ex / jsc2022-final-open / jsc2023-final / jsc2024-final / jsc2026-final を足す。`fixtures/contest_name_labels.ts` の `atCoderMainOfficialOnsite` に 7 件のラベルを足す。
- 実装: `utils/prefixes.ts` の 2 つの辞書を編集する。
- `pnpm test:unit src/lib/contests/` で RED → GREEN を確かめてコミットする。

### Phase 2: seed（`prisma/tasks.ts`、`prisma/contest_task_pairs.ts`）

- tasks.json のうち seed に無い 78 行を、スクリプトで `tasks.ts` の形に書き出す。決勝 6 件 41 行、ARC 3 件 18 行、abc262 8 行、jsc2021ex のペアが指す ABC 11 行。tasks.json は復元済みなので、値はそのまま使う。
- 既存の並び（コンテストの降順、問題は記号の降順）に差し込む。
  - ARC: arc222 は arc232 と arc209 の間、arc201 は arc207 と arc188 の間、arc180 は arc186 と arc120 の間。
  - ABC: abc262 は abc263 の後。abc188_b / abc180_d / abc174_b / abc167_b / abc152_b / abc150_d は既存のブロックに足し、abc182 / abc181 / abc162 / abc159 / abc155 はブロックごと降順の位置に足す。
  - 決勝: オンサイト決勝のブロック（awtf / ajo / codequeen / wtf / nikkei の並び）に年の降順で入れる。同じ年の中では既存の行の後ろに置く。
- `contest_task_pairs.ts` の jsc2025advance-final のブロックの隣に、contest_task_pairs.json の 12 件を記号の降順（L → A）で足す。
- 件数をスクリプトで確かめ、tasks.json と contest_task_pairs.json を消してコミットする。

### Phase 3: Provider の見出しとセルのキーを揃える

- テスト先行: `atcoder_championship_provider.test.ts` の `keys the cells of $name by the same letters as the header` に `an ABC qualifier with problem Ex`（abc313 の A〜G・Ex、期待値 `['A', …, 'G', 'H/Ex']`）を足す。いまの上書きでは、見出しが `A B C D E Ex F G` になって落ちる。
- 実装: `getHeaderIdsForTask` の上書きと使わなくなった import を消し、`contestType` のコメント（「ABC のエントリは無い」）とクラスの TSDoc（対象のグループ）を直す。
- `pnpm test:unit src/features/tasks/utils/contest-table/` で既存のテストも通ることを確かめてコミットする。

### Phase 4: エントリとグループ登録

- テスト先行:
  - `japanese_student_championship_entries.test.ts`
    - `lists every jsc contest in the seed exactly once`: `tasks` と `contest_task_pairs` の contest_id のうち `/^jsc\d{4}/` に当たるもの。jsc2021ex と jsc2025advance-final は pair にしか無いので、両方から集める。
    - `seeds every problem of each entry, matching the maintainer spreadsheet`: `tasks` と `contest_task_pairs` を合わせた問題数を、15 件のリテラルで比べる。
    - `seeds the original task of every contest task pair in the group`: jsc2021ex と jsc2025advance-final のペアが指す `problem_id` が、すべて `tasks` にある。ABC の問題を足し忘れると、seed は警告を出してペアを飛ばすだけなので、これで拾う。
  - `contest_table_provider_groups.test.ts`
    - `JapaneseStudentChampionship registers one provider per contest in the spreadsheet order`: 15 個の provider key をリテラルで列挙する（`ABC::abc313`、`ABC_LIKE::jsc2025advance-final` など）。
    - 登録順のテストに `japaneseStudentChampionship` を足す（`atcoderJapanChampionship` の後、`typical90` の前）。
- 実装: エントリの配列、preset、`contestTableProviderGroups` への登録。
- テストを通してからコミットする。足したテストは、seed・配列を一時的に壊すと落ちることを確かめる。

### Phase 5: データ migration（最もリスクが高い）

- `pnpm exec prisma migrate dev --create-only --name reclassify_jsc_finals_as_onsite` で空の migration を作り、次の SQL を書く。

```sql
-- jsc2019-final and jsc2025-final move from OTHERS to ATCODER_MAIN_OFFICIAL_ONSITE (#4316).
UPDATE "task"
SET "contest_type" = 'ATCODER_MAIN_OFFICIAL_ONSITE'
WHERE "contest_id" IN ('jsc2019-final', 'jsc2025-final')
  AND "contest_type" = 'OTHERS';
```

- ローカルでは seed の後に該当の 14 行を `OTHERS` に戻して本番を再現し、`migrate dev` を流して 14 行だけが変わることを確かめる。

### Phase 6: ドキュメント

- `docs/guides/how-to-add-contest-table-provider.md`: 「AtCoder 日本大会」「AtCoder 世界大会」の節に日本最強プログラマー学生選手権を足す。`contestType` は provider key にだけ効く、という説明を直す（ABC では H / Ex のセルのキーにも効く）。リファレンステーブルに行を足し、最終更新日を変える。
- `docs/guides/how-to-add-contest-task-pairs.md`: 例に `jsc2021ex` を足す。

## 検証とレビュー

- `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit` / `git diff --check`
- Phase 5 の migration（データ変換）があるので、Codex のクロスレビューが要る。

## 本番の状態（2026-11-10 にメンテナが Supabase で確認）

| 対象                                                               | 本番の行                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| arc222 / arc201 / arc180                                           | ARC で 6 行ずつ（取り込み不要）                              |
| jsc2025-final / jsc2019-final                                      | OTHERS で 6 行 / 8 行（Phase 5 で更新）                      |
| jsc2021 / jsc2019-qual                                             | ABC_LIKE で 8 行 / ARC_LIKE で 6 行                          |
| jsc2026-final / jsc2024-final / jsc2023-final / jsc2022-final-open | 無し（分類が `null` だったので、取り込みで skip されていた） |
| `contesttaskpair`                                                  | jsc2025advance-final の 7 件だけ。jsc2021ex は無し           |
| ABC                                                                | ABC 483 まで入っている                                       |

## 本番で行うこと（メンテナ）

1. main へのマージで、CI が migration を流す（14 行が ATCODER_MAIN_OFFICIAL_ONSITE になる）。
2. デプロイの直後に、管理画面から jsc2026-final / jsc2024-final / jsc2023-final / jsc2022-final-open を取り込む。データの無い Provider は空の枠を描く。
3. `contest_task_pairs.ts` に足した jsc2021ex の 12 件を、Supabase の CSV 取り込みで `contesttaskpair` に入れる（[how-to-add-contest-task-pairs.md](../../../guides/how-to-add-contest-task-pairs.md)）。jsc2021ex を管理画面から取り込む必要はない（問題はすべて ABC の行として本番にある）。表示への反映は、キャッシュが切れるまで最大 1 時間かかる。
