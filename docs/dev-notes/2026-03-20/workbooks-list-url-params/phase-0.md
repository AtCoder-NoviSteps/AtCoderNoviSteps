# Phase 0: `WorkBookTab` 型の統一

**レイヤー:** `src/features/workbooks/types/` | **リスク:** 極低

order ページで定義されている `ActiveTab = 'solution' | 'curriculum'` と、新たに必要な `WorkBookTab` は同一の型。feature types に一元定義し、order ページは再エクスポートに変更する。

---

## Task 0-A: `WorkBookTab` 型を feature types に追加

**Files:**

- Modify: `src/features/workbooks/types/workbook.ts`

- [ ] **Step 1: ファイル末尾に追加**

```typescript
/** /workbooks ページの URL パラメータ `?tab=` に対応する有効値 */
export type WorkBookTab = 'curriculum' | 'solution';

/** URLパラメータがない場合のデフォルトタブ */
export const DEFAULT_WORKBOOK_TAB: WorkBookTab = 'curriculum';
```

- [ ] **Step 2: 型チェック**

```bash
pnpm check
```

- [ ] **Step 3: コミット**

```bash
git add src/features/workbooks/types/workbook.ts
git commit -m "feat(workbooks/types): Add WorkBookTab type for URL param-driven tab"
```

---

## Task 0-B: order ページの `ActiveTab` を `WorkBookTab` の再エクスポートに変更

**Files:**

- Modify: `src/routes/(admin)/workbooks/order/_types/kanban.ts`

- [ ] **Step 1: `ActiveTab` の定義を再エクスポートに置き換え**

```typescript
// 変更前
export type ActiveTab = 'solution' | 'curriculum';

// 変更後
export type { WorkBookTab as ActiveTab } from '$features/workbooks/types/workbook';
```

- [ ] **Step 2: 型チェック（order ページの既存コードが壊れていないことを確認）**

```bash
pnpm check
```

- [ ] **Step 3: コミット**

```bash
git add src/routes/(admin)/workbooks/order/_types/kanban.ts
git commit -m "refactor(workbooks/order): Re-export ActiveTab from WorkBookTab feature type"
```
