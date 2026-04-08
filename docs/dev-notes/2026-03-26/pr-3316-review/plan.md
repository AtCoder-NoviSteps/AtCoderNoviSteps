# PR #3316 マージ後修正 実装計画

> Task 1-9（Phases 1-4）は git commits を参照。すべてのルール追加（Phase 7）は既に `.claude/rules/` に反映済み。
> Phase 5 Task 10: Steps 1-3（セレクタ修正）・`navigateToFirstVoteDetailPage` 早期 return 骨格は実装済み。以下は残課題（revised）。

---

## Phase 5: E2E テスト修正

### Task 10 (revised): votes.spec.ts 修正

**Root cause（診断済み）:**

1. **検索未入力バグ**: `votes/+page.svelte` は `search === ''` のときタスク行を描画しない。
   `navigateToFirstVoteDetailPage` が検索ボックスに入力せずに `firstLink.isVisible()` を呼ぶため常に `false` → 早期 `return` → Test 5, 6, 8, 9, 10 がタイムアウト。Test 7 は `not.toBeAttached()` が `/votes` 上でも即座に成功するため偶然パス。
2. **パンくずセレクタ不一致**: Test 8 は `グレード投票` でリンクを探すが `[slug]/+page.svelte:37` の実際のテキストは `投票`。

**Files:**

- Modify: `e2e/votes.spec.ts`

#### Step 1: `navigateToFirstVoteDetailPage` に検索入力を追加

```typescript
const KNOWN_TASK_ID = 'abc422_a'; // From prisma/tasks.ts seed data

async function navigateToFirstVoteDetailPage(page: Page): Promise<void> {
  await page.goto(VOTES_LIST_URL);
  await expect(page.getByRole('columnheader', { name: '問題名' })).toBeVisible({
    timeout: TIMEOUT,
  });

  // Fill search to render task rows (table body is empty until search !== '')
  const searchInput = page.getByPlaceholder('問題名・問題ID・出典で検索');
  await searchInput.fill(KNOWN_TASK_ID);

  const firstLink = page.locator('table').getByRole('link').first();
  const hasTask = await firstLink.isVisible();

  if (!hasTask) {
    return; // No matching tasks in DB — callers must call test.skip
  }

  await firstLink.click();
  await expect(page).toHaveURL(/\/votes\/.+/, { timeout: TIMEOUT });
}
```

#### Step 2: 直接URL遷移定数を追加 + テスト割り当て

```typescript
const KNOWN_VOTE_DETAIL_URL = '/votes/abc422_a'; // From prisma/tasks.ts seed data
```

| アプローチ                                      | 対象テスト                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 検索+クリック (`navigateToFirstVoteDetailPage`) | `can view the task detail page without redirect` (unauthenticated) — リスト→詳細遷移フロー自体を検証 |
| 直接URL (`page.goto(KNOWN_VOTE_DETAIL_URL)`)    | それ以外のコンテンツ検証系テスト                                                                     |

#### Step 3: `test.skip` 追加 + パンくずセレクタ修正

- `navigateToFirstVoteDetailPage` 使用テストに `test.skip(!onDetailPage, 'no matching tasks in DB')` を追加
- Test 8 パンくず: `グレード投票` → `投票`

#### Step 4: テスト実行・コミット

```bash
pnpm test:e2e -- votes
git add e2e/votes.spec.ts
git commit -m "fix: repair vote detail E2E tests broken by search-first UI and stale selectors"
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
