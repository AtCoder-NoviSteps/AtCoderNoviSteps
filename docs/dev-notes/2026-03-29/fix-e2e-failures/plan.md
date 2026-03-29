# E2E テスト失敗修正プラン

## 概要

`feature/atcoder-verified-voting` ブランチで 6 件の E2E テストが失敗している。
根本原因を調査済み。各テストの原因と最小修正を記録する。

## 設計方針

- テストの意図を変えない範囲で最小限の修正にとどめる
- サーバー側のリダイレクト挙動の変更は別 Issue 扱い（スコープ外）
- DB 状態に依存するテストは DB 確認を先行する

## 却下した代替案

- `votes.spec.ts:143` のサーバー側修正（`validateAdminAccess` の非 admin リダイレクト先を変更）: 今回はスコープ外。テスト側で吸収する
- `sitemap.spec.ts:17` の `paramValues` 対応（vote task ID 一覧を渡す）: 維持コストが高く、`excludeRoutePatterns` で十分

---

## 失敗原因と修正方針

### Phase 1: `custom_colors.spec.ts:60`

**原因**: TailwindCSS v4 のメディアクエリ構文変更。

- 旧: `@media(min-width:26.25rem)`
- 実際の出力: `@media (width>=26.25rem)`

**修正**: `e2e/custom_colors.spec.ts` の正規表現を更新する。

```typescript
// Before
expect(allCss).toMatch(/@media\(min-width:26\.25rem\)/);
// After
expect(allCss).toMatch(/@media\s*\(width>=26\.25rem\)/);
```

### Phase 2: `sitemap.spec.ts:17`

**原因**: `super-sitemap` は動的ルートが `paramValues` にも `excludeRoutePatterns` にもない場合に例外を投げて 500 を返す。`/votes/[slug]` ルートが追加されたが未対応。

**修正**: `src/routes/sitemap.xml/+server.ts` の `excludeRoutePatterns` に追加する。

```typescript
'/votes/\\[slug\\]',
```

### Phase 3: `votes.spec.ts:80` と `votes.spec.ts:99`

**原因**: 未ログイン時に navbar も `ログイン` / `アカウント作成` / `グレード投票` リンクを持つため strict mode 違反。

- `getByRole('link', { name: 'ログイン' })` → navbar + ページ本文で 2 件ヒット
- `getByRole('link', { name: 'グレード投票' })` → navbar + パンくずで 2 件ヒット

**修正**: `e2e/votes.spec.ts` のロケーターをコンテンツ領域に限定する。

```typescript
// votes.spec.ts:80 — ページ本文の .container に限定
const voteSection = page.locator('.container');
await expect(voteSection.getByRole('link', { name: 'ログイン' })).toBeVisible(...);
await expect(voteSection.getByRole('link', { name: 'アカウント作成' })).toBeVisible(...);

// votes.spec.ts:99 — パンくず nav に限定
await page.locator('nav').getByRole('link', { name: 'グレード投票' }).click();
```

### Phase 4: `votes.spec.ts:143`

**原因**: リダイレクトチェーン。

`/vote_management` → 307 → `/login` → 303 → `/`

`initializeAuthForm` がログイン済みユーザーを `/` に転送するため、最終 URL は `/login` ではなく `/`。

**修正**: テストの期待 URL を `/` に変更する。

```typescript
await expect(page).toHaveURL('/', { timeout: TIMEOUT });
```

### Phase 5: `user_edit.spec.ts:24`

**原因**: `aria-selected="false"` — AtCoder タブがデフォルトで開いている。`shouldOpenAtCoderTab=true` の状態。

考えられる原因: DB の guest ユーザーに AtCoder アカウントレコードが残存している（マイグレーション `20260328002556_split_atcoder_account` が旧データを移行した可能性）。

**確認手順**:

```bash
pnpm exec prisma db execute --stdin <<< \
  "SELECT * FROM atcoder_account WHERE \"userId\" = '2';"
```

- レコードあり → `pnpm db:seed` で再シード
- レコードなし → Flowbite `$bindable` + single selection の reactivity 問題として別途調査

---

## 対象ファイル

| ファイル                            | 修正内容                                             |
| ----------------------------------- | ---------------------------------------------------- |
| `e2e/custom_colors.spec.ts`         | xs breakpoint の正規表現修正                         |
| `e2e/votes.spec.ts`                 | strict mode 回避 (ロケーター絞り込み)、期待 URL 修正 |
| `src/routes/sitemap.xml/+server.ts` | `/votes/[slug]` を excludeRoutePatterns に追加       |
| `e2e/user_edit.spec.ts`             | DB 状態確認後に対応                                  |

## 検証

```bash
pnpm test:e2e
```

## CodeRabbit Findings

（実装完了後に追記）
