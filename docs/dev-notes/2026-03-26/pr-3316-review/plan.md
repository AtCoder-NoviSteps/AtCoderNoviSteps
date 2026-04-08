# PR #3316 マージ後修正 実装計画

> Task 1-9（Phases 1-4）は git commits を参照。すべてのルール追加（Phase 7）は既に `.claude/rules/` に反映済み。

---

## Phase 5: E2E テスト修正

### Task 10: votes.spec.ts セレクタ修正 + 初期状態対応

**Files:**

- Modify: `e2e/votes.spec.ts`

現在の誤ったセレクタと正しい値の対応:

| 現在の値                                                 | 正しい値                       | 理由                                                  |
| -------------------------------------------------------- | ------------------------------ | ----------------------------------------------------- |
| `getByRole('heading', { name: 'グレード投票' })`         | `'投票'`                       | `votes/+page.svelte` の `<HeadingOne title="投票" />` |
| `getByRole('columnheader', { name: '問題' })`            | `'問題名'`                     | `<TableHeadCell>問題名</TableHeadCell>`               |
| `getByRole('columnheader', { name: 'コンテスト' })`      | `'出典'`                       | `<TableHeadCell>出典</TableHeadCell>`                 |
| `getByPlaceholder('問題名・問題ID・コンテストIDで検索')` | `'問題名・問題ID・出典で検索'` | `<Input placeholder="問題名・問題ID・出典で検索">`    |

- [ ] **Step 1: heading セレクタを修正（2箇所: lines 17, 36）**

```typescript
// 変更前
await expect(page.getByRole('heading', { name: 'グレード投票' })).toBeVisible(...)

// 変更後
await expect(page.getByRole('heading', { name: '投票' })).toBeVisible(...)
```

- [ ] **Step 2: columnheader セレクタを修正（3箇所: lines 24, 27, 65）**

```typescript
// 変更前
await expect(page.getByRole('columnheader', { name: '問題' })).toBeVisible(...)
await expect(page.getByRole('columnheader', { name: 'コンテスト' })).toBeVisible(...)

// 変更後
await expect(page.getByRole('columnheader', { name: '問題名' })).toBeVisible(...)
await expect(page.getByRole('columnheader', { name: '出典' })).toBeVisible(...)
```

- [ ] **Step 3: placeholder セレクタを修正（line 43）**

```typescript
// 変更前
const searchInput = page.getByPlaceholder('問題名・問題ID・コンテストIDで検索');

// 変更後
const searchInput = page.getByPlaceholder('問題名・問題ID・出典で検索');
```

- [ ] **Step 4: navigateToFirstVoteDetailPage に初期状態スキップを追加**

`navigateToFirstVoteDetailPage` でタスクが存在しない場合にテストをスキップする:

```typescript
async function navigateToFirstVoteDetailPage(page: Page): Promise<void> {
  await page.goto(VOTES_LIST_URL);
  await expect(page.getByRole('columnheader', { name: '問題名' })).toBeVisible({
    timeout: TIMEOUT,
  });

  const firstLink = page.locator('table').getByRole('link').first();
  const hasTask = await firstLink.isVisible();
  if (!hasTask) {
    // No tasks in DB — skip navigation-dependent tests.
    return;
  }

  await firstLink.click();
  await expect(page).toHaveURL(/\/votes\/.+/, { timeout: TIMEOUT });
}
```

また、`navigateToFirstVoteDetailPage` を使う各テストに `test.skip` 条件を追加:

```typescript
test('can view the task detail page without redirect', async ({ page }) => {
  await navigateToFirstVoteDetailPage(page);
  const onDetailPage = page.url().match(/\/votes\/.+/);
  test.skip(!onDetailPage, 'no tasks available in DB');
  // ...
});
```

- [ ] **Step 5: E2E テスト実行（ローカル環境で確認）**

```bash
pnpm test:e2e -- votes
```

Expected: セレクタ起因の FAIL がなくなる

- [ ] **Step 6: コミット**

```bash
git add e2e/votes.spec.ts
git commit -m "fix: correct stale selectors in votes E2E tests and add initial state skip conditions"
```

---

## 検証方法

```bash
# 単体テスト（全件）
pnpm test:unit

# 型チェック
pnpm check

# lint
pnpm lint

# E2E テスト（votes 関連）
pnpm test:e2e -- votes

# フォーマット（コミット前）
pnpm format
```

### 動作確認チェックリスト

- [ ] `AtCoderVerificationForm`: 文字列生成ボタン押下中に Spinner が表示され、二重送信不可
- [ ] `AtCoderVerificationForm`: クリップボードアイコンクリック後にチェックマークアニメーション表示
- [ ] `AtCoderVerificationForm`: 「本人確認」と「リセット」ボタン間に適切な隙間
- [ ] `VotableGrade`: グレードを連打しても最後のリクエストのみ処理される
- [ ] `votes/[slug]`: 投票閾値ツールチップが定数参照（`MIN_VOTES_FOR_STATISTICS`）に基づいて表示
- [ ] vote_management: 存在しない taskId で `setTaskGrade` を呼んでも 500 ではなく `{ success: false }` が返る
- [ ] DB: `VotedGradeCounter.count` に負の値を INSERT しようとすると CHECK 制約違反エラー
