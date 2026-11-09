# AtCoder 世界大会のコンテスト別テーブル（#4314）

## 概要

「旧 ARC」と「AtCoder 日本大会」の間に「AtCoder 世界大会」ボタンを足し、World Tour Finals（Algorithm 部門）の 6 コンテストを、メンテナのスプレッドシート順にコンテストごとのテーブルで上から並べる。

| #   | contest_id        | 見出し（`getContestNameLabel`）  | seed         |
| --- | ----------------- | -------------------------------- | ------------ |
| 1   | awtf2026algo      | World Tour Finals 2026 Algorithm | 無し → 5 問  |
| 2   | awtf2025algo-open | World Tour Finals 2025 Algorithm | 5 問（一致） |
| 3   | awtf2024-open     | World Tour Finals 2024           | 5 問（一致） |
| 4   | wtf22-day2        | World Tour Finals 2022 Day2      | 5 問（一致） |
| 5   | wtf22-day1-open   | World Tour Finals 2022 Day1      | 5 問（一致） |
| 6   | wtf19-open        | World Tour Finals 2019           | 6 問（一致） |

- 問題データはメンテナが貼った AtCoder Problems の 31 行を [tasks.json](./tasks.json) に保存した。ID の重複なし、`title` = `{problem_index}. {name}`。既存の 26 行は seed と全項目一致し、seed に足すのは awtf2026algo の 5 行だけ。
- スプレッドシートでは「2022 Day2」が 2 つ並ぶが、下の方（Save the Monsters 〜 Sort A[i]-i）は Day1（`wtf22-day1-open`）。新しい順なので Day2 を Day1 の上に置く。
- wtf19 の記号は A, B, C1, C2, D, E。`sortHeaderIdsByTaskTableIndex` は数値を考慮して並べるので、この順になる。
- awtf2026algo の contest_id には `-open` が付かない（wtf22-day2 と同じ）。fixture は `awtf2026algo-open` という推測の ID なので、実際の ID に直す。分類は `stripOpenSuffix` でどちらも `ATCODER_MAIN_OFFICIAL_ONSITE` になる。

### 分類の確認結果

- コード: 6 件とも `isWorldTourFinals`（正規表現）で `ATCODER_MAIN_OFFICIAL_ONSITE`。`AGC_LIKE` にも `ATCODER_OTHERS` にも無い。スプレッドシートの「(AGC)」は分類に関係しない。
- ローカル DB: 6 件（と codequeen2023-final-open）とも `ATCODER_MAIN_OFFICIAL_ONSITE`。
- 本番 DB（2026-11-09 にメンテナが Supabase で確認）: 6 件とも `ATCODER_MAIN_OFFICIAL_ONSITE` で、5, 5, 5, 5, 5, 6 行（awtf2026algo も取り込み済み）。`awtf2024` は 2026-05-13 〜 07-08 の間 `OTHERS` に分類されていたが、その間に取り込まれた行は無かった。データ migration も、デプロイ後の取り込みも要らない。

## 設計判断

- **日本大会の Provider を `AtCoderChampionshipProvider` に改名して共用する**（メンテナが選択）。エントリ `{ contestId, contestType, title }` 1 件 = Provider 1 個という形がそのまま使える。エントリの型は 2 つの配列から使うので Provider のファイルへ移す。`JagRegionalProvider` は見出しの組み立て（ラベル + 注記）が違うので対象外。
- **見出しは `getContestNameLabel` から作る**。日本大会は ARC / ARC_LIKE のラベルが使えずエントリに直書きしたが、WTF は既存のラベル生成がスプレッドシートと同じ文字列を返す。「(AGC)」は付けない（メンテナが選択）。
- **並び順は contest_id の明示的な配列で持つ**。contest_id の形（`wtf19` / `wtf22-dayN` / `awtf2024` / `awtf20XXalgo`、`-open` の有無）がそろわず、6 件のために並び替えを組むより読みやすい。
- **ContestType と分類は変えない**。enum・優先度・`task.test.ts` は変わらない（スキルの Layer 1–2 と Layer 3 の実装を skip）。
- **seed との整合テストは `isWorldTourFinals` で拾う**。日本大会では ARC の予選を検出できなかったが、WTF は全件を判定できるので、来年 `awtf2027algo` を seed に足して配列に書き漏らすとテストが落ちる。
- **命名**: グループは `AtCoderWorldTourFinals`、ボタンは「AtCoder 世界大会」、ariaLabel は `Filter AtCoder World Tour Finals`。

## 却下した案

- **`PerContestProvider` など汎用名への改名**: メンテナが命名を却下。
- **世界大会専用の Provider を新設**: 日本大会と同じ 30 行ほどのクラスが 2 つになる。
- **日本大会の Provider を改名せずに使う**: クラス名と中身が合わなくなる。
- **見出しをエントリに直書き**: `getWorldTourFinalsLabel` と同じ文字列を二重に持つ。
- **グループ名 `AtCoderWorldChampionship`**（日本大会と対にする）: 6 件とも公式名が World Tour Finals で、既存の `isWorldTourFinals` とも合う。日本大会は Japan Open と全国統一プログラミング王決定戦をまとめるので Championship にした事情がある。

## 主要な型と関数

```typescript
// src/features/tasks/utils/contest-table/atcoder_championship_provider.ts
// (renamed from atcoder_japan_championship_provider.ts; body unchanged)
export type AtCoderChampionshipEntry = {
  contestId: string;
  contestType: ContestType; // provider key only, e.g. ARC::arc232
  title: string;
};
export type AtCoderChampionshipEntries = AtCoderChampionshipEntry[];
export class AtCoderChampionshipProvider extends ContestTableProviderBase {
  constructor(entry: AtCoderChampionshipEntry);
}

// src/features/tasks/utils/contest-table/atcoder_world_tour_finals_entries.ts
// Built from an ordered contest id list with ContestType.ATCODER_MAIN_OFFICIAL_ONSITE and getContestNameLabel.
export const ATCODER_WORLD_TOUR_FINALS_ENTRIES: Readonly<AtCoderChampionshipEntries>; // 6 entries

// src/features/tasks/utils/contest-table/contest_table_provider_groups.ts
AtCoderWorldTourFinals: () => ContestTableProviderGroup; // 'AtCoder 世界大会'
contestTableProviderGroups.atcoderWorldTourFinals; // between fromArc001ToArc057 and atcoderJapanChampionship
```

コンポーネントの props / events は変えない。

## フェーズ（低リスク → 高リスク）

### Phase 1: Provider の改名（挙動を変えない）

- `git mv` で Provider とテストを `atcoder_championship_provider(.test).ts` に移し、型を Provider のファイルへ移す。`atcoder_japan_championship_entries.ts` と `contest_table_provider_groups.ts` の import、JSDoc、テストの describe 名を直す。
- `pnpm test:unit src/features/tasks/utils/contest-table/` のテスト数が改名前と同じことを確かめてコミットする（`refactor(contest-table): ...`）。

### Phase 2: fixture を実際の ID に直す（`src/lib/contests/`）

- `fixtures/contest_type.ts` と `fixtures/contest_name_labels.ts` の `awtf2026algo-open` を `awtf2026algo` にし、wtf22-day2 と同じ注記を付ける。`labels/world_tour_finals.ts` のコメント（`-open` が付かない例外は wtf22-day2 だけ）も直す。
- 分類とラベルの実装は変えない。`pnpm test:unit src/lib/contests/` が通ることを確かめてコミットする。

### Phase 3: seed（`prisma/tasks.ts`）

- tasks.json の awtf2026algo の 5 行を、オンサイト決勝ブロックの先頭（`ajo2025-final-open` の前）に E → A の順で入れる。
- `grep -c` で件数を確かめ、tasks.json を消してコミットする。

### Phase 4: エントリとグループ登録（Layer 4–5）

- テスト先行:
  - `atcoder_world_tour_finals_entries.test.ts`: `lists every World Tour Finals contest in the seed exactly once` / `seeds every problem of each entry, matching the maintainer spreadsheet`（5, 5, 5, 5, 5, 6 をリテラルで）/ `titles each table with its contest name label`（6 件の見出しをリテラルで）
  - `atcoder_championship_provider.test.ts`: `keys the cells of $name by the same letters as the header` に wtf19（A, B, C1, C2, D, E）を足す。既存の挙動の確認なので最初から通る。
  - `contest_table_provider_groups.test.ts`: `AtCoderWorldTourFinals registers one provider per contest in the spreadsheet order`（6 個の provider key とメタデータをリテラルで）。並びのテストを `places the AtCoder 世界大会 and 日本大会 buttons right after 旧 ARC and before 競プロ典型 90 問` に直す。
- 実装 → `pnpm test:unit src/features/tasks/utils/contest-table/` で GREEN → コミットする。

### Phase 5: ドキュメント

- `docs/guides/how-to-add-contest-table-provider.md` の「AtCoder 日本大会」の節と表を新しい Provider 名に直し、「AtCoder 世界大会」の行と、新しい回の足し方（seed と配列の両方。書き漏れは整合テストで落ちる）を足す。最終更新日を変える。

### Phase 6（取りやめ）: データ migration

- 本番に `awtf2024-open` の `OTHERS` の行が無かったので行わない。

## 検証とレビュー

- `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit` / `git diff --check`
- migration・認証・30 ファイル以上のいずれにも当たらないので、クロスレビューは任意。
