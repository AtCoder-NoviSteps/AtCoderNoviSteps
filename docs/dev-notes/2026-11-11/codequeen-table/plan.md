# CodeQUEEN のコンテスト別テーブル（#4317）

## 概要

「日本最強プログラマー学生選手権」と「競プロ典型 90 問」の間に「CodeQUEEN」ボタンを足し、次の 8 コンテストをコンテストごとのテーブル（日本最強プログラマー学生選手権と同じレイアウト）で上から順に並べる。順番と見出しはメンテナのスプレッドシートどおり。

| #   | contest_id                   | 見出し                         | ContestType（現在 → 変更後）          | seed（現在 → 変更後） |
| --- | ---------------------------- | ------------------------------ | ------------------------------------- | --------------------- |
| 1   | codequeen2026-final-Public   | CodeQUEEN 2026 決勝            | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE | 無し → 8 問（A〜H）   |
| 2   | abc462                       | CodeQUEEN 2026 予選（ABC 462） | ABC（変更なし）                       | 無し → 7 問（A〜G）   |
| 3   | codequeen2025-final-Public   | CodeQUEEN 2025 決勝            | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE | 無し → 8 問（A〜H）   |
| 4   | abc410                       | CodeQUEEN 2025 予選（ABC 410） | ABC（変更なし）                       | 無し → 7 問（A〜G）   |
| 5   | codequeen2024-final-N9tn8QqD | CodeQUEEN 2024 決勝            | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE | 無し → 8 問（A〜H）   |
| 6   | abc358                       | CodeQUEEN 2024 予選（ABC 358） | ABC（変更なし）                       | 1 問 → 7 問（A〜G）   |
| 7   | codequeen2023-final-open     | CodeQUEEN 2023 決勝            | ONSITE（変更なし）                    | 6 問（一致）          |
| 8   | abc308                       | CodeQUEEN 2023 予選（ABC 308） | ABC（変更なし）                       | 8 問（一致、H は Ex） |

- 問題データはメンテナが貼った AtCoder Problems の 59 行。AtCoder Problems の contest_id は最後に出題されたコンテストなので、`adt_*` に載っている行は ID から本来の contest_id と記号を復元し、title を `{記号}. {name}` に組み直した。
  - ABC の問題（`abcNNN_x`）は ABC の行として登録する（メンテナの指示）。abc308_h は ABC 212〜318 なので `Ex`。
  - 決勝の問題（2024 A〜F、2025 A / B / D / E）も ADT で再出題されて `adt_*` に載っているが、ABC ではなく決勝の問題なので、決勝の contest_id に戻す（メンテナ）。
  - 決勝の contest_id は AtCoder Problems に載っている値をそのまま使う（2024 は `codequeen2024-final-N9tn8QqD`、メンテナが確認）。2026 の ID は `codequeen2026_a` の形（`_final` 無し）で、貼られたとおりに使う。
- seed にある 15 行（codequeen2023-final-open の 6 行、abc308 の 8 行、abc358_c）は、seed と全項目一致した（貼られた codequeen2023_final_f の name 末尾のタブは落とした）。
- seed に足すのは残りの 44 行で、[tasks.json](./tasks.json) に `tasks.ts` の形で置いた。

### 本番の状態（2026-11-11 にメンテナが Supabase で確認）

| 対象                     | 本番の行                                                     |
| ------------------------ | ------------------------------------------------------------ |
| codequeen2023-final-open | ATCODER_MAIN_OFFICIAL_ONSITE で 6 行（A〜F）                 |
| 2024〜2026 の決勝        | 無し（分類が `null` だったので、取り込みで skip されていた） |
| ABC                      | 483 まで入っている（#4316 でメンテナが確認）                 |

## 設計判断

- **既存の `AtCoderChampionshipProvider` とエントリの配列を使う**（日本大会・世界大会・学生選手権と同じ形）。決勝と ABC の予選が交互に並ぶので、contest_id から並び順を導けない。
- **見出しはエントリに直書きする**。予選はスプレッドシートどおり「CodeQUEEN 2026 予選（ABC 462）」と書く。
- **分類は `ATCODER_MAIN_OFFICIAL_ONSITE`（完全一致）の辞書に 3 件を足すだけ**。ラベルは既存の `CodeQUEEN 2023 決勝` に揃える。ContestType は追加しないので、enum と優先度は変わらない。
  - 前方一致の `ATCODER_OTHERS` などに `codequeen` で始まるキーは無い（`code-festival-*` などは `code-` で始まる）。classification のテストで確かめる。
- **本番の 2024〜2026 決勝 24 行は、Prisma のデータ migration で INSERT する**（メンテナが選択、前例は `normalize_pck_problem_numbers`）。
  - 管理画面の取り込みは AtCoder Problems の contest_id ごとに問題を集め、記号もそのまま使う。`adt_*` に載っている 10 行（2024 A〜F、2025 A / B / D / E）は決勝として取り込めない。
  - 残りの 14 行も同じ migration に入れ、本番の手順を 1 つにする。`ON CONFLICT (task_id) DO NOTHING` にするので、seed で先に入った行がある開発環境でも何も変えない。
  - `id` は前例と同じく `gen_random_uuid()`。`id` から何かを引く処理は無い。`updated_at` は DB に既定値が無いので明示する。
- **H 列**: 決勝は ONSITE なので H のまま、abc308 の Ex は #4316 で基底クラスに寄せた処理で `H/Ex` になる。Provider は変えない。
- **重複表示**: ABC 462 / 410 / 358 は「ABC 319 〜」、ABC 308 は「ABC 212 〜 318」にも残す（#4315 / #4316 と同じ）。
- **命名は `CodeQueen`**（`CODE_QUEEN_ENTRIES`、preset `CodeQueen`、キー `codeQueen`、ファイル `code_queen_entries.ts`）。表示名は公式の「CodeQUEEN」。

## 却下した案

- **CodeQUEEN 専用の Provider**: ほぼ同じクラスが 2 つになる（#4314 / #4316 と同じ理由）。
- **決勝の見出しを `getContestNameLabel` から作る**: 予選の見出しは結局直書きなので、1 つの配列の中で書き方が分かれる。
- **貼られた行をそのまま seed に入れる**: `adt_*` の contest_id と記号（例: codequeen2024_final_a が `B`）になり、ABC と決勝のどちらのテーブルにも出ない。
- **migration は 10 行だけにし、14 行は管理画面から取り込む**: 本番の手順が 2 つに分かれる。
- **Supabase の CSV で取り込む**: 手作業になり、`id` / `contest_type` / `created_at` / `updated_at` も手で埋める必要がある。
- **識別子を `CodeQUEEN` にする**: キャメルケースの `codeQUEEN` が読みにくい。

## 主要な型と関数

```typescript
// src/features/tasks/utils/contest-table/code_queen_entries.ts
export const CODE_QUEEN_ENTRIES: Readonly<AtCoderChampionshipEntries>; // 8 entries, table order above

// src/features/tasks/utils/contest-table/contest_table_provider_groups.ts
CodeQueen: () => ContestTableProviderGroup; // group name / buttonLabel 'CodeQUEEN', ariaLabel 'Filter CodeQUEEN'
contestTableProviderGroups.codeQueen; // between japaneseStudentChampionship and typical90
```

コンポーネントの props / events と `AtCoderChampionshipProvider` は変えない。

## フェーズ（低リスク → 高リスク）

### Phase 1: 分類とラベル（`src/lib/contests/`）

- テスト先行: `fixtures/contest_type.ts` と `fixtures/contest_name_labels.ts` の `CodeQUEEN 2023 決勝` の後ろに、2024 / 2025 / 2026 の決勝を 1 件ずつ足す（期待値は `ATCODER_MAIN_OFFICIAL_ONSITE` と `CodeQUEEN 2024 決勝` など）。
- 実装: `utils/prefixes.ts` の `ATCODER_MAIN_OFFICIAL_ONSITE` に 3 件を足す。
- `pnpm test:unit src/lib/contests/` で RED → GREEN を確かめてコミットする。

### Phase 2: seed（`prisma/tasks.ts`）

- tasks.json の 44 行を、スクリプトで `tasks.ts` の形に書き出して差し込む。並びはコンテストの降順、問題は記号の降順（H → A）。
  - ABC: abc462 は ABC のブロックの先頭（abc422 の前）、abc410 は abc422 と abc408 の間、abc358 は既存の abc358_c の前後（G〜D を前、B・A を後ろ）。
  - 決勝: オンサイト決勝のブロックで、同じ年の既存の行（jsc2026-final / jsc2025-final / jsc2024-final）の後ろに置く。
- 件数とコンテストごとの記号をスクリプトで確かめてコミットする（tasks.json は Phase 4 で使うので残す）。

### Phase 3: エントリとグループ登録

- テスト先行:
  - `code_queen_entries.test.ts`（`atcoder_japan_championship_entries.test.ts` と同じ形）
    - `lists every codequeen contest in the seed exactly once`: seed の contest_id のうち `/^codequeen\d{4}/` に当たるもの。
    - `seeds every problem of each entry by its letter, matching the maintainer spreadsheet`: コンテストごとの記号の配列をリテラルで比べる（例: `abc308: ['A', …, 'G', 'Ex']`、`codequeen2023-final-open: ['A', …, 'F']`）。問題数に加えて、`adt_*` の記号のまま入れる誤りも拾う。
  - `contest_table_provider_groups.test.ts`
    - `CodeQueen registers one provider per contest in the spreadsheet order`: 8 個の provider key をリテラルで列挙する（`ATCODER_MAIN_OFFICIAL_ONSITE::codequeen2026-final-Public`、`ABC::abc462` など）。
    - 登録順のテストに `codeQueen` を足す（`japaneseStudentChampionship` の後、`typical90` の前）。テスト名も直す。
- 実装: エントリの配列、preset、`contestTableProviderGroups` への登録。
- テストを通してからコミットする。足したテストは、エントリを 1 件消す・2 件の順を入れ替える・seed の記号を `adt_*` のものに戻す、で落ちることを確かめる。

### Phase 4: データ migration（最もリスクが高い）

- `pnpm exec prisma migrate dev --create-only --name add_codequeen_final_tasks` で空の migration を作る。
- tasks.json の決勝 24 行から、次の形の SQL をスクリプトで書き出す（title の `'` は `''` にエスケープする）。

```sql
-- CodeQUEEN 2024-2026 finals (#4317): AtCoder Problems lists some of their problems under adt_* contests,
-- so the admin import cannot register them under the finals.
INSERT INTO "task" (id, contest_type, contest_id, task_id, task_table_index, title, created_at, updated_at)
VALUES
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2026-final-Public', 'codequeen2026_h', 'H', 'H. 迷子の森', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  -- ... 24 rows in total
  (CAST(gen_random_uuid() AS TEXT), 'ATCODER_MAIN_OFFICIAL_ONSITE', 'codequeen2024-final-N9tn8QqD', 'codequeen2024_final_a', 'A', 'A. Welcome to AtCoder Land 2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (task_id) DO NOTHING;
```

- ローカルで確かめる。
  - seed の後に 24 行を消して本番を再現し、`pnpm exec prisma migrate dev` で 24 行だけが入り、contest_id / contest_type / task_table_index / title が seed と一致すること。
  - seed の行が残っている DB では、migration が 1 行も変えないこと。
- tasks.json を消してコミットする。

### Phase 5: ドキュメント

- `docs/guides/how-to-add-contest-table-provider.md`: 明示的な配列の節の見出しと本文、リファレンステーブルに CodeQUEEN を足し、最終更新日を変える。

## 検証とレビュー

- `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit` / `git diff --check`
- 余裕があれば、`pnpm db:seed` の後に `pnpm dev` で CodeQUEEN ボタンと 8 個のテーブルの表示を見る。
- Phase 4 の migration（データ変換）があるので、Codex のクロスレビューが要る。

## 本番で行うこと（メンテナ）

main へのマージで、CI が migration を流す（24 行が入る）。管理画面からの取り込みは要らない。
