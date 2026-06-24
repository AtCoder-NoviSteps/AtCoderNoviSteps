# AWC0100 特別回 EDPC 形式テーブルプロバイダ追加

## 概要

AWC（AtCoder Weekday Contest）の特別回 AWC0100（A〜O 15 問構成）を、EDPC と同じ形式（ヘッダ非表示・ラウンドラベル非表示・タスク記号表示）で表示するためのプロバイダを追加する。既存の `AWC0001OnwardsProvider` は AWC0001〜0099 を対象とする `AWC0001To0099Provider` に rename する。

## 設計方針

### ContestType の再利用

`classifyContest` は `/^awc\d{4}$/` で `awc0100` を既存の `ContestType.AWC` に分類する。新しい ContestType の追加は不要。

### Provider key 衝突の回避

同一グループに `ContestType.AWC` を使う 2 つのプロバイダを追加するため、`AWC0100Provider` のコンストラクタで `super(contestType, '0100')` を呼び、provider key を `AWC::0100` とする。`AWC0001To0099Provider` は section なし（key = `AWC`）のため衝突しない。

### 表示順

`addProvider` の呼び出し順が表示順（先 = 上）になるため、AWC0100 を先に追加する。

### グループキー維持

`contestTableProviderGroups` の `awc0001Onwards` キーは変更しない（UI・store への波及を避けるため）。

## 却下した代替案

- **新 ContestType `AWC_0100` を追加する案**: Prisma スキーマ変更・`classifyContest` 更新・contest.ts 更新が必要で大掛かり。ContestType.AWC の再利用で section による区別が可能なため不採用。
- **AWC0100 を独立グループにする案**: ユーザー要件として「AWC グループに同居」が確定したため不採用。

## 変更ファイルと内容

### Layer 4 — Provider クラス（TDD）

#### `src/features/tasks/utils/contest-table/awc_provider.ts`

**AWC0001OnwardsProvider → AWC0001To0099Provider**

| 変更点             | 旧値                                 | 新値                                     |
| ------------------ | ------------------------------------ | ---------------------------------------- |
| クラス名           | `AWC0001OnwardsProvider`             | `AWC0001To0099Provider`                  |
| filter range       | `contestRound <= 9999`               | `contestRound <= 99`                     |
| `title`            | `'AtCoder Weekday Contest 0001 〜 '` | `'AtCoder Weekday Contest 0001 〜 0099'` |
| `abbreviationName` | `'awc0001Onwards'`                   | `'awc0001To0099'`                        |

**AWC0100Provider（新規追加）**

```typescript
// AWC0100 (special edition, 15 tasks: A-O)
export class AWC0100Provider extends ContestTableProviderBase {
  constructor(contestType: ContestType) {
    super(contestType, '0100'); // provider key = 'AWC::0100'
  }

  protected setFilterCondition() {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) return false;
      return taskResult.contest_id === 'awc0100';
    };
  }

  getMetadata() {
    return { title: 'AtCoder Weekday Contest 0100', abbreviationName: 'awc0100' };
  }

  getDisplayConfig() {
    return {
      isShownHeader: false,
      isShownRoundLabel: false,
      roundLabelWidth: '',
      tableBodyCellsWidth: 'w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 2xl:w-1/7 px-1 py-2',
      isShownTaskIndex: true,
    };
  }

  getContestRoundLabel(_contestId: string): string {
    return '';
  }
}
```

#### `src/features/tasks/fixtures/contest-table/contest_table_provider.ts`

- `taskResultsForAWC0001OnwardsProvider` → `taskResultsForAWC0001To0099Provider` に rename（中身は変更不要）
- `taskResultsForAWC0100Provider` を新規追加（awc0100 の A〜O 15 タスク）

#### `src/features/tasks/utils/contest-table/awc_provider.test.ts`

- import・describe・test 内の `AWC0001OnwardsProvider` → `AWC0001To0099Provider` に rename
- fixture 参照を `taskResultsForAWC0001To0099Provider` に変更
- range テスト: awc0099 が含まれること＋awc0100 が除外されること を追加
- metadata テスト: 新しい title / abbreviationName に更新
- `AWC0100Provider` の describe ブロックを新規追加:
  - awc0100 のみフィルタされること
  - awc0001/awc0099 が除外されること（結合 fixture を使用）
  - metadata（title / abbreviationName）
  - displayConfig（EDPC 形式の全フィールド）
  - getContestRoundLabel が空文字を返すこと
  - generateTable で 15 問（A〜O 順）が生成されること
  - 空入力の処理

### Layer 5 — グループ登録（TDD）

#### `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts`

```typescript
// import 変更
import { AWC0001To0099Provider, AWC0100Provider } from './awc_provider';

// preset 変更（AWC0001Onwards の preset 関数を更新）
AWC0001Onwards: () =>
  new ContestTableProviderGroup(`AWC 0001 Onwards`, {
    buttonLabel: 'AWC 0001 〜 ',
    ariaLabel: 'Filter contests from AWC 0001 onwards',
  })
    .addProvider(new AWC0100Provider(ContestType.AWC))        // AWC0100 を先（上）に表示
    .addProvider(new AWC0001To0099Provider(ContestType.AWC)), // AWC0001-0099 を後（下）に表示
```

`contestTableProviderGroups` のキー `awc0001Onwards` は変更しない。

#### `src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts`

AWC0001Onwards テストを更新:

```typescript
expect(group.getSize()).toBe(2); // 1 → 2
expect(group.getProvider(ContestType.AWC, '0100')).toBeInstanceOf(AWC0100Provider); // 新規
expect(group.getProvider(ContestType.AWC)).toBeInstanceOf(AWC0001To0099Provider); // 更新
```

## 変更不要なファイル

| ファイル                          | 理由                                   |
| --------------------------------- | -------------------------------------- |
| `prisma/schema.prisma`            | ContestType.AWC を再利用               |
| `src/lib/types/contest.ts`        | 同上                                   |
| `src/lib/utils/contest.ts`        | awc0100 は既存 regex で AWC に分類済み |
| `contest_table_provider_base.ts`  | section サポート済み                   |
| `contest_table_provider_group.ts` | section ベースのキー解決サポート済み   |
| `active_contest_type.svelte.ts`   | awc0001Onwards キー維持のため変更不要  |
| シードデータ（`prisma/tasks.ts`） | 今回スコープ外（後日追加）             |

## 検証手順

```bash
# TDD サイクル（RED → GREEN）
pnpm test:unit -- awc_provider
pnpm test:unit -- contest_table_provider_groups

# 全 unit test
pnpm test:unit

# 型チェック・lint
pnpm check
pnpm lint
```

### 期待される動作

- `getProvider(ContestType.AWC)` → `AWC0001To0099Provider`（round 1〜99）
- `getProvider(ContestType.AWC, '0100')` → `AWC0100Provider`（AWC0100 特別回）
- AWC グループのフィルタボタンを押すと AWC0100 テーブル（A〜O）が AWC0001〜0099 テーブルの上に表示される
