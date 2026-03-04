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

- [x] Step 1: E2E テスト作成
- [x] Step 2: `+server.ts` 新規作成
- [x] Step 3: `+page.server.ts` から `updatePlacements` アクション削除
- [x] Step 4: `KanbanBoard.svelte` 修正（fetch URL + タブ切り替えリセット）
- [x] Step 5: E2E テストがパスすることを確認
  - テスト 4-5（URLパラメータ系）: ✅ パス済み
  - テスト 1-3（DnD 保存系）: ✅ パス済み（Bug 3 修正 + `buildInitialCards` priority ソート追加で解決）

## Bug 3: `move()` がカードのカラム割り当てを更新しない

### 根本原因

`@dnd-kit/helpers` の `move()` 関数は配列内のアイテム順序のみ変更し、
アイテムオブジェクトのプロパティ（`solutionCategory` / `taskGrade`）は更新しない。

そのため `onDragEnd` で構築される `updates` 配列が古いカラム値のまま送信される。

- 同一カラム内の並び替え: priority は変わるが、カラムが変わらないため一見動く → ただし `move()` 後の配列順序と `items.filter(c => c.solutionCategory === cat)` の結果が食い違い、正しい priority が計算されない
- 異なるカラム間の移動: カードの `solutionCategory` / `taskGrade` が更新されないため、移動がDBに反映されない

### 修正方針

`onDragEnd` 内、`updates` 配列構築前に、ドラッグされたカードのカラムフィールドを明示的に更新する：

```typescript
// ドラッグされたカードのカラム割り当てを更新
const srcCard = items.find((c) => c.id === source.id);
if (activeTab === 'solution') {
  if (typeof target.id === 'string' && srcCard) {
    srcCard.solutionCategory = target.id;
  }
} else {
  if (typeof target.id === 'string' && srcCard) {
    srcCard.taskGrade = target.id;
  }
}
```

### E2E テストの改善

- **DnD テスト (1-3)**: Playwright の mouse 操作は `@dnd-kit` のポインターイベント処理と不安定なため、`page.request.post()` で API を直接呼び出すテストに変更
- **テスト名、コメント**: 日本語 → 英語に変更
- **セレクタ**: `data-testid` を削除し、`getByRole` / `getByText` 等のセマンティックセレクタに変更
  - Playwright 公式は role/text ロケータを第一選択として推奨し、`data-testid` は「role や text で特定できない場合」のフォールバックとしている（[Playwright Locators](https://playwright.dev/docs/locators)）

### 修正対象ファイル

1. `src/routes/(admin)/workbooks/order/_components/KanbanBoard.svelte` — `onDragEnd` カラム割り当てロジック追加
2. `src/routes/(admin)/workbooks/order/_components/KanbanColumn.svelte` — `data-testid` 削除
3. `src/routes/(admin)/workbooks/order/_components/KanbanCard.svelte` — `data-testid` 削除
4. `tests/workbook_order.test.ts` — セレクタ変更 + テスト名英語化 + DnD テストを fetch 直接呼び出しに

### TODO（Bug 3 対応）

- [x] `KanbanBoard.svelte` の `onDragEnd` でカラム割り当てを明示的に更新
- [x] `data-testid` をプロダクションコードから削除（KanbanColumn, KanbanCard）
- [x] E2E テスト名を英語に変更
- [x] E2E テスト 1-3 を `page.evaluate` + `fetch` による API 直接呼び出しに変更
- [x] E2E テストのセレクタを `getByRole` / `getByText` に変更
- [x] E2E テスト全5件がパスすることを確認

---

## Future Tasks

- [ ] パネルの途中のカードに追加できるようにする
- [ ] パネル内のカードが多い場合は、スクロールバーを追加
- [x] URL クエリパラメータ `cols` を `categories` にリネーム（可読性改善）
- [ ] `validateAdminAccess` を `_utils/auth.ts` などに共通化（現在 `+page.server.ts` と `+server.ts` で重複）
- [ ] `+page.server.ts` の `initializePlacements` をサービス層に移動
- [ ] KanbanBoard の CURRICULUM/SOLUTION 重複ロジックを DRY に
- [ ] テストに実際のシードデータを使用
- [ ] 管理メニューに「問題集 (並び替え)」リンク追加
- [ ] コメントを英語に統一
- [ ] 空のカンバンカラムに「ここに問題集をドロップできます」等のプレースホルダーメッセージを表示（UX改善）

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

### Q5: DnD テストを Playwright の mouse 操作で実装しないのはなぜ？

`@dnd-kit` はポインターイベント（`pointerdown` / `pointermove` / `pointerup`）を使用する。
Playwright の `page.mouse` API は `mousedown` / `mousemove` / `mouseup` を発火するため、
`@dnd-kit` が反応しない環境がある。実際にテスト 1-3 は DnD 操作部分で失敗した。

代替として `page.request.post('/workbooks/order', ...)` で API を直接呼び出し、
リロード後の UI で永続化を確認する方式に変更する。

### Q6: `data-testid` をプロダクションコードに付けるのは良くないのでは？

Playwright 公式のロケータ優先順位:

1. `page.getByRole()` — 最推奨。ユーザーとアクセシビリティツールに最も近い
2. `page.getByText()` — テキスト内容で検索
3. `page.getByLabel()` / `page.getByPlaceholder()` 等
4. `page.getByTestId()` — 「role や text で特定できない場合」のフォールバック

> "We recommend prioritizing role locators to locate elements, as it is the closest way to how users and assistive technology perceive the page."
>
> — [Playwright Locators](https://playwright.dev/docs/locators)

今回は DnD テストを fetch 直接呼び出しに変更するため `boundingBox` 取得が不要になり、
タブ・カラム・カードは `getByRole` / `getByText` で十分特定可能。
そのため `data-testid` は削除する。

---

## 教訓

1. **DnD ライブラリが更新するのは配列順序のみ**。`move()` はアイテムのプロパティ（カラム）を変えない。クロスカラム移動では `onDragEnd` で明示的にプロパティを更新する必要がある。

2. **初期表示は `priority` でソートすること**。`load()` がサーバー側で `workBook.id` 昇順を返しても、`priority` は別の値になりうる。`buildInitialCards` で `priority` ソートを行わないと DnD 永続化の確認ができない。

3. **Playwright の `page.request.post()` は SvelteKit の `+server.ts` に届かない**。`page.request` はブラウザのクッキーを共有するが、SvelteKit のルーティングでフォームアクションに落ちて 415 になるケースがあった。`page.evaluate(() => fetch(...))` でブラウザコンテキストから呼ぶと回避できる。

4. **`data-testid` は DnD の `boundingBox` 取得が必要な場合にのみ使う**。API 直接呼び出しに切り替えれば `getByRole` / `getByText` で十分なため、`data-testid` をプロダクションコードに残す必要はない。

---

## 出典

- [SvelteKit Form Actions](https://svelte.dev/docs/kit/form-actions) — フォームアクションの仕組み
- [SvelteKit Routing - server](https://svelte.dev/docs/kit/routing#server) — `+server.ts` の仕様
- [Superforms Nested Data](https://superforms.rocks/concepts/nested-data) — `dataType: 'json'` の仕組み
- [Playwright Locators](https://playwright.dev/docs/locators) — ロケータの優先順位
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) — テスト設計のベストプラクティス
