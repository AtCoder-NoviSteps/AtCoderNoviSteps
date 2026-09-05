# AWC0151OnwardsProvider 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AWC0151 以降（上限なし）の通常回（5問 A-E）用 Provider を追加し、AWC0150 の seed を実問題名に更新する

**Architecture:** パターン1（範囲フィルタ型）。`AWC0101To0149Provider` と同じ表示設定をそのまま使い、`contestRound >= 151` でフィルタ。AWC グループの最上位に登録（AWC0150 の上）。

**Closes:** #3993

---

## 変更対象ファイル

| ファイル                                                                       | 変更内容                                        |
| ------------------------------------------------------------------------------ | ----------------------------------------------- |
| `prisma/tasks.ts`                                                              | AWC0150 seed → 実問題名 + AWC0151 ダミー5件追加 |
| `src/features/tasks/fixtures/contest-table/contest_table_provider.ts`          | AWC0151 フィクスチャ追加                        |
| `src/features/tasks/utils/contest-table/awc_provider.ts`                       | `AWC0151OnwardsProvider` 追加                   |
| `src/features/tasks/utils/contest-table/awc_provider.test.ts`                  | テスト追加                                      |
| `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts`      | グループ登録                                    |
| `src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts` | size 4→5、instanceof 追加                       |
| `docs/guides/how-to-add-contest-table-provider.md`                             | リファレンステーブル + 最終更新日               |

## 設計根拠

- **上限なし**: `ABC319OnwardsProvider` と同パターン。次の特別回（AWC0200 等）で分割すればよい
- **却下**: `AWC0151To0199` 固定範囲 — 上限不明なので Onwards が適切

---

## Task 1: seed データ更新

- [ ] `prisma/tasks.ts:8358-8461` — AWC0150 の `name`/`title` を添付 `awc0150.json` の実問題名に差し替え（`id`/`contest_id`/`problem_index` は変更なし）
- [ ] AWC0150 ブロックの直前に AWC0151 ダミー 5 件（A-E）追加。フォーマットは既存の `Dummy Problem X` パターン準拠

## Task 2: フィクスチャ追加

- [ ] `contest_table_provider.ts` に AWC0151・0152 の 2 コンテスト分フィクスチャ追加。`taskResultsForAWC0151OnwardsProvider` として export

```typescript
const [awc0151_a, ...] = createContestTasks('awc0151', [
  { taskTableIndex: 'A', statusName: AC },
  { taskTableIndex: 'B', statusName: AC },
  { taskTableIndex: 'C', statusName: AC_WITH_EDITORIAL },
  { taskTableIndex: 'D', statusName: TRYING },
  { taskTableIndex: 'E', statusName: PENDING },
]);
// awc0152 も同様に 5 件
```

## Task 3: Provider テスト → 実装 (TDD)

### テスト（`awc_provider.test.ts`）

`AWC0150Provider` describe の**前**に追加:

```typescript
describe('AWC0151OnwardsProvider', () => {
  // フィルタ: awc0151, awc0152 を含み awc0150, awc0149 を除外
  // metadata: title='AtCoder Weekday Contest 0151 〜', abbreviationName='awc0151Onwards'
  // displayConfig: AWC0101To0149Provider と同一（header/roundLabel 表示、taskIndex 非表示）
  // roundLabel: 'awc0151' → '0151', 'awc0200' → '0200'
  // generateTable: 各コンテスト 5 問 (A-E)
  // empty: 空配列 → 空配列
});
```

### 実装（`awc_provider.ts`）

`AWC0150Provider` の**前**に追加:

```typescript
export class AWC0151OnwardsProvider extends ContestTableProviderBase {
  constructor(contestType: ContestType) {
    super(contestType, '0151Onwards');
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) return false;
      const contestRound = parseContestRound(taskResult.contest_id, 'awc');
      return contestRound >= 151;
    };
  }

  getMetadata(): ContestTableMetaData {
    return { title: 'AtCoder Weekday Contest 0151 〜', abbreviationName: 'awc0151Onwards' };
  }

  getDisplayConfig(): ContestTableDisplayConfig {
    return {
      isShownHeader: true,
      isShownRoundLabel: true,
      roundLabelWidth: 'xl:w-16',
      tableBodyCellsWidth: 'w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 px-1 py-1',
      isShownTaskIndex: false,
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('AWC ', '');
  }
}
```

## Task 4: グループ登録テスト → 実装 (TDD)

### テスト（`contest_table_provider_groups.test.ts`）

```typescript
// AWC0001Onwards テストを更新:
expect(group.getSize()).toBe(5); // 4 → 5
expect(group.getProvider(ContestType.AWC, '0151Onwards')).toBeInstanceOf(AWC0151OnwardsProvider);
// 既存の 0150, 0101To0149, 0100, default はそのまま
```

### 実装（`contest_table_provider_groups.ts`）

```typescript
AWC0001Onwards: () =>
  new ContestTableProviderGroup(...)
    .addProvider(new AWC0151OnwardsProvider(ContestType.AWC))  // ← 先頭に追加
    .addProvider(new AWC0150Provider(ContestType.AWC))
    .addProvider(new AWC0101To0149Provider(ContestType.AWC))
    .addProvider(new AWC0100Provider(ContestType.AWC))
    .addProvider(new AWC0001To0099Provider(ContestType.AWC)),
```

## Task 5: ドキュメント・フォーマット

- [ ] `how-to-add-contest-table-provider.md` — 範囲フィルタ型テーブルに `| AWC 0151- | 0151〜 | A〜E | - |` 追加、†注に `'0151Onwards'` 追加、最終更新日 → `2026-09-05`
- [ ] `pnpm format && pnpm lint && pnpm test:unit`
