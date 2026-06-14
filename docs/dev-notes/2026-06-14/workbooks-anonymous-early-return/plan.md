# Phase 2：workbooks load の匿名早期 return

> 親プラン：[docs/dev-notes/2026-06-13/sveltekit-caching/plan.md](../../2026-06-13/sveltekit-caching/plan.md) の Phase 2。

## Context（なぜやるか）

Vercel の Function Duration / Fast Origin Transfer が直近で約1.5倍に増加。`/workbooks` の
load は**匿名アクセスでも重い問題集フェッチを毎回実行**している。一方
[+page.svelte:104-160](../../../../src/routes/workbooks/+page.svelte#L104-L160) のタブ中身は丸ごと
`{#if loggedInUser}` で囲まれており、**匿名ユーザーには何も表示されない**。

つまり匿名（bot / クローラー含む）に対し「取得してゼロ表示」のムダが発生している。
Phase 1（参照タスクのみ取得）完了後、匿名で残る重いフェッチは Promise.all 内の以下のみ：

- `fetchWorkbooksByTab` → `getWorkbooksByPlacement` / `getWorkBooksCreatedByUsers`（本番 ≈0.28–0.55 MB）
- `getAvailableSolutionCategories`（SOLUTION タブ）
- `getSolutionCategoryMapByWorkbookId`（SOLUTION ALL）

本 Phase はこれらを匿名時に丸ごとスキップする。**表示は不変**（匿名は従来どおり空ページ）。

## 方針（確定済み）

- **CDN キャッシュ（s-maxage）は付けない** — fetch スキップのみに限定。匿名 CDN キャッシュは
  problems 向け Phase 3 と同型で別途扱う。invocation は安価（$0.60）で早期 return により
  Duration は既に最小化されるため、本 Phase での追加価値は小さい。
- **匿名の挙動は現状維持** — 空ページを返す（`/login` リダイレクトはしない）。SEO 発見性と
  親プランの「行儀の良い bot を安く受け入れる」方針を維持するため。
- **テストは別チケット** — route load テストは repo に前例がなく、Phase 1 の残 TODO
  （`fetches only tasks referenced by displayed workbooks` の load 統合テスト）と同じ mock 基盤を
  要する。両者をまとめて別タスクで起票し、本 Phase は実装＋手動検証で完了とする。

## 変更内容

### 対象ファイル

- [src/routes/workbooks/+page.server.ts](../../../../src/routes/workbooks/+page.server.ts)（唯一の変更ファイル）

### 1. 匿名早期 return の追加

`selectedGrade` / `selectedCategory` をパースした直後（現 +page.server.ts:60 の後、`adminUser` 計算と try ブロックの前）に挿入する。

- `CREATED_BY_USER` リダイレクト（+page.server.ts:52-57）は**早期 return より前**のまま維持
  （匿名が `CREATED_BY_USER` タブに来たら従来どおり `/workbooks` へリダイレクト）。
- 返却 shape は**ログイン時と同じキーをすべて保持**し、値だけ空にする。
  `+page.svelte` の `$effect`（sessionStorage、`data.tab`/`selectedGrade`/`selectedCategory` を参照）と
  `$derived`（`data.workbooks` / 各 Map を参照）が壊れないため。

```typescript
// Phase 2: All tab content is gated by {#if loggedInUser}, so anonymous users
// render nothing. Skip the heavy workbook/category fetches and return a
// display-equivalent empty shape (keys preserved for the page's $effect/$derived).
if (!loggedInUser) {
  return {
    workbooks: [],
    availableCategories: [],
    solutionCategoryMap: new Map<number, SolutionCategory>(),
    tasksMapByIds: new Map(),
    taskResultsByTaskId: new Map(),
    loggedInUser: null,
    tab,
    selectedGrade,
    selectedCategory,
  };
}
```

### 2. 早期 return により冗長化したガードの除去（複雑度の削減）

早期 return 以降、`loggedInUser` は非 null が保証される。以下の null ガードは
**到達不能（dead）** になるため、可読性向上のため除去する（「ここで null になり得るか?」の曖昧さを消す）：

- +page.server.ts:73-75
  `loggedInUser ? getTaskResultsOnlyResultExists(loggedInUser.id, true) : Promise.resolve(new Map())`
  → `getTaskResultsOnlyResultExists(loggedInUser.id, true)`
- +page.server.ts:82
  `tab === WorkBookTab.CURRICULUM && loggedInUser ? buildTaskIdsFromWorkbooks(workbooks) : []`
  → `tab === WorkBookTab.CURRICULUM ? buildTaskIdsFromWorkbooks(workbooks) : []`
- `adminUser`（+page.server.ts:61）の `loggedInUser && isAdmin(...)` も `isAdmin(...)` に簡約可
  （`!!adminUser` は `adminUser` のままで可）。併せて +page.server.ts:78-80 付近の
  「非 CURRICULUM・匿名で空 Map」を説明するコメントも、匿名分岐が消えたため文面を更新する。

> 注：この除去は本 Phase の早期 return が直接生むクリーンアップであり、スコープ内。
> Phase 1 のロジック自体（参照タスク取得）は変えない。

## 検証（手動）

テスト自動化は別チケットのため、本 Phase はローカル手動検証で完了確認する。

1. `pnpm dev` で起動。
2. **匿名**（セッション cookie なし / シークレットウィンドウ）で `/workbooks` にアクセス：
   - 見出し `問題集` のみ表示・空タブ（エラーなし＝従来どおり）。
   - DevTools の SSR レスポンス（document）ペイロードが大幅に縮小していること（問題集データが載っていない）。
   - 一時ログ or ブレークポイントで `getWorkbooksByPlacement` / `getWorkBooksCreatedByUsers` /
     `getAvailableSolutionCategories` / `getSolutionCategoryMapByWorkbookId` が**呼ばれない**ことを確認。
3. **ログイン**で `/workbooks` の各タブ（CURRICULUM / SOLUTION / ユーザ作成）にアクセス：
   - 従来どおり問題集一覧・grade modes・解答状況が表示される（回帰なし）。
   - `?category=` 付き SOLUTION ALL でも `solutionCategoryMap` が機能する。
4. **匿名 + `?tab=created_by_user`**：`/workbooks` へリダイレクトされる（既存挙動の維持）。
5. `pnpm check`（型）と `pnpm lint` が通ること。`pnpm test:unit` が既存分グリーンであること。

## 残タスク（後続 TODO へ引き継ぎ）

- [ ] **route load 統合テスト基盤**を別チケットで起票し、Phase 1 残 TODO と統合：
  - `anonymous request skips heavy fetches`（service mock で匿名時の未呼び出しをアサート）
  - `fetches only tasks referenced by displayed workbooks`（Phase 1 残）
- [ ] 本番相当データ（問題集150件規模）で payload 再計測 → Phase 5 要否判断の材料に。
