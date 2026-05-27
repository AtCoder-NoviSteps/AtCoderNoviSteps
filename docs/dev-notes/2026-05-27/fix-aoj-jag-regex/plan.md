# AOJ_JAG 対象コンテスト拡張計画

## 概要

`classifyContest` の AOJ_JAG 判定を拡張し、Summer / Winter / Spring（合宿系）の contest_id を正しく分類・ラベル表示できるようにする。
TDD に従い、先にテストを追加してから実装を拡張する。

## 背景

`src/lib/utils/contest.ts:104` の現行正規表現:

```
/^JAG(Prelim|Regional|Summer|Winter|Spring)\d*$/
```

`prisma/tasks.ts` に存在する `JAGSummer2006-day2` などの contest_id は `\d*$`（末尾が数字のみ）にマッチせず、`null` が返る。
また `JAG_TRANSLATIONS` は Prelim / Regional のみ定義されており、合宿系の日本語ラベルが未対応。

### 実データのパターン（tasks.ts より）

| パターン                         | 例                               | 現行マッチ |
| -------------------------------- | -------------------------------- | ---------- |
| `JAGxxxxYYYY` (サフィックスなし) | `JAGSpring2012`, `JAGWinter2009` | ✓          |
| `JAGxxxxYYYY-dayN`               | `JAGSummer2006-day1`             | ✗          |
| `JAGxxxxYYYY-dayNA`              | `JAGSummer2012-day3A`            | ✗          |

## 設計方針

### 正規表現

サフィックス部分を `(-day\d+[A-Z]?)?` に拡張する:

```
/^JAG(Prelim|Regional|Summer|Winter|Spring)\d*(-day\d+[A-Z]?)?$/
```

### ラベル変換（確認済み）

`JAG_TRANSLATIONS` に以下を追加する:

| キー     | 変換後   |
| -------- | -------- |
| `Summer` | `夏合宿` |
| `Winter` | `冬合宿` |
| `Spring` | `春合宿` |
| `-day`   | ` Day`   |

変換例:

- `JAGSummer2024-day2` → `（JAG 夏合宿 2024 Day2）`
- `JAGWinter2009` → `（JAG 冬合宿 2009）`
- `JAGSummer2012-day3A` → `（JAG 夏合宿 2012 Day3A）`

`getAojContestLabel` は既存の `Object.entries(translations).forEach(replace)` パターンで動作するため、翻訳テーブルへの追加のみで対応できる。

## 却下した代替案

- `startsWith('JAG')` で全マッチ: 他の JAG prefix との境界が曖昧になる。現行の named group 方式を維持する方が明示的。
- `[\w-]+$` で末尾を緩くする: 過度に広く、意図しない contest_id をマッチさせるリスクがある。

---

## タスク

### Phase 1: テストを先に追加（TDD）

#### 1-1. `contest_type.ts` に分類テスト追加

**ファイル**: `src/test/lib/utils/test_cases/contest_type.ts`

`aojJagContestData` に Summer / Winter / Spring のケースを追加する（Prelim / Regional は変更しない）:

```typescript
// サフィックスなし（古い年・新しい年）
{ name: 'AOJ, JAG Spring 2012',         contestId: 'JAGSpring2012' },
{ name: 'AOJ, JAG Spring 2015',         contestId: 'JAGSpring2015' },
{ name: 'AOJ, JAG Winter 2009',         contestId: 'JAGWinter2009' },
{ name: 'AOJ, JAG Winter 2011',         contestId: 'JAGWinter2011' },
// -dayN（数字のみ、古い年・新しい年）
{ name: 'AOJ, JAG Summer 2006 day1',    contestId: 'JAGSummer2006-day1' },
{ name: 'AOJ, JAG Summer 2006 day2',    contestId: 'JAGSummer2006-day2' },
{ name: 'AOJ, JAG Winter 2006 day2',    contestId: 'JAGWinter2006-day2' },
{ name: 'AOJ, JAG Summer 2023 day2',    contestId: 'JAGSummer2023-day2' },
{ name: 'AOJ, JAG Summer 2024 day2',    contestId: 'JAGSummer2024-day2' },
{ name: 'AOJ, JAG Summer 2024 day3',    contestId: 'JAGSummer2024-day3' },
// -dayNA（数字+大文字）
{ name: 'AOJ, JAG Summer 2012 day3A',   contestId: 'JAGSummer2012-day3A' },
{ name: 'AOJ, JAG Summer 2012 day3B',   contestId: 'JAGSummer2012-day3B' },
```

#### 1-2. `contest_name_labels.ts` に JAG ラベルテスト追加

**ファイル**: `src/test/lib/utils/test_cases/contest_name_labels.ts`

新規 `aojJag` export を追加する:

```typescript
export const aojJag = [
  createTestCaseForContestNameLabel('AOJ, JAG Summer 2024 day2')({
    contestId: 'JAGSummer2024-day2',
    expected: '（JAG 夏合宿 2024 Day2）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Winter 2009')({
    contestId: 'JAGWinter2009',
    expected: '（JAG 冬合宿 2009）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Spring 2012')({
    contestId: 'JAGSpring2012',
    expected: '（JAG 春合宿 2012）',
  }),
  createTestCaseForContestNameLabel('AOJ, JAG Summer 2012 day3A')({
    contestId: 'JAGSummer2012-day3A',
    expected: '（JAG 夏合宿 2012 Day3A）',
  }),
];
```

#### 1-3. `contest_name_and_task_index.ts` に合宿系テスト追加

**ファイル**: `src/test/lib/utils/test_cases/contest_name_and_task_index.ts`

現行の `AOJ_JAG_TEST_DATA` は Prelim / Regional のみ。合宿系は `contestId` に `-dayN` が入るため型も変わる。

- `JagCampContestId` 型を新設（例: `'Summer2024-day2'` のような `string` subtype）
- 合宿系専用の `generateAojJagCampTestCases` 関数を追加（expected 生成時に Summer/Winter/Spring と `-day` の翻訳を適用）

追加データ例:

```typescript
const AOJ_JAG_CAMP_TEST_DATA = {
  'Summer2006-day2': { tasks: ['2058', '2059'] },
  'Summer2024-day2': { tasks: ['XXXX'] }, // tasks.ts から確認して設定
  Winter2009: { tasks: ['XXXX'] },
  Spring2012: { tasks: ['XXXX'] },
  'Summer2012-day3A': { tasks: ['XXXX'] },
};
```

expected 形式: `AOJ ${taskIndex}（JAG 夏合宿 2024 Day2）`

#### 1-4. `contest.test.ts` の describe 文言更新と新ブロック追加

**ファイル**: `src/test/lib/utils/contest.test.ts`

1. 3箇所の `'when contest_id mean(s) AOJ JAG (prelim and regional)'` を `'when contest_id means AOJ JAG'` に変更（Summer/Winter/Spring も含むため）
2. `get contest name label` の AOJ セクションに JAG ブロックを追加:

```typescript
describe('when contest_id means AOJ JAG', () => {
  TestCasesForContestNameLabel.aojJag.forEach(({ name, value }) => {
    runTests(`${name}`, [value], ({ contestId, expected }: TestCaseForContestNameLabel) => {
      expect(getContestNameLabel(contestId)).toEqual(expected);
    });
  });
});
```

---

### Phase 2: 実装を拡張

#### 2-1. `contest.ts` 正規表現修正

**ファイル**: `src/lib/utils/contest.ts:104`

```typescript
// 変更前
if (/^JAG(Prelim|Regional|Summer|Winter|Spring)\d*$/.exec(contest_id)) {

// 変更後
if (/^JAG(Prelim|Regional|Summer|Winter|Spring)\d*(-day\d+[A-Z]?)?$/.exec(contest_id)) {
```

#### 2-2. `JAG_TRANSLATIONS` 拡張

**ファイル**: `src/lib/utils/contest.ts:699`

```typescript
// 変更前
const JAG_TRANSLATIONS = {
  Prelim: ' 模擬国内 ',
  Regional: ' 模擬地区 ',
};

// 変更後
const JAG_TRANSLATIONS = {
  Prelim: ' 模擬国内 ',
  Regional: ' 模擬地区 ',
  Summer: ' 夏合宿 ',
  Winter: ' 冬合宿 ',
  Spring: ' 春合宿 ',
  '-day': ' Day',
};
```

---

## 検証

```bash
pnpm test:unit
```

- Phase 1 完了後: 新規追加テストが **FAIL** すること
- Phase 2 完了後: 全テスト **PASS** すること
