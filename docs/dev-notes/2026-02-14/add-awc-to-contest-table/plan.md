# Plan: AtCoder Weekday Contest (AWC) テーブル追加

## Context

Issue [#3153](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3153) の対応。新しいコンテストシリーズ「AtCoder Weekday Contest」のテーブルを追加する。パターン1（範囲フィルタ型）で、ARC104Onwards / AGC001Onwards と同じ構造。

**仕様**:

- ContestType: `AWC`（新規）
- contest_id: `awc0001`, `awc0002`, ...（awc + 4桁数字）
- 範囲: awc0001〜（上限なし）
- セクション: A〜E（5問/回）
- タイトル: "AtCoder Weekday Contest"

## 実装手順

### Step 1: Prisma スキーマに `AWC` 追加

**File**: [prisma/schema.prisma](prisma/schema.prisma)

`ContestType` enum に `AWC` を追加（`AGC_LIKE` の次）。

```
pnpm exec prisma migrate dev --name add_awc_to_contest_type
```

### Step 2: TypeScript 型更新

**File**: [src/lib/types/contest.ts](src/lib/types/contest.ts)

- `ContestType` オブジェクトに `AWC: 'AWC'` 追加（`AGC_LIKE` の次）
- `contestTypePriorities` に `[ContestType.AWC, 16]` 追加し、以降（UNIVERSITY 〜 AOJ_JAG）の優先度を +1 シフト:
  - UNIVERSITY: 16 → 17
  - FPS_24: 17 → 18
  - OTHERS: 18 → 19
  - AOJ_COURSES: 19 → 20
  - AOJ_PCK: 20 → 21
  - AOJ_JAG: 21 → 22

### Step 3: `classifyContest()` / `getContestNameLabel()` 更新

**File**: [src/lib/utils/contest.ts](src/lib/utils/contest.ts)

- `classifyContest()` に AWC パターン追加（L17付近、AGC の後）:
  ```typescript
  if (/^awc\d{4}$/.exec(contest_id)) {
    return ContestType.AWC;
  }
  ```
- `regexForAxc` の下に `regexForAwc = /^(awc)(\d{4})/i` 追加
- `getContestNameLabel()` に AWC 分岐追加（`regexForAxc` の後）:
  → `"awc0001"` → `"AWC 0001"`

#### 単体テスト

既存テストの構造に合わせて、3つのテストケースファイルに AWC を追加し、テスト本体にも describe ブロックを追加する。

**1. `classifyContest()` テスト**

- **File**: [src/test/lib/utils/test_cases/contest_type.ts](src/test/lib/utils/test_cases/contest_type.ts)
  - `awc` エクスポートを追加。テストケース:
    - `awc0001` → `ContestType.AWC`
    - `awc0002` → `ContestType.AWC`
    - `awc9999` → `ContestType.AWC`

- **File**: [src/test/lib/utils/contest.test.ts](src/test/lib/utils/contest.test.ts)
  - `classify contest > AtCoder` に `when contest_id contains awc` describe ブロック追加（`agc-like` の後）
  - `get contest priority > AtCoder` にも同様の describe ブロック追加

**2. `getContestNameLabel()` テスト**

- **File**: [src/test/lib/utils/test_cases/contest_name_labels.ts](src/test/lib/utils/test_cases/contest_name_labels.ts)
  - `awc` エクスポートを追加。テストケース:
    - `awc0001` → `"AWC 0001"`
    - `awc0002` → `"AWC 0002"`
    - `awc9999` → `"AWC 9999"`

- **File**: [src/test/lib/utils/contest.test.ts](src/test/lib/utils/contest.test.ts)
  - `get contest name label > AtCoder` に `when contest_id contains awc` describe ブロック追加

**3. `addContestNameToTaskIndex()` テスト**

- **File**: [src/test/lib/utils/test_cases/contest_name_and_task_index.ts](src/test/lib/utils/test_cases/contest_name_and_task_index.ts)
  - `awc` エクスポートを追加。テストケース:
    - `awc0001`, task `A` → `"AWC 0001 - A"`
    - `awc0001`, task `E` → `"AWC 0001 - E"`

- **File**: [src/test/lib/utils/contest.test.ts](src/test/lib/utils/contest.test.ts)
  - `add contest name to task index > AtCoder` に `when contest_id contains awc` describe ブロック追加

### Step 4: Provider クラス実装

**File**: [src/lib/utils/contest_table_provider.ts](src/lib/utils/contest_table_provider.ts)

`ABCLikeProvider`（L468）の後に `AWC0001OnwardsProvider` を追加。`ARC104OnwardsProvider`（L336-359）をテンプレートとして使用:

```typescript
export class AWC0001OnwardsProvider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }
      const contestRound = parseContestRound(taskResult.contest_id, 'awc');
      return contestRound >= 1 && contestRound <= 9999;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Weekday Contest 0001 〜 ',
      abbreviationName: 'awc0001Onwards',
    };
  }

  getContestRoundLabel(contestId: string): string {
    const contestNameLabel = getContestNameLabel(contestId);
    return contestNameLabel.replace('AWC ', '');
  }
}
```

- `getDisplayConfig()` はベースクラスのデフォルト（`isShownHeader: true`, `isShownRoundLabel: true`, `isShownTaskIndex: false`）をそのまま使用

### Step 5: プリセット登録

**File**: [src/lib/utils/contest_table_provider.ts](src/lib/utils/contest_table_provider.ts)

- `prepareContestProviderPresets()`（L1128）に追加:
  ```typescript
  AWC0001Onwards: () =>
    new ContestTableProviderGroup(`AWC 0001 Onwards`, {
      buttonLabel: 'AWC 0001 〜 ',
      ariaLabel: 'Filter contests from AWC 0001 onwards',
    }).addProvider(new AWC0001OnwardsProvider(ContestType.AWC)),
  ```
- `contestTableProviderGroups`（L1307）に追加:
  ```typescript
  awc0001Onwards: prepareContestProviderPresets().AWC0001Onwards(),
  ```

### Step 6: シードデータ追加

**File**: [prisma/tasks.ts](prisma/tasks.ts)

AWC のタスクデータを追加（実際の問題名は AtCoder Problems API から確認が必要）。

### Step 7: テスト実装

**Files**:

- [src/test/lib/utils/test_cases/contest_table_provider.ts](src/test/lib/utils/test_cases/contest_table_provider.ts) — モックデータ追加
- [src/test/lib/utils/contest_table_provider.test.ts](src/test/lib/utils/contest_table_provider.test.ts) — テストスイート追加

テスト内容:

1. フィルタリング検証（AWC のみ通過、他を除外）
2. メタデータ（title, abbreviationName）
3. ディスプレイ設定（isShownHeader, isShownRoundLabel, isShownTaskIndex）
4. ラウンドラベル（`"awc0001"` → `"0001"`）
5. テーブル構造生成（5問 A〜E）
6. 空入力ハンドリング
7. プリセットグループの検証

`classifyContest` モックに AWC 分岐を追加:

```typescript
} else if (/^awc\d{4}$/.test(contestId)) {
  return ContestType.AWC;
```

## 検証

```bash
pnpm exec prisma migrate dev --name add_awc_contest_type
pnpm test:unit src/test/lib/utils/contest_table_provider.test.ts
pnpm check
pnpm lint
pnpm format
```

## 実装完了後の教訓

### Step 3 までのフロー（Utility関数）

- `classifyContest()` → コンテスト文字列を認識（パターン照合）
- `getContestNameLabel()` → 表示用フォーマット（"awc0001" → "AWC 0001"）
- コンテスト型を優先度マップに登録 → 画面表示順を制御

**重要**: regex パターンの桁数に注意。AWC は `\d{4}` (4桁)、ARC/AGC は `\d{3}` (3桁) だが、分類ロジック (`classifyContest`) の順序が重要。前後の誤判定を避けるため、より特異度の高いパターン（4桁）を先に配置。

### Step 4-5 のフロー（Provider クラス + 登録）

- `ContestTableProviderBase` を拡張し `setFilterCondition()`・`getMetadata()`・`getContestRoundLabel()` 実装
- `prepareContestProviderPresets()` → Provider ファクトリ関数
- `contestTableProviderGroups` → 名前ごとにインスタンス化

**重要**: Provider クラスは `ABCLikeProvider` の直後に配置するのではなく、コンテスト系列ごとにグループ化するのが推奨。AWC はコンテスト系列なので、AGC や ARC の近くに配置。

### テスト戦略

Unit テスト（`contest.test.ts`）で基本分類を検証済みなので、Provider テストは省略可能。ただし、複雑な範囲フィルタを使う場合は Provider 単体テストを追加推奨。
