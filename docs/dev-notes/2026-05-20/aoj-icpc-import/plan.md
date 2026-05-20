# AOJ ICPC インポート対応

## 概要

AOJ（Aizu Online Judge）の ICPC 国内予選・地区予選の問題をインポートできるようにする。

対象 URL:

- https://onlinejudge.u-aizu.ac.jp/challenges/sources/ICPC/Prelim
- https://onlinejudge.u-aizu.ac.jp/challenges/sources/ICPC/Regional

API エンドポイント: `/challenges/cl/ICPC/PRELIM` / `/challenges/cl/ICPC/REGIONAL`

contest_id (abbr) フォーマット: `ICPCPrelim{YYYY}` / `ICPCRegional{YYYY}`（確認済み）

## 設計方針

既存の `AojChallengesApiClient` を拡張する。PCK・JAG と全く同じアーキテクチャで動作するため、
`ChallengeContestType` に `'ICPC'` を追加し、`IcpcRound = 'PRELIM' | 'REGIONAL'` を定義するだけで
クライアント実装は不要。

## 却下した代替案

- **専用 ApiClient クラス**: PCK/JAG と同じ API 構造なので不要。YAGNI。
- **AOJ_JAG との統合**: JAG (Japan Alumni Group) と ICPC は主催が異なるため分離が正しい。

## スコープ（本 PR）

ContestTableProvider は次 PR。本 PR は以下のみ:

1. Prisma enum 追加 + migration
2. API client 型拡張
3. `classifyContest()` 更新
4. 管理画面 import source 追加

## フェーズ概要

| フェーズ | 内容                                                                      | リスク          |
| -------- | ------------------------------------------------------------------------- | --------------- |
| Phase 1  | テストを書く（TDD: フィクスチャ・テストケース追加）                       | 低              |
| Phase 2  | Prisma schema 変更 + migration + `types/contest.ts` 更新                  | 中（migration） |
| Phase 3  | API Client 型拡張（`types.ts` / `index.ts`）                              | 低              |
| Phase 4  | `contest.ts` 更新（classifyContest / priorities / labels / isAojContest） | 低              |

---

## Phase 1: テストを書く（TDD）

### タスク 1-1: テスト用フィクスチャ作成（`record_requests.ts` 経由）

フィクスチャ JSON は手書きせず、実 API を叩いて自動生成する。

**`src/lib/clients/fixtures/record_requests.ts` を変更**:

1. `saveAojChallenge` の引数型を拡張:

   ```typescript
   async function saveAojChallenge(
     contestType: 'PCK' | 'JAG' | 'ICPC',
     round: 'PRELIM' | 'FINAL' | 'REGIONAL',
     dir: string,
   ): Promise<void>;
   ```

2. `challengeConfigs` に ICPC を追加:

   ```typescript
   const challengeConfigs = [
     { contestType: 'PCK', round: 'PRELIM', dir: 'pck_prelim' },
     { contestType: 'PCK', round: 'FINAL', dir: 'pck_final' },
     { contestType: 'JAG', round: 'PRELIM', dir: 'jag_prelim' },
     { contestType: 'JAG', round: 'REGIONAL', dir: 'jag_regional' },
     { contestType: 'ICPC', round: 'PRELIM', dir: 'icpc_prelim' },
     { contestType: 'ICPC', round: 'REGIONAL', dir: 'icpc_regional' },
   ] as const;
   ```

**スクリプト実行**:

```bash
pnpm dlx vite-node ./src/lib/clients/fixtures/record_requests.ts
```

→ `src/lib/clients/fixtures/aizu_online_judge/challenges/icpc_prelim/contests.json` と
`icpc_regional/contests.json` が自動生成される。

### タスク 1-2: `clients.test.ts` に ICPC テスト追加

`FIXTURE_PATHS` に追加:

```typescript
icpcPrelim: {
  contests: './src/lib/clients/fixtures/aizu_online_judge/challenges/icpc_prelim/contests.json',
},
icpcRegional: {
  contests: './src/lib/clients/fixtures/aizu_online_judge/challenges/icpc_regional/contests.json',
},
```

nock 対象:

- `/challenges/cl/ICPC/PRELIM`
- `/challenges/cl/ICPC/REGIONAL`

PCK/JAG と同パターンで `describe('ICPC PRELIM')` / `describe('ICPC REGIONAL')` を追加。

### タスク 1-3: `contest_type.ts` に `aojIcpc` 追加

```typescript
const aojIcpcContestData = [
  { name: 'AOJ, ICPC Prelim 2023', contestId: 'ICPCPrelim2023' },
  { name: 'AOJ, ICPC Prelim 2024', contestId: 'ICPCPrelim2024' },
  { name: 'AOJ, ICPC Regional 2023', contestId: 'ICPCRegional2023' },
  { name: 'AOJ, ICPC Regional 2024', contestId: 'ICPCRegional2024' },
];

export const aojIcpc = aojIcpcContestData.map(({ name, contestId }) =>
  createTestCaseForContestType(name)({
    contestId,
    expected: ContestType.AOJ_ICPC,
  }),
);
```

### タスク 1-4: `contest_name_and_task_index.ts` に ICPC テストデータ追加

フィクスチャ生成後に実際の問題 ID を確認して設定する。

```typescript
const AOJ_ICPC_TEST_DATA = {
  Prelim2023: { contestId: 'Prelim2023', tasks: ['実ID1', '実ID2'] },
  Prelim2024: { contestId: 'Prelim2024', tasks: ['実ID1', '実ID2'] },
  Regional2023: { contestId: 'Regional2023', tasks: ['実ID1', '実ID2'] },
  Regional2024: { contestId: 'Regional2024', tasks: ['実ID1', '実ID2'] },
};
```

期待値例:

- `ICPCPrelim2024` + task `XXXX` → `"AOJ XXXX（ICPC 国内予選 2024）"`
- `ICPCRegional2024` + task `XXXX` → `"AOJ XXXX（ICPC 地区予選 2024）"`

### タスク 1-5: `contest.test.ts` に ICPC テストブロック追加

JAG の直後に以下 4 箇所追加:

1. `classifyContest` → `when contest_id means AOJ ICPC (prelim and regional)`
2. `get contest priority` → `when contest_id means AOJ ICPC (prelim and regional)`
3. `get contest name label` → ICPC 個別テスト
4. `addContestNameToTaskIndex` → AOJ セクションに ICPC 追加

---

## Phase 2: Prisma Schema + Types

### タスク 2-1: `prisma/schema.prisma` 変更

`AOJ_ICPC` を `AOJ_PCK` の直後、`AOJ_JAG` の直前に追加:

```prisma
AOJ_PCK  // All-Japan High School Programming Contest (PCK)
AOJ_ICPC // ICPC (International Collegiate Programming Contest)
AOJ_JAG  // ACM-ICPC Japan Alumni Group Contest (JAG)
```

### タスク 2-2: Migration 実行

```bash
pnpm exec prisma migrate dev --name add_aoj_icpc_to_contest_type
```

### タスク 2-3: `src/lib/types/contest.ts` 更新

`ContestType` const に追加（`AOJ_PCK` と `AOJ_JAG` の間）:

```typescript
AOJ_PCK: 'AOJ_PCK',
AOJ_ICPC: 'AOJ_ICPC', // ICPC (International Collegiate Programming Contest)
AOJ_JAG: 'AOJ_JAG',
```

---

## Phase 3: API Client 拡張

### タスク 3-1: `src/lib/clients/aizu_online_judge/types.ts`

```typescript
export type ChallengeContestType = 'PCK' | 'JAG' | 'ICPC';

export type IcpcRound = 'PRELIM' | 'REGIONAL';

export type ChallengeRoundMap = {
  PCK: PckRound;
  JAG: JagRound;
  ICPC: IcpcRound;
};
```

### タスク 3-2: `src/lib/clients/index.ts`

`ContestTaskImportSource` に追加:

```typescript
| 'aoj_icpc_prelim'
| 'aoj_icpc_regional'
```

`importSources` に追加:

```typescript
aoj_icpc_prelim: buildAojChallengeConfig(
  { contestType: 'ICPC', round: 'PRELIM' },
  'AOJ - ICPC 国内予選',
),
aoj_icpc_regional: buildAojChallengeConfig(
  { contestType: 'ICPC', round: 'REGIONAL' },
  'AOJ - ICPC 地区予選',
),
```

---

## Phase 4: `contest.ts` 更新

### タスク 4-1: `classifyContest()` に ICPC 追加

JAG の `if` の直前に追加:

```typescript
if (/^ICPC(Prelim|Regional)\d*$/.exec(contest_id)) {
  return ContestType.AOJ_ICPC;
}
```

### タスク 4-2: `contestTypePriorities` 更新

```typescript
[ContestType.AOJ_COURSES, 21],
[ContestType.AOJ_PCK, 22],
[ContestType.AOJ_ICPC, 23], // 追加
[ContestType.AOJ_JAG, 24], // 23 → 24
```

JSDoc カテゴリ名（`External platforms`）は変更しない。括弧内の数値範囲のみ `(21–24)` に更新。

### タスク 4-3: `ICPC_TRANSLATIONS` 追加（`JAG_TRANSLATIONS` 直後）

```typescript
const ICPC_TRANSLATIONS = {
  Prelim: ' 国内予選 ',
  Regional: ' 地区予選 ',
};
```

結果例（`getAojContestLabel` による文字列置換）:

- `ICPCPrelim2024` → `（ICPC 国内予選 2024）`
- `ICPCRegional2024` → `（ICPC 地区予選 2024）`

### タスク 4-4: `getContestNameLabel()` に ICPC 分岐追加（JAG 直後）

```typescript
if (contestId.startsWith('ICPC')) {
  return getAojContestLabel(ICPC_TRANSLATIONS, contestId);
}
```

### タスク 4-5: `isAojContest()` に ICPC 追加

```typescript
function isAojContest(contestId: string): boolean {
  return (
    aojCoursePrefixes.has(contestId) ||
    contestId.startsWith('PCK') ||
    contestId.startsWith('JAG') ||
    contestId.startsWith('ICPC')
  );
}
```

---

## 検証

```bash
pnpm exec prisma generate                         # Prisma client 再生成
pnpm test:unit src/lib/clients/                   # API client テスト
pnpm test:unit src/test/lib/utils/contest.test.ts # contest.ts テスト
pnpm check                                        # 型チェック
pnpm lint                                         # lint
```

管理画面 (`/tasks`) に「AOJ - ICPC 国内予選」「AOJ - ICPC 地区予選」が表示されることを目視確認。

---

## 追加変更: `AojGenerator.canHandle()` に ICPC 追加

### 概要

`src/lib/utils/task.ts` の `AojGenerator.canHandle()` に `contestId.startsWith('ICPC')` を追加した。
これにより、ICPC コンテストの問題 URL が AtCoder URL ではなく AOJ URL（`AOJ_TASKS_URL/{taskId}`）で生成される。

### 変更ファイル

- `src/lib/utils/task.ts` — `AojGenerator.canHandle()` に ICPC 条件追加
- `src/test/lib/utils/test_cases/task_url.ts` — `icpcContests` / `aojIcpc` エクスポート追加
- `src/test/lib/utils/task.test.ts` — AOJ ICPC describe ブロック追加

### テストデータ（実 task ID）

```typescript
const icpcContests = [
  { contestId: 'ICPCPrelim2023', tasks: ['1664', '1665'] },
  { contestId: 'ICPCPrelim2024', tasks: ['1672', '1673'] },
  { contestId: 'ICPCRegional2023', tasks: ['1444', '1445'] },
  { contestId: 'ICPCRegional2024', tasks: ['1455', '1456'] },
];
```

### 検証

```bash
pnpm test:unit src/test/lib/utils/task.test.ts  # 172 tests passed
```

---

## 残タスク（次 PR）

- `ContestTableProvider` 実装（how-to-add-contest-table-provider.md 参照）
- `contestTypePriorities` の優先度は暫定値（次 PR で ContestTableProvider 登録後に再確認）
