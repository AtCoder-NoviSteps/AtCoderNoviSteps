# 既知のバグを修正

## 根本原因

### Bug 1: DBに保存されない（415 Unsupported Media Type）

`KanbanBoard.svelte` の `onDragEnd` が `Content-Type: application/json` で
`?/updatePlacements`（SvelteKit フォームアクション）に fetch している。
フォームアクションは `FormData` を期待するため 415 エラーになる。

### Bug 2: URLパラメータに解法別・カリキュラムの値が混在する

タブ切り替え時に相手方のパラメータをリセットしていないため、
`tab=curriculum&cols=PENDING,GRAPH&grades=Q10,Q9` のような状態になる。

---

## 修正方針

### Bug 1 の修正

**`+server.ts` を新規作成**（JSON API エンドポイント）

- `src/routes/(admin)/workbooks/order/+server.ts` を作成
- `POST` ハンドラで `request.json()` → Zod バリデーション → `upsertWorkBookPlacements()`
- 既存の CURRICULUM↔SOLUTION クロス移動チェックを移植
- `+page.server.ts` から `updatePlacements` アクションを削除

**`KanbanBoard.svelte` の fetch URL を修正**

```diff
- const res = await fetch('?/updatePlacements', {
+ const res = await fetch('/workbooks/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });
```

### Bug 2 の修正

タブ切り替え時に `updateUrl()` でパラメータをリセット：

- 解法別に切り替え → `grades` を削除
- カリキュラムに切り替え → `cols` を削除

---

## 実装手順（TDD）

### Step 1: E2E テスト作成（先に書く・最初は失敗する）

`tests/workbook_order.test.ts` を新規作成。`tests/signin.test.ts` の `login` ヘルパーを流用。

テストケース：

1. 同一カラム内ドラッグ → リロード → 順序が保持される
2. 異なるカラム間ドラッグ → リロード → 列が保持される
3. カリキュラムタブでドラッグ → リロード → 位置が保持される
4. 解法別→カリキュラム切り替え → URLに `cols` が含まれない
5. カリキュラム→解法別切り替え → URLに `grades` が含まれない

DB検証はリロード後のUI確認で代替（Playwright から直接DBアクセスはしない）。

### Step 2: `+server.ts` 新規作成

### Step 3: `+page.server.ts` から `updatePlacements` アクション削除

### Step 4: `KanbanBoard.svelte` 修正（fetch URL + タブ切り替えリセット）

### Step 5: E2E テストがパスすることを確認

---

## Future Tasks（別PR）

- `validateAdminAccess` を `_utils/auth.ts` などに共通化（現在 `+page.server.ts` と `+server.ts` で重複）
- `+page.server.ts` の `initializePlacements` をサービス層に移動
- KanbanBoard の CURRICULUM/SOLUTION 重複ロジックを DRY に
- テストに実際のシードデータを使用
- 管理メニューに「Workbook (Ordering)」リンク追加
- コメントを英語に統一
- URL クエリパラメータ `cols` を `categories` にリネーム（可読性改善）

詳細は [refactor.md](./refactor.md) を参照。

---

## Q&A: なぜ `+server.ts` を新規作成するのか

### Q1: `+page.server.ts` を使わない理由は？

SvelteKit のフォームアクション（`+page.server.ts` の `actions`）は内部で `request.formData()` を呼ぶ。
`Content-Type: application/json` のリクエストを送ると FormData としてパースできず 415 になる。

> Actions receive a RequestEvent and read data via request.formData()
>
> — [SvelteKit docs: Form actions](https://svelte.dev/docs/kit/form-actions)

### Q2: `+server.ts` は `+page.server.ts` とセキュリティ面で違いはある？

ない。どちらもサーバー上で実行され、`locals.auth.validate()` で同じ認証チェックができる。

> +server.ts files can be placed in the same directory as +page files, allowing you to share data-fetching logic
>
> — [SvelteKit docs: Routing - server](https://svelte.dev/docs/kit/routing#server)

### Q3: Superforms の `dataType: 'json'` で `+page.server.ts` を維持する案は？

技術的には可能だが、現在のクライアント側は素の `fetch()` で Superforms を使っていない。
ドラッグ&ドロップで生成される構造化データ（配列のネストされたオブジェクト）に
フォーム向けライブラリの Superforms を導入するのは過剰。

> By simply setting dataType to 'json', you can store any data structure allowed by devalue.
> This requires JavaScript to be enabled and the use:enhance directive applied to your form.
>
> — [Superforms docs: Nested data](https://superforms.rocks/concepts/nested-data)

### Q4: フォームアクションの fetch でリロードは発生する？

しない。`fetch()` を使っている限り FormData でも JSON でもリロードは起きない。
リロードが発生するのは `<form method="POST">` で HTML フォームをそのまま submit した場合のみ。

### まとめ

|                | `+page.server.ts` (フォームアクション) | `+server.ts` (API ルート) |
| -------------- | -------------------------------------- | ------------------------- |
| 想定用途       | HTML `<form>` 送信                     | `fetch()` での JSON 通信  |
| リクエスト解析 | `request.formData()`                   | `request.json()`          |
| JS無効で動作   | Yes                                    | No                        |

今回はフォームではなくドラッグ&ドロップ → `fetch(JSON)` なので、`+server.ts` が適切。

---
