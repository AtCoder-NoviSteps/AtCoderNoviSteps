# 解法別タブ「全カテゴリ」ビューの修正

## Overview

CodeRabbit レビュー指摘に基づく 3 つの修正：

1. **[重大バグ]** null カテゴリの SOLUTION 問題集が「全カテゴリ」ビューから消える
   - `getSolutionCategoryMapByWorkbookId` が `solutionCategory: { not: null }` でフィルター → null 問題集がマップから除外
   - グルーピング時に表示されない（regressionリスク：ユーザーが問題集を見失う）

2. **[A11y]** カテゴリ見出しが `<div>` → スクリーンリーダーが階層を認識できない

3. **[テスト不備]** E2E テストが URL のみ検証 → UI 実装の breakage を検出できない

## Design Rationale

### Phase A: ロール別フィルタリングの分離

null → PENDING 正規化をサービス層で行い、ロール制御をコンポーネント層で明示的に実装。理由：

- サービス層は DB 状態の正規化に専念（ビジネスロジック）
- UI層でロールに基づくフィルタリング（プレゼンテーション）
- 複雑な三項演算子を utils 関数へ切り出し + 単体テスト化

### Phase B: セマンティック HTML

`<div class="text-2xl ...">` → `<h2 class="text-2xl ...">` で視覚と意味を一致。
クラスは保持（既存スタイル継続）。

### Phase C: E2E 検証強化

URL 変更 + UI 描画の両方を検証。グルーピング表示が壊れた時点でテストが失敗するように。

---

## Rejected Alternatives

### 1. `getAvailableSolutionCategories` でも null 対応する

❌ 不採用理由：

- `availableCategories` はボタンリストの生成用（UI フィルター）
- サービス側で 2 つの異なる役割を持つ関数に分散すると保守性低下
- null カテゴリがそもそも rare ケース

### 2. PENDING グループを SvelteKit load() で除外する

❌ 不採用理由：

- `+page.server.ts` が UI の判断（role ベース表示）を決定 → 責任混合
- コンポーネント内で明示的な方が intent が読みやすい

### 3. groupBySolutionCategory に role パラメータを追加

❌ 不採点理由：

- groupBySolutionCategory は純粋なグルーピング関数
- ロール制御は呼び出し側の責務（関数の単一責任原則）
- 新関数 `filterGroupsByRole` で分離した方が合成可能

---

## Implementation Phases

### Phase 1: サービス層 - null 正規化（低リスク）

**対象:** `src/features/workbooks/services/workbooks.ts` L152–176

**変更内容:**

- WHERE 句から `solutionCategory: { not: null }` を削除
- `.filter()` 冗長チェックを削除
- `.map()` で `placement.solutionCategory ?? SolutionCategory.PENDING` に正規化

**テスト:** `workbooks.test.ts` L347–391

- 既存アサーション `solutionCategory: { not: null }` を削除
- テストケース追加：null カテゴリ → PENDING に正規化される

**実行時間:** 〜2分
**リスク:** 低（論理的には WHERE 句なしでも同じデータを返す）

---

### Phase 2: Utils - ロールフィルタリング関数（中リスク）

**対象:** `src/features/workbooks/utils/solution_category_group.ts`

**新関数:**

```typescript
/**
 * Filters workbook groups based on user role.
 * Non-admin users do not see PENDING (unclassified) groups.
 */
export function filterGroupsByRole(groups: WorkbookGroup[], role: Roles): WorkbookGroup[] {
  if (role === Roles.ADMIN) {
    return groups;
  }

  return groups.filter((group) => group.category !== SolutionCategory.PENDING);
}
```

**インポート:**

```typescript
import type { Roles } from '$lib/types/user';
```

**テスト:** `solution_category_group.test.ts` に追加

- 管理者：全グループ返す
- 一般ユーザー：PENDING グループを除外
- 空リスト入力での動作

**実行時間:** 〜2分
**リスク:** 低（新規追加、既存関数未変更）

---

### Phase 3: コンポーネント層 - UI 統合（中リスク）

**対象:**

- `src/features/workbooks/components/list/SolutionWorkBookList.svelte` L98, L113
- `src/features/workbooks/components/list/SolutionWorkBookList.svelte` L71–75（グルーピング）

**変更内容:**

1. 見出しを `<h2>` に変更（L98, L113）

```svelte
<!-- Before -->
<div class="text-2xl pb-4 dark:text-white">{SOLUTION_LABELS[group.category]}</div>

<!-- After -->
<h2 class="text-2xl pb-4 dark:text-white">{SOLUTION_LABELS[group.category]}</h2>
```

2. グルーピング後に role フィルター適用（L71–75）

```svelte
let groupedWorkbooks = $derived<WorkbookGroup[] | null>(
  currentCategory === ALL_SOLUTION_CATEGORIES
    ? filterGroupsByRole(
        groupBySolutionCategory(workbooks, solutionCategoryMap),
        role,
      )
    : null,
);
```

**実行時間:** 〜2分
**リスク:** 中（グルーピング表示ロジック変更、role prop 参照）

---

### Phase 4: E2E テスト - UI 検証追加（低リスク）

**対象:** `e2e/workbooks_list.spec.ts` L175–185

**変更内容:**
既存の URL アサーションの後に UI 検証を追加

```typescript
// Existing assertions (preserved)
await expect(page).toHaveURL(new RegExp(`tab=${TAB_SOLUTION}`), { timeout: TIMEOUT });
await expect(page).not.toHaveURL(/categories=/, { timeout: TIMEOUT });

// New: Verify category sections render
await expect(page.getByRole('heading', { name: 'グラフ' })).toBeVisible({ timeout: TIMEOUT });
```

**理由:**

- テスト名「clicking All button shows category-grouped sections」と実装を一致させる
- `<h2>` 化後に role selector が機能する
- 既存の「PENDING non-visible」テスト（L187–192）も引き続き通る（role フィルターにより）

**実行時間:** 〜1分
**リスク:** 低（アサーション追加のみ）

---

## Verification

```bash
# Unit: サービス + utils
pnpm test:unit -- workbooks.test.ts solution_category_group.test.ts

# Type check
pnpm check

# E2E （オプション、環境依存）
pnpm test:e2e -- workbooks_list.spec.ts
```

**期待:**

- すべてのテストが通る
- グルーピング表示：管理者のみ PENDING 見える、一般ユーザーは見えない
- 見出しが `<h2>` で accessibility audit が通る
