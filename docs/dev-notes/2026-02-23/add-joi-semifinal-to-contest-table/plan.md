# JOI セミファイナルステージ (joi2026sf) 対応

## Context

Issue #3152: JOI 2025/2026 より「本選」のコンテスト ID のサフィックスが `ho` から `sf` に変更された（例: `joi2026sf`）。`prisma/tasks.ts` にはすでに `joi2026sf` の6問（A〜F）が追加済み。既存の `JOISemiFinalRoundProvider` は `joi{YYYY}ho` のみを対象としており、`joi2026sf` が表示されない状態。これを修正する。

## 方針まとめ

- **表示テーブル**: 既存「JOI 本選」テーブルに統合（`JOISemiFinalRoundProvider` を拡張）
- **`getJoiContestLabel('joi2026sf')` 戻り値**: `"JOI セミファイナルステージ 2026"`
- **`getContestRoundLabel('joi2026sf')` 戻り値**: `"2026"`（テーブル行ラベル）

---

## 完了済み変更

### `src/lib/utils/contest.ts`

- `regexForJoi` に `sf` を追加（`yo|ho|sc|sp` → `yo|ho|sc|sp|sf`）
- `addJoiDivisionNameIfNeeds()` に `sf` → `'セミファイナルステージ'` の分岐追加

### `src/features/tasks/utils/contest-table/joi_providers.ts`

- `regexForJoiSemiFinalRound` を `(ho|sf)` にマッチするよう変更
- `getContestRoundLabel()` で `sf` の場合は `.replace('JOI セミファイナルステージ ', '')` で年を取り出す

### `src/features/tasks/utils/contest-table/joi_providers.test.ts`

- `joi2026sf` のフィルタリング・ラウンドラベル・テーブル生成テストを追加（全 259 tests passed）

---

## 残タスク

### `src/test/lib/utils/test_cases/contest_name_and_task_index.ts`

`getJoiContestLabel('joi2026sf')` → `"JOI セミファイナルステージ 2026"` のテストケースを追加:

```typescript
joi2026sf: {
  contestId: 'joi2026sf',
  // expected: `${getJoiContestLabel('joi2026sf')} - {taskIndex}`
  // → "JOI セミファイナルステージ 2026 - A" のようになる
},
```

### 検証

```bash
pnpm test:unit src/test/lib/utils/
```

---

## 教訓

- **`getContestRoundLabel()` の prefix 依存に注意**: 既存の `ho` サフィックスは `getJoiContestLabel()` が `"JOI 本選 YYYY"` を返すため `.replace('JOI 本選 ', '')` でラベルを取り出せる。新サフィックス `sf` では `getJoiContestLabel()` が `"JOI セミファイナルステージ YYYY"` を返すので prefix が異なる。
- **同一テーブルへの統合でも `getContestRoundLabel()` のロジック分岐が発生しうる**: 表示名を統一しても、ラベル生成ロジックがサフィックスごとに異なる場合はプロバイダー内で個別ハンドリングが必要。
- **`regexForJoi` の division グループへの追加で分類・ラベル両方が動く**: `classifyContest()` は `startsWith('joi')` のため追加不要だが、`getJoiContestLabel()` 用の regex と `addJoiDivisionNameIfNeeds()` は両方セットで更新が必要。
- **`src/test/lib/utils/` の JOI テストデータも忘れず更新**: Provider テストとは別に `contest_name_and_task_index.ts` にも JOI の `getJoiContestLabel()` テストケースがある。新サフィックスを追加した際は必ずこちらも更新する。テストケース追加は既存の `joi{YYYY}ho` エントリと同じ構造（`contestId` + `tasks` 配列）を踏襲するだけでよい。
