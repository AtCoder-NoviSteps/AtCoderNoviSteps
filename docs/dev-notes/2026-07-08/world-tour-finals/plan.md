# ATCODER_MAIN_OFFICIAL_ONSITE (World Tour Finals) の追加

## 概要 / Context

AtCoder World Tour Finals (WTF / AWTF、公式オンサイト決勝) を独立した `ContestType` として分類できるようにする。現状 `awtf2024` のみ `ATCODER_OTHERS` プレフィックスマップ経由で `OTHERS` に分類されており、他年度 (`wtf19` / `wtf22-day1` / `wtf22-day2` / `awtf2025` / `awtf2026`) は未分類 (`classifyContest` が `null`) のまま。これらを新設 `ATCODER_MAIN_OFFICIAL_ONSITE` に集約し、専用ラベルを付与する。

**今回のスコープ**: schema enum / 型定義 / `classifyContest`（フィルタリング）/ ラベル / 優先度 / 単体テスト / seed 1 件。
**別 PR**: コンテストテーブル (Provider クラス・グループ登録・UI) は今回追加しない。

## 設計方針 / Design rationale

- 分類・ラベルロジックは既存の `getJoiContestLabel` / `getPastContestLabel` と同じく `src/lib/utils/contest.ts` にモジュールレベルの共有ヘルパーとして実装。
- `isWorldTourFinals()`（述語）を `classifyContest` と `getContestNameLabel` の両方から再利用し DRY を維持。
- Heuristic 部門 (`awtf2025heuristic`) は正規表現の `$` アンカーで確実に除外。

### 却下した代替案 / Rejected alternatives

- **Provider を年度別 N インスタンス (パターン4) で今回同時実装**: ユーザー指示によりテーブルは別 PR。分類ロジックのみ先行。
- **`ATCODER_OTHERS` マップに `wtf19` 等を追加して `OTHERS` に留める**: World Tour Finals は独立表示・優先度制御が必要なため専用 `ContestType` を新設。
- **年度パラメータ型ヘルパー**: contest_id 命名が年で不規則 (`wtf19` / `wtf22-day1` / `awtf2024`) なため、単一正規表現 + 分岐の方が単純。

### 分類ルール（Algorithm 部門のみ、Heuristic 部門は対象外）

| 年   | contest_id                  | ラベル                             |
| ---- | --------------------------- | ---------------------------------- |
| 2019 | `wtf19`                     | World Tour Finals 2019             |
| 2022 | `wtf22-day1` / `wtf22-day2` | World Tour Finals 2022 Day1 / Day2 |
| 2024 | `awtf2024`                  | World Tour Finals 2024             |
| 2025 | `awtf2025`                  | World Tour Finals 2025 Algorithm   |
| 2026 | `awtf2026`                  | World Tour Finals 2026 Algorithm   |

- `Algorithm` サフィックスは 2025 年以降のみ（Heuristic 部門 `awtf2025heuristic` と識別するため。**括弧なし**）。
- `Day` は day 分割のある 2022 年のみ。
- 2018 以前・2020・2023 は開催なし。
- **重要な除外**: `awtf2025heuristic` は分類しない（`expected: null`）。

## 挿入位置

enum・優先度ともに **`FPS_24` の後、`OTHERS` の前**（優先度 = 20）。

---

## フェーズ / Phases

### Phase 1 — Prisma schema（低リスク）

`prisma/schema.prisma` の `ContestType` enum に、`FPS_24` の直後・`OTHERS` の直前へ追加:

```prisma
ATCODER_MAIN_OFFICIAL_ONSITE // AtCoder World Tour Finals (official onsite finals)
```

- enum 値追加のため migration が必要: `pnpm exec prisma migrate dev --name add_atcoder_main_official_onsite_to_contest_type`
  （非対話環境では `pnpm exec prisma generate` のみ実行し、migration は対話シェルで作成）
- `pnpm check` → `src/lib/types/contest.ts` に型エラーが出れば client 再生成成功。

### Phase 2 — TypeScript ContestType 定数

`src/lib/types/contest.ts` の `FPS_24` 行の直後（`OTHERS` の前）:

```typescript
ATCODER_MAIN_OFFICIAL_ONSITE: 'ATCODER_MAIN_OFFICIAL_ONSITE', // AtCoder World Tour Finals (official onsite finals)
```

- `pnpm check` → エラー解消を確認。

### Phase 3 — Contest utilities（TDD、中リスク）

対象: `src/lib/utils/contest.ts`

#### 先にテストを追加（RED）

1. `src/test/lib/utils/test_cases/contest_type.ts`: 既存 `awtf2024` テストケースの `expected` を `ContestType.OTHERS` → `ContestType.ATCODER_MAIN_OFFICIAL_ONSITE` に変更。新規 `export const atCoderMainOfficialOnsite` を追加し `wtf19` / `wtf22-day1` / `wtf22-day2` / `awtf2024` / `awtf2025` / `awtf2026` を網羅。**除外ケース `awtf2025heuristic` → `null` を別途記述**。
2. `src/test/lib/utils/test_cases/contest_name_labels.ts`: 新規 `export const atCoderMainOfficialOnsite` を追加（上表のラベル、Day1/Day2/Algorithm 各パターン）。
3. `src/test/lib/utils/contest.test.ts` に 3 ブロック追加:
   - `classify contest` 配下（`atCoderOthers` パターン近辺）に `atCoderMainOfficialOnsite.forEach(...)`
   - `get contest priority` 配下に同様のブロック
   - `get contest name label` 配下に `TestCasesForContestNameLabel.atCoderMainOfficialOnsite`
   - `null` ケースは `expect(classifyContest('awtf2025heuristic')).toBeNull()` で個別記述。
4. `pnpm test:unit src/test/lib/utils/contest.test.ts` → **RED** を確認。

#### 実装（GREEN）

`contest.ts` に共有ヘルパーを追加:

```typescript
// World Tour Finals (AtCoder official onsite finals), Algorithm division only.
// Heuristic division (e.g. awtf2025heuristic) is out of scope.
const regexForWorldTourFinals = /^(wtf19|wtf22-day[12]|awtf20\d{2})$/;

export const isWorldTourFinals = (contestId: string): boolean =>
  regexForWorldTourFinals.test(contestId);

export const getWorldTourFinalsLabel = (contestId: string): string => {
  const base = 'World Tour Finals';

  if (contestId === 'wtf19') {
    return `${base} 2019`;
  }

  const dayMatch = /^wtf22-day([12])$/.exec(contestId);

  if (dayMatch) {
    return `${base} 2022 Day${dayMatch[1]}`;
  }

  const awtfMatch = /^awtf(20\d{2})$/.exec(contestId);

  if (awtfMatch) {
    const year = Number(awtfMatch[1]);
    // "Algorithm" distinguishes from the Heuristic division, introduced in 2025.
    return year >= 2025 ? `${base} ${year} Algorithm` : `${base} ${year}`;
  }

  return contestId.toUpperCase();
};
```

変更点:

- `classifyContest`: `atCoderOthersPrefixes` チェック**より前**（`fps-24` 分岐付近）に追加:
  ```typescript
  if (isWorldTourFinals(contest_id)) {
    return ContestType.ATCODER_MAIN_OFFICIAL_ONSITE;
  }
  ```
- `getContestNameLabel`: `ATCODER_OTHERS` ルックアップ**より前**（`fps-24` ラベル付近）に追加:
  ```typescript
  if (isWorldTourFinals(contestId)) {
    return getWorldTourFinalsLabel(contestId);
  }
  ```
- `ATCODER_OTHERS` マップから `awtf2024: 'World Tour Finals 2024'` を**削除**（新分岐が担うため）。
- `contestTypePriorities`: `[ContestType.FPS_24, 19]` の直後に `[ContestType.ATCODER_MAIN_OFFICIAL_ONSITE, 20]` を挿入。`OTHERS` 以降を +1（`OTHERS`=21 … `AOJ_UNIVERSITY`=26）。
- 優先度 JSDoc: **カテゴリ名は変更せず**数値範囲のみ更新 — `0 = Highest, 26 = Lowest`、`Special contests (18-21)`、`External platforms (22-26)`。

`pnpm test:unit src/test/lib/utils/contest.test.ts` → **GREEN**。

> 優先度テストは `contestTypePriorities.get(expected)` を使うためハードコード値なし。`task.test.ts` にも優先度差のハードコードは無いこと確認済み（シフトは安全）。

### Phase 4 — Seed data

`prisma/tasks.ts` に wtf22_day1_d を 1 件追加（grade なし = 未評価、abc422_g 等と同様）:

```typescript
{
  id: 'wtf22_day1_d',
  contest_id: 'wtf22-day1',
  problem_index: 'D',
  name: 'Welcome to Tokyo!',
  title: 'D. Welcome to Tokyo!',
},
```

---

## 検証 / Verification

```bash
pnpm test:unit src/test/lib/utils/contest.test.ts   # classify / priority / name label すべて GREEN
pnpm check                                            # 型エラーなし
pnpm lint
pnpm format
```

手動確認ポイント:

- `classifyContest('awtf2025heuristic')` → `null`（Heuristic 除外）
- `classifyContest('awtf2024')` → `ATCODER_MAIN_OFFICIAL_ONSITE`（旧 OTHERS からの移行）
- `getContestNameLabel('wtf22-day2')` → `'World Tour Finals 2022 Day2'`
- `getContestNameLabel('awtf2025')` → `'World Tour Finals 2025 Algorithm'`

上記4点は単体テスト（`contest.test.ts`）の該当ケースとして実装済みで、`pnpm test:unit` の GREEN によって検証済み。

## 実装結果 / Implementation summary

全4フェーズ完了。`pnpm test:unit`（2687 passed / 1 skipped）、`pnpm check`（0 errors）、`pnpm lint`、`pnpm format` すべて成功。

### 気づき / Lessons

- `getContestNameLabel('awtf2024')` は旧 `ATCODER_OTHERS` マップ経由でも新 `isWorldTourFinals` 分岐経由でも同じ文字列 `'World Tour Finals 2024'` を返すため、`ATCODER_OTHERS` からのエントリ削除漏れがあってもテストは検知できない。今回は削除を確実に実施したが、同様の「出力が変わらない移行」では削除漏れを見逃しやすい点に注意。
- `prisma/tasks.ts` の Contest 行は `prisma/seed.ts` が `classifyContest(task.contest_id)` を使って動的生成するため、`wtf22-day1` のような新規 contest_id は Contest 用の別マスタ登録が不要（Task 追加のみで完結）。
- 非対話環境かつ `.env` に `DATABASE_URL` が存在しないため、`pnpm exec prisma migrate dev` は実行不可と判断し `pnpm exec prisma generate` のみ実行。実マイグレーションファイルの作成はユーザー環境（対話シェル）で別途必要。

### CodeRabbit Findings

`coderabbit review --plain` を実行（2026-07-08）。10件の指摘はすべて本タスクの変更ファイル外（`docs/dev-notes/2026-06-28/`, `docs/dev-notes/2026-07-01/`, `docs/ui-mock/`, `docs/guides/claude-code.md`, `docs/dev-notes/2026-07-05/` など、作業ツリーに存在する別作業分）であり、本タスクの実装ファイル（`prisma/schema.prisma`, `prisma/tasks.ts`, `src/lib/types/contest.ts`, `src/lib/utils/contest.ts`, `src/test/lib/utils/contest.test.ts`, `src/test/lib/utils/test_cases/*.ts`）に対する指摘は0件。

## 訂正 / Correction（2026-07-08 追記）

実装後、`prisma/tasks.ts`（8847〜9028行目）に実データが投入されていることが判明し、本プランが前提としていた contest_id（`wtf19` / `wtf22-day1` / `awtf2024` / `awtf2025` 等の素の形式）が実際とは異なっていた。

**実際の contest_id 形式:**

| 年 | 想定していた ID（誤り） | 実際の ID |
| --- | --- | --- |
| 2019 | `wtf19` | `wtf19-open` |
| 2022 Day1 | `wtf22-day1` | `wtf22-day1-open` |
| 2022 Day2 | `wtf22-day2` | `wtf22-day2`（`-open` なし、Day1 と非対称） |
| 2024 | `awtf2024` | `awtf2024-open` |
| 2025 | `awtf2025` | `awtf2025algo-open`（`algo` が挟まる） |

**対応:**

- `isWorldTourFinals` / `getWorldTourFinalsLabel` に `stripOpenSuffix` ヘルパーを追加し、末尾の `-open` を判定・ラベル生成の前に正規化して除去する設計に変更。`wtf22-day2` の非対称性もこの正規化で自然に吸収される（`-open` が無ければ no-op）。
- Algorithm 部門判定は「年 >= 2025」ではなく、実際の ID が持つ `algo` インフィックスの有無で判定するように変更（`awtf2024` はインフィックスなし、`awtf2025algo` 以降はあり）。Heuristic 部門（`awtf2025heuristic-open` 等）は `algo` を含まないため、この正規表現だけで自然に除外される。
- テストケース（`contest_type.ts` / `contest_name_labels.ts`）を実際の `-open` 付き ID に更新。あわせて `-open` の有無どちらでも同じ分類結果になることを検証するエッジケーステストを追加。
- Phase 4 で追加した `prisma/tasks.ts` 末尾の 1 件（`contest_id: 'wtf22-day1'`）は、実際にはユーザーが投入した本物のシードデータ（`wtf22-day1-open` を含む26件、wtf19/wtf22-day1/wtf22-day2/awtf2024/awtf2025algo）と重複・不整合だったため不要と判明（ユーザー側の編集により既に解消）。

**気づき:** シードデータの実値を確認せずに contest_id の命名規則をプラン段階で仮定すると、正規表現・ラベル関数の両方が実データと乖離する。今後同様のプランでは、分類ロジックを書く前に対象の `contest_id` を `prisma/tasks.ts` から実際に `grep` して確認する。
