# Phase 1: `splitWorkbooksByReplenishment()` ユーティリティ

**レイヤー:** `src/features/workbooks/utils/` | **リスク:** 極低（純粋関数）

サーバー側でグレードフィルタリングを行った後、クライアント側では `isReplenished` による分割のみが必要になる。現在 `CurriculumWorkBookList.svelte` に inline で書かれているフィルタを純粋関数として抽出する。

---

## Task 1-A: 失敗するテストを書く

**Files:**

- Modify: `src/features/workbooks/utils/workbooks.test.ts`

- [ ] **Step 1: テストを追記**

```typescript
import { splitWorkbooksByReplenishment } from './workbooks';
// 既存 import に追加

describe('splitWorkbooksByReplenishment', () => {
  const base = {
    id: 1,
    title: '',
    workBookType: 'CURRICULUM' as const,
    isPublished: true,
    isOfficial: true,
    authorId: 'u1',
    authorName: 'u1',
    description: '',
    editorialUrl: '',
    urlSlug: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    workBookTasks: [],
  };

  test('main contains non-replenished workbooks', () => {
    const main = { ...base, id: 1, isReplenished: false };
    const replenished = { ...base, id: 2, isReplenished: true };
    const result = splitWorkbooksByReplenishment([main, replenished]);
    expect(result.main).toEqual([main]);
  });

  test('replenished contains replenished workbooks', () => {
    const main = { ...base, id: 1, isReplenished: false };
    const replenished = { ...base, id: 2, isReplenished: true };
    const result = splitWorkbooksByReplenishment([main, replenished]);
    expect(result.replenished).toEqual([replenished]);
  });

  test('empty input returns empty arrays', () => {
    const result = splitWorkbooksByReplenishment([]);
    expect(result.main).toEqual([]);
    expect(result.replenished).toEqual([]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
pnpm test:unit -- workbooks.test
# FAIL: splitWorkbooksByReplenishment is not a function
```

---

## Task 1-B: 実装

**Files:**

- Modify: `src/features/workbooks/utils/workbooks.ts`

- [ ] **Step 1: 関数を追加（既存エクスポートの末尾）**

```typescript
/**
 * Splits workbooks into main and replenished groups.
 *
 * @param workbooks - Full list to split
 * @returns Object with `main` (isReplenished=false) and `replenished` (isReplenished=true) arrays
 */
export function splitWorkbooksByReplenishment(workbooks: WorkbooksList): {
  main: WorkbooksList;
  replenished: WorkbooksList;
} {
  return {
    main: workbooks.filter((workbook) => !workbook.isReplenished),
    replenished: workbooks.filter((workbook) => workbook.isReplenished),
  };
}
```

- [ ] **Step 2: テストが通ることを確認**

```bash
pnpm test:unit -- workbooks.test
# PASS
```

- [ ] **Step 3: コミット**

```bash
git add src/features/workbooks/utils/workbooks.ts \
        src/features/workbooks/utils/workbooks.test.ts
git commit -m "feat(workbooks/utils): Add splitWorkbooksByReplenishment utility"
```
