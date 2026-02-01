# 計画: ACLBeginnerProvider と ACLProvider を追加 (#3120)

## 概要

既存の `ACLPracticeProvider` グループの下に `ACLBeginnerProvider` と `ACLProvider` を追加し、ACL Beginner Contest と ACL Contest 1 に対応させる。

## 変更内容

### 1. `src/lib/utils/contest_table_provider.ts` に Provider クラスを追加

**ACLPracticeProvider の位置**: 770行目以降に、以下の 2 つのクラスを順に追加：

- `ACLBeginnerProvider` (ContestType.ABC_LIKE、contest_id: 'abl')
- `ACLProvider` (ContestType.ARC_LIKE、contest_id: 'acl1')

参考: [how-to-add-contest-table-provider.md - パターン2](../../guides/how-to-add-contest-table-provider.md#パターン2-単一ソース型edpc--tdpc--fps_24--acl_practice)

**主な設定**:

- 両者とも contest_id による文字列比較でフィルタリング
- getDisplayConfig: `tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-2'`
- getContestRoundLabel: 空文字列を返す
- 両者とも taskIndex を表示（isShownTaskIndex: true）

### 2. `prepareContestProviderPresets()` を更新（1214行目付近）

**変更前**:

```
AclPractice: () =>
  new ContestTableProviderGroup(`AtCoder Library Practice Contest`, {
    buttonLabel: 'ACL Practice',
    ariaLabel: 'Filter ACL Practice Contest',
  }).addProvider(new ACLPracticeProvider(ContestType.ACL_PRACTICE)),
```

**変更後**: `Acl` に名前変更し、3 つのプロバイダすべてを追加

```
Acl: () =>
  new ContestTableProviderGroup(`AtCoder Library Contests`, {
    buttonLabel: 'ACL',
    ariaLabel: 'Filter ACL Contests',
  }).addProviders(
    new ACLPracticeProvider(ContestType.ACL_PRACTICE),
    new ACLBeginnerProvider(ContestType.ABC_LIKE),
    new ACLProvider(ContestType.ARC_LIKE),
  ),
```

### 3. `contestTableProviderGroups` を更新（1250行目付近）

**変更前**:

```
aclPractice: prepareContestProviderPresets().AclPractice(),
```

**変更後**:

```
acl: prepareContestProviderPresets().Acl(),
```

### 4. `src/test/lib/utils/test_cases/contest_table_provider.ts` にテストデータを追加

`createContestTasks()` を使用してモックデータを作成：

- `taskResultsForACLBeginnerProvider`: contest_id 'abl' の 6 つのタスク（A～F）
- `taskResultsForACLProvider`: contest_id 'acl1' の 6 つのタスク（A～F）

（prisma/tasks.ts の既存タスク定義を使用）

### 5. `src/test/lib/utils/contest_table_provider.test.ts` にテストを追加

各新規プロバイダについて、以下の項目をカバーするテストを追加：

- getMetadata() の検証（title、abbreviationName）
- getDisplayConfig() の検証
- filter() の動作確認
- generateTable() のテーブル構造
- getContestRoundIds() と getHeaderIdsForTask()
- getContestRoundLabel() が空文字列を返すことを検証

---

## 参考資料

- 実装パターン: [how-to-add-contest-table-provider.md - パターン2](../../guides/how-to-add-contest-table-provider.md#パターン2-単一ソース型edpc--tdpc--fps_24--acl_practice)
- GitHub Issue: #3120
- prisma/tasks.ts の既存データ（abl: 6 問、acl1: 6 問）
