# Phase 12: admin閲覧権限・URLフィルター状態保持・空状態表示

**リスク:** 低〜中 | **前提:** Phase 11 まで完了・全テスト通過済み

Phase 11 完了後に発見した3つの不足仕様を追加実装する。

---

## 背景

1. **admin非公開閲覧**: カリキュラム/解法別タブでは `isPublished: true` のみ取得しているため、adminでも非公開問題集が見えない
2. **フィルター状態リセット**: グレード/カテゴリボタン選択後に別ページへ遷移し、ナビリンクで `/workbooks` に戻るとデフォルト値にリセットされる
3. **空状態ヘッダー**: ユーザ作成タブでDB上の件数が0でもテーブルヘッダーが表示される

**確認済みの仕様:**

- 非公開バッジ: `PublicationStatusLabel` は `TitleTableBodyCell.svelte` に既存 — コンポーネント変更不要
- CREATED_BY_USER の `canRead`: adminが著者でない他ユーザーの非公開問題集は表示しない（現行動作を維持）
- URL復元: サイト内ナビリンク（パラメータなし `/workbooks`）への遷移のみが対象（ブラウザBack は既に動作中）

---

## Task 12-A: サービス層 — adminに非公開問題集を返す

**対象レイヤー:** service + route handler | **リスク:** 低

### 変更ファイル

- `src/features/workbooks/services/workbooks.ts`
- `src/routes/workbooks/+page.server.ts`

### テスト（先行実装）

ファイル: `src/features/workbooks/services/workbooks.test.ts`

- [ ] DBをモックして CURRICULUM placement に非公開問題集を返すように設定
- [ ] `getWorkbooksByPlacement(query, false)` → 非公開を除外することを確認
- [ ] `getWorkbooksByPlacement(query, true)` → 非公開を含むことを確認

### 実装

**`workbooks.ts`** — `getPublishedWorkbooksByPlacement()` を `getWorkbooksByPlacement()` にリネームし、省略可能な `includeUnpublished` 引数を追加：

```typescript
export async function getWorkbooksByPlacement(
  query: PlacementQuery,
  includeUnpublished = false,
): Promise<WorkbooksWithAuthors>;
```

Prisma `where` の変更：

```typescript
where: {
  workBookType: query.workBookType,
  ...(includeUnpublished ? {} : { isPublished: true }),
  placement: placementFilter,
},
```

**`+page.server.ts`** — import を `getWorkbooksByPlacement` に更新し、`fetchWorkbooksByTab()` に `includeUnpublished: boolean` 引数を追加、`load()` から admin フラグを渡す：

```typescript
const adminUser = loggedInUser && isAdmin(loggedInUser.role as Roles);
fetchWorkbooksByTab(tab, selectedGrade, selectedCategory, !!adminUser);
```

### 動作確認

- `pnpm test:unit` でサービステストが通ること
- adminでログインして非公開のカリキュラム/解法別問題集が「非公開」バッジつきで表示される（該当データがある場合）

---

## Task 12-B: 空状態 — ユーザ作成タブに EmptyWorkbookList を追加

**対象レイヤー:** component | **リスク:** 低

### 変更ファイル

- `src/features/workbooks/components/list/CreatedByUserTable.svelte`

### 実装

`CurriculumWorkBookList.svelte` と同じパターンで空チェックを追加する。

参照: `EmptyWorkbookList` は `src/features/workbooks/components/list/EmptyWorkbookList.svelte` に既存。

```svelte
{#if workbooks.length === 0}
  <EmptyWorkbookList />
{:else}
  <!-- existing table markup -->
{/if}
```

### 動作確認

- ユーザ作成タブで問題集が0件のとき「該当する問題集は見つかりませんでした。」が表示される

---

## Task 12-C: sessionStorageによるURLフィルター状態保持

**対象レイヤー:** page component（クライアントサイドのみ） | **リスク:** 中

### 変更ファイル

- `src/routes/workbooks/+page.svelte`
- `e2e/workbooks_list.spec.ts`

### 実装

`+page.svelte` の `<script>` ブロックに追記（`goto` と `buildWorkbooksUrl` は既にインポート済み）：

```typescript
import { onMount } from 'svelte';

const WORKBOOKS_URL_KEY = 'workbooks-last-url';

// Restore saved URL when navigating back via nav link (no params present)
onMount(() => {
  if (window.location.search) {
    return;
  }
  const saved = sessionStorage.getItem(WORKBOOKS_URL_KEY);
  if (saved) {
    goto(saved, { replaceState: true });
  }
});

// Save current URL whenever filters change
$effect(() => {
  const url = buildWorkbooksUrl(data.tab, data.selectedGrade, data.selectedCategory);
  sessionStorage.setItem(WORKBOOKS_URL_KEY, url);
});
```

`$effect` は `data.tab` / `data.selectedGrade` / `data.selectedCategory` に依存し、フィルター変更のたびに保存する。

### テスト (E2E)

ファイル: `e2e/workbooks_list.spec.ts`

- [ ] ログイン済みユーザで `/workbooks?tab=solution&categories=GRAPH` に遷移
- [ ] `/` など別ページへ移動
- [ ] ナビリンクで `/workbooks` へ戻る
- [ ] URLが `?tab=solution&categories=GRAPH` を含むことを確認

### 動作確認

- グレード/カテゴリ選択後にヘッダーナビから別ページへ → 「問題集」ナビリンクで戻る → 選択状態が復元される

---

## 実装順序

1. **12-A** (TDD): テスト → サービス → route handler
2. **12-B**: `CreatedByUserTable.svelte` に空チェック追加
3. **12-C**: `+page.svelte` に sessionStorage 追加 → E2E テスト追加

## 全体確認コマンド

```bash
pnpm test:unit   # 12-A のサービステストが通ること
pnpm check       # 型エラーなし
pnpm test:e2e    # 12-C の URL 復元テストが通ること
```

---

## 微修正: WorkBookList のボタン折り返し・スタイル統一

**対象レイヤー:** component | **リスク:** 最低

### 変更ファイル

- `src/features/workbooks/components/list/SolutionWorkBookList.svelte`
- `src/features/workbooks/components/list/CurriculumWorkBookList.svelte`

### 背景

1. 狭い画面で `ButtonGroup` 内のボタンが折り返せず縦に潰れる
2. `ButtonGroup` 除去後に `color` prop を指定しなかったため Flowbite のデフォルト（塗りつぶし）が適用され視認性が最悪になった
3. カリキュラムのボタン余白が `TaskTable.svelte` と比べて大きく野暮ったかった

### 実装（`TaskTable.svelte:194-207` のパターンに統一）

両コンポーネントの `ButtonGroup` import とラッパーを除去し、`<div class="flex flex-wrap gap-1">` に置き換え。

各 `Button` に付与したプロパティ:

| prop / class                              | 役割                                  | 両コンポーネント共通             |
| ----------------------------------------- | ------------------------------------- | -------------------------------- |
| `color="alternative"`                     | outlined スタイル（塗りつぶしを防ぐ） | 共通                             |
| `size="sm"`                               | 余白をコンパクトに                    | CurriculumのみTaskTable に揃える |
| `rounded-lg`                              | 角丸                                  | 共通                             |
| `dark:text-white`                         | ダークモード基本色                    | 共通                             |
| `text-primary-700 dark:text-primary-500!` | アクティブ状態の強調色                | 共通                             |

`CurriculumWorkBookList` は外側の `flex items-center space-x-4`（TooltipWrapper との横並び）はそのまま維持し、内側の `ButtonGroup` のみ置き換える。

### 動作確認

- 狭い画面幅でボタンが左に折り返すことを確認
- ボタンが outlined スタイル（塗りつぶしなし）で表示されることを確認
- `pnpm check` で今回の変更ファイルにエラーなし（`login`/`signup` の `AuthForm` 型エラーは既存の未解決問題）
