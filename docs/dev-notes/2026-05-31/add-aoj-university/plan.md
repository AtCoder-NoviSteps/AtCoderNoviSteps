# AOJ_UNIVERSITY ContestType 追加

## 概要

Issue #3598。RUPC / HUPC / UAPC 系の大学対抗プログラミングコンテスト（AOJ ホスト）を新しい ContestType `AOJ_UNIVERSITY` として分類・ラベル表示できるようにする。

## 設計方針

### 対象 contest_id パターン

正規表現 `/^AOJ-[A-Z]+PC\d{4}/` でマッチする ID：

- `AOJ-RUPC2018-in-ACPC2018-day1`
- `AOJ-HUPC2020-in-HUPC2020-day1`
- `AOJ-UAPC2019-in-RUPC2019-day2`
- `AOJ-UAPC2003`（年のみ）
- `AOJ-UAPC2011-summer`（season 付き）
- `AOJ-UAPC2012-day1`（day 付き）
- など

既存 ContestType（`AOJ_JAG` = `JAGPrelim...` など）は `AOJ-` プレフィックスを持たないため衝突しない。

### ラベル変換方針

`getContestNameLabel` が返す文字列（**JAG 同様、`（）` で囲む**）：

| 入力                            | 出力                              |
| ------------------------------- | --------------------------------- |
| `AOJ-RUPC2018-in-ACPC2018-day1` | `（RUPC 2018 in ACPC 2018 Day1）` |
| `AOJ-HUPC2020-in-HUPC2020-day1` | `（HUPC 2020 in HUPC 2020 Day1）` |
| `AOJ-UAPC2019-in-RUPC2019-day2` | `（ACPC 2019 in RUPC 2019 Day2）` |
| `AOJ-UAPC2003`                  | `（ACPC 2003）`                   |
| `AOJ-UAPC2011-summer`           | `（ACPC 2011 Summer）`            |
| `AOJ-UAPC2012-day1`             | `（ACPC 2012 Day1）`              |

ルール：contest_id 中の `UAPC` はラベルでは **`ACPC`** に変換する（contest_id の分類 regex は変更しない）。

`addContestNameToTaskIndex` の出力例（`（）` 付きで正しく表示される）：

- `AOJ 3058（ACPC 2019 in RUPC 2019 Day2）`

変換ロジック：

```typescript
function getAojUniversityContestLabel(contestId: string): string {
  const label = contestId
    .replace(/^AOJ-/, '')
    .replace(/UAPC/g, 'ACPC') // UAPC → ACPC（ラベル表示上の変換）
    .replace(/([A-Z]{2,})(\d{4})/g, '$1 $2') // 全箇所の大文字列+4桁年にスペース挿入
    .replace(/-in-/, ' in ')
    .replace(/-day(\d+)/, ' Day$1')
    .replace(/-summer/, ' Summer');
  return '（' + label + '）';
}
```

JAG_TRANSLATIONS（文字列辞書方式）と異なり、埋め込みコンテスト名も含め全箇所の年にスペースを入れるため regex 方式を採用。`（）` 付与は `getAojContestLabel` と同じ規則に合わせる。

### priority

`AOJ_JAG`（priority 24）の末尾に追加 → **25**。既存値シフトなし。

### isAojContest

`regexForAojUniversity` を追加し、`addContestNameToTaskIndex` が AOJ 形式（`AOJ {index}（label）`）を使えるようにする。

### getTaskUrl の AOJ_UNIVERSITY 対応

`src/lib/utils/task.ts` の `AojGenerator.canHandle` が `AOJ-[A-Z]+PC\d{4}` パターンを未処理のため、AtCoder URL にフォールスルーしてしまう。`regexForAojUniversity` を `contest.ts` から export し、`AojGenerator.canHandle` で使用する。

AOJ University の問題 URL は他の AOJ コンテストと同形式：

```
${AOJ_TASKS_URL}/${taskId}   // 例: https://judge.u-aizu.ac.jp/onlinejudge/description.jsp?id=3058
```

### スコープ

| レイヤー    | 内容                                                                                  | 今回     |
| ----------- | ------------------------------------------------------------------------------------- | -------- |
| Layer 1     | prisma/schema.prisma                                                                  | ✅       |
| Layer 2     | ContestType 定数                                                                      | ✅       |
| Layer 3     | classifyContest / contestTypePriorities / getContestNameLabel / isAojContest + テスト | ✅       |
| Layer 3b    | getTaskUrl の AOJ_UNIVERSITY 対応（AojGenerator.canHandle + テスト）                  | ✅       |
| Layer 4     | Provider クラス（TDD）                                                                | ❌ 別 PR |
| Layer 5     | Group 登録                                                                            | ❌ 別 PR |
| seed データ | tasks.ts への全件追加                                                                 | ❌ 別 PR |

---

## 実装タスク

### Phase 1: Layer 1–2（Prisma スキーマ + 型定数）

**ファイル**: `prisma/schema.prisma`

`AOJ_JAG` 直後に追加：

```prisma
AOJ_UNIVERSITY // University Programming Contest (RUPC, HUPC, UAPC)
```

```bash
pnpm exec prisma generate
pnpm check  # src/lib/types/contest.ts で型エラーが出ることを確認
```

**ファイル**: `src/lib/types/contest.ts`

`AOJ_JAG` 直後に追加：

```typescript
AOJ_UNIVERSITY: 'AOJ_UNIVERSITY', // University Programming Contest (RUPC, HUPC, UAPC)
```

```bash
pnpm check  # エラー解消を確認
```

### Phase 2: Layer 3（TDD）

#### テスト先行（RED）

**`src/test/lib/utils/test_cases/contest_type.ts`** — `aojIcpc` の直後に追加：

```typescript
const aojUniversityContestData = [
  { name: 'AOJ, RUPC 2018 in ACPC 2018 Day1', contestId: 'AOJ-RUPC2018-in-ACPC2018-day1' },
  { name: 'AOJ, HUPC 2020 in HUPC 2020 Day1', contestId: 'AOJ-HUPC2020-in-HUPC2020-day1' },
  { name: 'AOJ, UAPC 2019 in RUPC 2019 Day2', contestId: 'AOJ-UAPC2019-in-RUPC2019-day2' },
  { name: 'AOJ, UAPC 2003', contestId: 'AOJ-UAPC2003' },
  { name: 'AOJ, UAPC 2011 Summer', contestId: 'AOJ-UAPC2011-summer' },
  { name: 'AOJ, UAPC 2012 Day1', contestId: 'AOJ-UAPC2012-day1' },
];

export const aojUniversity = aojUniversityContestData.map(({ name, contestId }) =>
  createTestCaseForContestType(name)({
    contestId,
    expected: ContestType.AOJ_UNIVERSITY,
  }),
);
```

**`src/test/lib/utils/test_cases/contest_name_labels.ts`** — `aojIcpc` の直後に追加（`expected` は `（）` 込み）：

```typescript
export const aojUniversity = [
  createTestCaseForContestNameLabel('AOJ, RUPC 2018 in ACPC 2018 Day1')({
    contestId: 'AOJ-RUPC2018-in-ACPC2018-day1',
    expected: '（RUPC 2018 in ACPC 2018 Day1）',
  }),
  createTestCaseForContestNameLabel('AOJ, HUPC 2020 in HUPC 2020 Day1')({
    contestId: 'AOJ-HUPC2020-in-HUPC2020-day1',
    expected: '（HUPC 2020 in HUPC 2020 Day1）',
  }),
  createTestCaseForContestNameLabel('AOJ, UAPC 2019 in RUPC 2019 Day2')({
    contestId: 'AOJ-UAPC2019-in-RUPC2019-day2',
    expected: '（ACPC 2019 in RUPC 2019 Day2）',
  }),
  createTestCaseForContestNameLabel('AOJ, UAPC 2003')({
    contestId: 'AOJ-UAPC2003',
    expected: '（ACPC 2003）',
  }),
  createTestCaseForContestNameLabel('AOJ, UAPC 2011 Summer')({
    contestId: 'AOJ-UAPC2011-summer',
    expected: '（ACPC 2011 Summer）',
  }),
  createTestCaseForContestNameLabel('AOJ, UAPC 2012 Day1')({
    contestId: 'AOJ-UAPC2012-day1',
    expected: '（ACPC 2012 Day1）',
  }),
];
```

**`src/test/lib/utils/contest.test.ts`** — `describe('AOJ', ...)` ブロック内の 3 箇所（classify / priority / label）に `when contest_id means AOJ University (RUPC, HUPC, UAPC)` describe を追加。

```bash
pnpm test:unit src/test/lib/utils/contest.test.ts  # RED 確認
```

#### 実装（GREEN）

**`src/lib/utils/contest.ts`** に以下を追加・変更：

1. ファイル先頭（`regexForJag` 直後）— **export に変更**：

   ```typescript
   export const regexForAojUniversity = /^AOJ-[A-Z]+PC\d{4}/;
   ```

2. `classifyContest` — `regexForJag` ブランチの直後：

   ```typescript
   if (regexForAojUniversity.test(contest_id)) {
     return ContestType.AOJ_UNIVERSITY;
   }
   ```

3. `contestTypePriorities` — `[ContestType.AOJ_JAG, 24]` の直後：

   ```typescript
   [ContestType.AOJ_UNIVERSITY, 25],
   ```

   JSDoc の数値範囲コメントも更新。

4. 新関数（`JAG_TRANSLATIONS` の近くに追加、`（）` 付き）：

   ```typescript
   function getAojUniversityContestLabel(contestId: string): string {
     const label = contestId
       .replace(/^AOJ-/, '')
       .replace(/UAPC/g, 'ACPC')
       .replace(/([A-Z]{2,})(\d{4})/g, '$1 $2')
       .replace(/-in-/, ' in ')
       .replace(/-day(\d+)/, ' Day$1')
       .replace(/-summer/, ' Summer');
     return '（' + label + '）';
   }
   ```

5. `getContestNameLabel` — `regexForJag` ブランチの直後：

   ```typescript
   if (regexForAojUniversity.test(contestId)) {
     return getAojUniversityContestLabel(contestId);
   }
   ```

6. `isAojContest` に追加：
   ```typescript
   regexForAojUniversity.test(contestId);
   ```

```bash
pnpm test:unit src/test/lib/utils/contest.test.ts  # GREEN 確認
```

### Phase 3: Layer 3b（getTaskUrl の AOJ_UNIVERSITY 対応、TDD）

#### テスト先行（RED）

**`src/test/lib/utils/test_cases/task_url.ts`** — `aojIcpc` の直後に追加：

```typescript
// AOJ University contests: contest ID = AOJ-{NAME}PC{YEAR}[-...], task ID = numeric problem ID
const aojUniversityContests = [
  { contestId: 'AOJ-RUPC2018-in-ACPC2018-day1', tasks: ['2856', '2857'] },
  { contestId: 'AOJ-UAPC2019-in-RUPC2019-day2', tasks: ['3058', '3059'] },
];

export const aojUniversity = aojUniversityContests.flatMap((contest) =>
  contest.tasks.map((task) => {
    return createTestCaseForTaskUrl(`AOJ University, ${contest.contestId} ${task}`)({
      contestId: contest.contestId,
      taskId: task,
      expected: `${AOJ_TASKS_URL}/${task}`,
    });
  }),
);
```

**`src/test/lib/utils/task.test.ts`** — `aojIcpc` の describe の直後に追加：

```typescript
describe('when contest ids and task ids for AOJ University (RUPC, HUPC, UAPC) are given', () => {
  TestCasesForTaskUrl.aojUniversity.forEach(({ name, value }) => {
    runTests(`${name}`, [value], ({ contestId, taskId, expected }: TestCaseForTaskUrl) => {
      expect(getTaskUrl(contestId, taskId)).toBe(expected);
    });
  });
});
```

```bash
pnpm test:unit src/test/lib/utils/task.test.ts  # RED 確認
```

#### 実装（GREEN）

**`src/lib/utils/task.ts`**:

1. import に `regexForAojUniversity` を追加：

   ```typescript
   import {
     getPrefixForAojCourses,
     getContestPriority,
     regexForAojUniversity,
   } from '$lib/utils/contest';
   ```

2. `AojGenerator.canHandle` に条件追加：
   ```typescript
   canHandle(contestId: string): boolean {
     return (
       getPrefixForAojCourses().includes(contestId) ||
       contestId.startsWith('PCK') ||
       contestId.startsWith('JAG') ||
       contestId.startsWith('ICPC') ||
       regexForAojUniversity.test(contestId)
     );
   }
   ```

```bash
pnpm test:unit src/test/lib/utils/task.test.ts  # GREEN 確認
```

### Phase 4: 最終確認

```bash
pnpm test:unit   # 全テスト GREEN
pnpm check       # 型エラーなし
pnpm lint        # lint クリーン
```

---

## コミット方針

| #   | 対象レイヤー | 内容                               |
| --- | ------------ | ---------------------------------- |
| 1   | Layer 1–2    | prisma schema + ContestType 定数   |
| 2   | Layer 3 + 3b | テスト + contest.ts / task.ts 実装 |

---

## 未決・後続タスク

- seed データ（JSON 3 ファイル計約 635 件）の tasks.ts への追加 → 別 PR
- Layer 4: `aoj_university_provider.ts` Provider クラス → 別 PR
- Layer 5: `contest_table_provider_groups.ts` へのグループ登録 → 別 PR
- `addContestNameToTaskIndex` の表示品質確認（`（）` 付きラベル + isAojContest=true の組み合わせ）→ Provider 追加時に対処
