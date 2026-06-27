# AWC0101OnwardsProvider 追加計画

関連 issue: [#3691](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3691)

## 概要 (Overview)

AWC (AtCoder Weekday Contest) は現在2つのプロバイダーを持つ:

- `AWC0001To0099Provider`: ラウンド 1-99 (各5問 A-E)
- `AWC0100Provider`: ラウンド 100 のみ (特別版 15問 A-O)

AWC 0101 以降のコンテストが開始されるため、新しいプロバイダー `AWC0101OnwardsProvider` を追加する。

- 形式: AWC0001To0099 と同じ (5問 A-E、同じ displayConfig)
- 範囲: 101 〜 (内部フィルター上限 9999 = 4桁形式の最大値、ARC104Onwards の `<= 999` と同様)
- 既存の `AWC0001Onwards` グループに追加 (グループ表示ラベルは現行のまま `AWC 0001 〜`)
- シードデータはダミー (name, title 以外は規則的なため)

## 設計判断 (Design rationale)

- **既存パターンの踏襲**: `AWC0001To0099Provider` とフィルター/メタデータ/displayConfig が同一構造。新しい `ContestType` enum は不要 (`ContestType.AWC` を共有)。
- **プロバイダーキーの一意性**: 同一 `ContestType.AWC` の3プロバイダーが同じ `ContestTableProviderGroup` に登録されるため、各プロバイダーは一意なキーが必要。`AWC0100Provider` が `section='0100'` でキー `AWC::0100` を持つのと同様に、新プロバイダーは `section='0101To9999'` を指定しキー `AWC::0101To9999` とする。省略するとキーが `AWC` となり `AWC0001To0099Provider` と衝突し、`addProvider` の Map で上書きされる。
- **フィルター境界**: `101 <= round <= 9999`。round 100 は `AWC0100Provider` の exact-match で処理されるため重複なし。
- **displayConfig 明示オーバーライド**: base class デフォルト (`w-1/2 xs:w-1/3 sm:w-1/4 md:w-1/5 lg:w-1/6 px-1 py-1`) と AWC 固有値 (`w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 px-1 py-1`) が異なるため、明示的に返す。

## 却下した代替案 (Rejected alternatives)

- **新しい ContestType enum の追加**: AWC として分類・表示が同一のため不要。over-engineering。
- **グループラベルの変更 (例: `AWC 0001 〜 9999`)**: ユーザー指定で現行のまま (`AWC 0001 〜`) を維持。
- **AWC0001To0099Provider のレンジを 1-9999 に拡張して統合**: 既存の境界/テストを壊し、将来 0101+ で表示形式を変えたくなった際の拡張性を損なう。分離を維持。

## 変更ファイル一覧

| レイヤー | ファイル                                                                  | 変更内容                      |
| -------- | ------------------------------------------------------------------------- | ----------------------------- |
| fixtures | `src/features/tasks/fixtures/contest-table/contest_table_provider.ts`     | テスト用フィクスチャ追加      |
| services | `src/features/tasks/utils/contest-table/awc_provider.test.ts`             | ユニットテスト追加            |
| services | `src/features/tasks/utils/contest-table/awc_provider.ts`                  | `AWC0101OnwardsProvider` 追加 |
| services | `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts` | グループ登録 + import         |
| services | `.../contest_table_provider_groups.test.ts`                               | グループテスト更新            |
| prisma   | `prisma/tasks.ts`                                                         | ダミーシードデータ追加        |

バレルエクスポート `src/features/tasks/utils/contest-table/contest_table_provider.ts` は `export * from './awc_provider'` のため新クラスは自動反映。

## 実装フェーズ (TDD順、低リスク → 高リスク)

### Phase 1: テストフィクスチャ

**ファイル:** `src/features/tasks/fixtures/contest-table/contest_table_provider.ts`

934行目末尾 (`taskResultsForAWC0100Provider` の直後) に追加。`createContestTasks()` を使い、awc0101, awc0102, awc9999 (境界値) の3コンテスト × 5問 = 15件。`taskResultsForAWC0101OnwardsProvider` としてエクスポート。

参照パターン: 839-881行目 (`taskResultsForAWC0001To0099Provider`)。

### Phase 2: プロバイダーテスト (RED)

**ファイル:** `src/features/tasks/utils/contest-table/awc_provider.test.ts`

`AWC0101OnwardsProvider` の import 追加 + `taskResultsForAWC0101OnwardsProvider` の import 追加。`describe('AWC0101OnwardsProvider', ...)` ブロックを既存 `AWC0100Provider` describe の後 (170行目以降) に追加:

- 範囲フィルター (101-9999 のみ通過)
- 範囲外除外 (0001-0099, 0100 を除外)
- メタデータ (title: `AtCoder Weekday Contest 0101 〜 ` (末尾スペース), abbreviationName: `awc0101Onwards`)
- displayConfig (AWC0001To0099 と同一)
- ラウンドラベル (`AWC ` を除去 → `0101`, `0102`, `9999`)
- テーブル生成 (各コンテスト 5問 A-E)
- 空入力処理

### Phase 3: プロバイダー実装 (GREEN)

**ファイル:** `src/features/tasks/utils/contest-table/awc_provider.ts`

`AWC0100Provider` の後 (81行目以降) に追加:

```typescript
// AWC0101 onwards (2026/06/29 〜 )
// 5 tasks per contest. Upper bound 9999 = max of 4-digit format (cf. ARC104Onwards uses <= 999).
export class AWC0101OnwardsProvider extends ContestTableProviderBase {
  constructor(contestType: ContestType) {
    super(contestType, '0101To9999'); // provider key = 'AWC::0101To9999'
  }

  protected setFilterCondition(): (taskResult: TaskResult) => boolean {
    return (taskResult: TaskResult) => {
      if (classifyContest(taskResult.contest_id) !== this.contestType) {
        return false;
      }
      const contestRound = parseContestRound(taskResult.contest_id, 'awc');
      return contestRound >= 101 && contestRound <= 9999;
    };
  }

  getMetadata(): ContestTableMetaData {
    return {
      title: 'AtCoder Weekday Contest 0101 〜 ', // open-ended (Onwards), trailing space matches ARC104Onwards
      abbreviationName: 'awc0101Onwards',
    };
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

既存インポート (`classifyContest`, `getContestNameLabel`, `parseContestRound`, 各 type) はそのまま利用、追加 import 不要。

### Phase 4: グループ登録 + グループテスト更新

**ファイル:** `contest_table_provider_groups.ts`

- 18行目の import に `AWC0101OnwardsProvider` 追加
- `AWC0001Onwards` プリセット (152-158行目) に新プロバイダーを**最初**に追加 (新しい範囲が先):

```typescript
AWC0001Onwards: () =>
  new ContestTableProviderGroup(`AWC 0001 Onwards`, {
    buttonLabel: 'AWC 0001 〜 ',
    ariaLabel: 'Filter contests from AWC 0001 onwards',
  })
    .addProvider(new AWC0101OnwardsProvider(ContestType.AWC)) // key: AWC::0101To9999
    .addProvider(new AWC0100Provider(ContestType.AWC))         // key: AWC::0100
    .addProvider(new AWC0001To0099Provider(ContestType.AWC)),  // key: AWC
```

**ファイル:** `contest_table_provider_groups.test.ts`

- import に `AWC0101OnwardsProvider` 追加
- `AWC0001Onwards` プリセットテスト (181-192行目) を更新:
  - `getSize()` を `3` に (旧 `2`)
  - `getProvider(ContestType.AWC, '0101To9999')` の `toBeInstanceOf(AWC0101OnwardsProvider)` 追加
- `presets are functions` テストは変更不要 (`AWC0001Onwards` は既存)

### Phase 5: ダミーシードデータ

**ファイル:** `prisma/tasks.ts`

`awc0100_o` (8461行目付近) の直後に awc0101 の5問 (A-E) を追加。既存エントリと同形式:

```typescript
{ id: 'awc0101_a', contest_id: 'awc0101', problem_index: 'A', name: 'Dummy A', title: 'A. Dummy A' },
{ id: 'awc0101_b', contest_id: 'awc0101', problem_index: 'B', name: 'Dummy B', title: 'B. Dummy B' },
{ id: 'awc0101_c', contest_id: 'awc0101', problem_index: 'C', name: 'Dummy C', title: 'C. Dummy C' },
{ id: 'awc0101_d', contest_id: 'awc0101', problem_index: 'D', name: 'Dummy D', title: 'D. Dummy D' },
{ id: 'awc0101_e', contest_id: 'awc0101', problem_index: 'E', name: 'Dummy E', title: 'E. Dummy E' },
```

実コンテスト開催後に name/title を実データへ差し替え。

## 注意事項

- **キー衝突回避** (最重要): section パラメータ `'0101To9999'` は constructor と group test で完全一致が必要。省略するとキー `AWC` で `AWC0001To0099Provider` を上書き。
- **フィルター境界**: `101 <= round <= 9999`。round 100 は `AWC0100Provider` の exact-match で処理済み、重複なし。
- **displayConfig**: base class デフォルトと異なるため明示オーバーライド必須。

## 検証

```bash
pnpm test:unit -- awc_provider
pnpm test:unit -- contest_table_provider_groups
pnpm format
```
