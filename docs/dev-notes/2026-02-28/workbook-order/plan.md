# 実装メモ: 問題集の並び順管理 (Issue #943)

## Context

管理者が問題集（CURRICULUM / SOLUTION）の表示順序をカンバンボードで DnD 管理できるようにする。

**スコープ**: カンバン管理画面のみ。ユーザー向け `/workbooks` への表示順反映は別 Issue。

---

## 主要な設計判断

| 項目                           | 決定と理由                                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| DB 設計                        | `WorkBookPlacement` テーブルに `solutionCategory` / `taskGrade` / `priority` を集約（WorkBook 本体を汚さない）                     |
| XOR 制約                       | Zod refinement（API バリデーション）+ DB CHECK 制約（最終防壁）の多層防御。Prisma に `@@check` がないため migration.sql に手動追記 |
| CURRICULUM↔SOLUTION 間移動禁止 | `createDroppable` の `accept` プロパティ + サーバー側でも `workBookType` チェック（多重防御）                                      |
| priority 再計算                | 連番振り直し（1, 2, 3…）。Lexorank は管理者1人の本用途では YAGNI                                                                   |
| 保存タイミング                 | ドロップ時即時保存。楽観的更新 + 失敗時ロールバック + Toast                                                                        |
| 状態管理                       | URL パラメータ（`?tab=solution&categories=PENDING,GRAPH`）で管理。localStorage は SSR との hydration mismatch リスクあり           |
| 初期化トリガー                 | form action の POST で実行。`load()` 内で DB INSERT は HTTP セマンティクス違反（GET の副作用）                                     |
| API エンドポイント             | `+server.ts`（JSON API）。DnD は `fetch(JSON)` なので form action は不適（`request.formData()` を期待するため 415 になる）         |

---

## 非自明な実装上の決定

### ドロップ時 N+1 UPDATE（意図的選択）

`prisma.$transaction()` 内で最大200回の個別 `update` を発行するのは N+1 パターンだが、以下の理由で許容：

- PostgreSQL は PK インデックスヒットの単純 UPDATE を高速処理（200件で 50-200ms 程度）
- 行レベルロックのためブロックなし
- 管理者1人が数分に1回の操作 → DDoS とは性質が異なる
- Raw SQL は数千件以上のバルク操作でないと型安全性・保守性の犠牲に見合わない

**将来の閾値**: 500件超になったら `UPDATE ... SET priority = CASE WHEN ...` への切替を検討。

### `@@unique([taskGrade, priority])` を採用しない理由

`prisma.$transaction()` 内での順次 UPDATE は中間状態で UNIQUE 制約違反が発生する（PostgreSQL はトランザクション内でも各 SQL 文ごとに即時チェック）。管理者のみが操作するため同時実行が発生せず、DB レベルの複合ユニーク制約は不要。

### `load()` 内での DB INSERT はアンチパターン

GET リクエストで DB 書き込みはブラウザのプリフェッチやクローラーが意図しない初期化を引き起こす可能性がある。`initializePlacements` は form action（POST）で実行し、未配置の placement がある場合のみボタンを表示する。

### Prisma `@@check` は存在しない

XOR 制約は `prisma migrate dev --create-only` で migration ファイルを生成後、migration.sql に手動で CHECK 制約を追記して適用する。

### バルク操作の規模感

- 初期化: 約120件の `createMany`
- ドロップ時: `prisma.$transaction()` + 個別 update（最大200件）
- いずれも管理者専用で問題ない規模

---

## @dnd-kit/svelte 実装上の注意点

- **`onDragOver` で `move()` を呼ぶ必須**: `onDragEnd` のみだと `{#each}` の DOM と `OptimisticSortingPlugin` が不整合でフリーズ
- **object getter パターン必須**: `createSortable({ get id() { return placement.id }, get index() { return i } })` — 内部で `$effect.pre` を使うため、通常の値渡しは NG
- **`createSortable` はコンポーネントトップレベルで**: `{#each}` 内の `{@const}` で呼ぶとリアクティブ再評価でフリーズ
- **sortable `id` にプレフィックス禁止**: `move()` が `item.id === source.id` で照合するため
- **`use:action` 型の適合**: `attach(node)` の戻り値 `() => void` を `{ destroy: () => void }` にラップして Svelte アクション型に合わせる
- **`accept`（単数形）**: droppable の型フィルタは `accept`。`accepts` は存在しない
- **`@dnd-kit/dom` / `@dnd-kit/abstract` を devDependencies に追加**: `@dnd-kit/svelte` のイベントハンドラ型を正しく使うために必要
- **`move()` はカラム割り当てを更新しない**: 配列順序のみ変更。クロスカラム移動では `onDragEnd` で `solutionCategory` / `taskGrade` を明示的に更新する必要がある
- **初期表示は `priority` でソートすること**: `load()` が `workBook.id` 昇順を返しても `priority` は別の値になりうる。`buildInitialCards` で `priority` ソートを行わないと DnD 永続化の確認ができない

---

## 主要バグと対処方法

### Bug 1: DB に保存されない（415 Unsupported Media Type）

**原因**: `KanbanBoard.svelte` の `onDragEnd` が `Content-Type: application/json` でフォームアクション（`?/updatePlacements`）に fetch。フォームアクションは `request.formData()` を期待するため 415 エラー。

**対処**: `+server.ts` を新規作成し JSON API エンドポイントとして実装。fetch URL を `/workbooks/order` に変更。

### Bug 2: URL パラメータに解法別・カリキュラムの値が混在する

**原因**: タブ切り替え時に相手方のパラメータをリセットしていない。

**対処**: タブ切り替え時に `updateUrl()` で反対側のパラメータを削除（solution → `grades` 削除、curriculum → `categories` 削除）。

### Bug 3: `move()` がカードのカラム割り当てを更新しない

**原因**: `@dnd-kit/helpers` の `move()` は配列順序のみ変更し、`solutionCategory` / `taskGrade` プロパティを更新しない。`onDragEnd` での `updates` 構築時に古いカラム値のまま送信される。

**対処**: `onDragEnd` 内、`updates` 構築前にドラッグされたカードのカラムフィールドを明示的に更新する。

### Bug 4: Playwright の `page.request.post()` が `+server.ts` に届かない

**原因**: `page.request` はブラウザのクッキーを共有するが SvelteKit のルーティングでフォームアクションに落ちて 415 になるケースがある。

**対処**: `page.evaluate(() => fetch(...))` でブラウザコンテキストから呼ぶ。

### 参考ドキュメント

- [SvelteKit Form Actions](https://svelte.dev/docs/kit/form-actions) — フォームアクションの仕組み
- [SvelteKit Routing - server](https://svelte.dev/docs/kit/routing#server) — `+server.ts` の仕様
- [Playwright Locators](https://playwright.dev/docs/locators) — ロケータの優先順位

---

## 教訓

### DnD

- DnD ライブラリが更新するのは**配列順序のみ**。クロスカラム移動では `onDragEnd` で明示的にプロパティを更新する
- Playwright の mouse 操作は `@dnd-kit`（ポインターイベント）と不整合なため E2E テストは `page.evaluate(() => fetch(...))` で API を直接呼び出す
- DnD カード内のインタラクティブ要素は `onclick` と `onpointerdown` の両方を `stopPropagation` する（`@dnd-kit` の Pointer センサーは `pointerdown` でドラッグを開始するため）

### 非同期・状態管理

- `$state` 変数を非同期処理のロールバックに使う場合は `await` の前に `const captured = x` でキャプチャする（タブ切り替えによるレースコンディション防止）

### Prisma / DB

- バリデーションループに DB 呼び出しが入ったら N+1 を疑い、`findMany({ where: { id: { in: ids } } })` + `Map` パターンに置き換える
- Prisma enum とアプリ enum は構造が同じでも TypeScript は別型として扱う。キャストが必要な箇所を残すこと
- ダブルサブミットなどレースコンディションによる unique 制約違反は `try-catch` で P2002 を握りつぶすより `createMany({ skipDuplicates: true })` で冪等な書き込みを DB に委ねる。PostgreSQL/CockroachDB/SQLite のみ対応・nested createMany 不可に注意

### Svelte 5

- `$state()` の初期化式で `$props()` を参照すると「This reference only captures the initial value」警告。意図的なら `untrack(() => ...)` でラップ
- `{#snippet}` はコンポーネントタグの**外**（トップレベル）に定義する。タグ内に書くと named slot として解釈されて型エラー
- snippet を維持すべき判断基準: コンポーネント化したときに props が10個以上になるなら snippet のまま維持が妥当

### テスト

- DB クエリのテストは `where` だけでなく `orderBy`・`include` など機能上重要なパラメータも `expect.objectContaining` でアサートする
- DB を副作用として変更するテストのリストア処理は `try/finally` に入れる。`finally` でないとアサーション失敗時にクリーンアップがスキップされ後続テストが汚染される
- `z.number().positive()` は小数（`1.5`）を通す。Prisma の `Int` 型フィールドには `z.number().int().positive()`
- `in` 演算子による enum バリデーションはプロトタイプチェーン上のキーも通す。`Object.hasOwn(Enum, value)` に置き換える

### SvelteKit

- ページルート（`+page.server.ts`）には `redirect()`、API ルート（`+server.ts`）には `error()` を使う（`redirect()` を投げると `fetch` クライアントが HTML を受け取る）

### コードレビュー（AI）

- AIレビューが sentinel 値・非null アサーション・null 安全性を指摘した場合、鵜呑みにせずデータフロー全体（生成元 → マップ登録 → ガード → 利用側）を追って検証する。フィルタや `calcXxx` 関数がすでに安全性を保証しているケースは誤検知になる
- コードレビューで参照されているファイルパスは実在確認が必要（ドキュメント上のパスとリポジトリ内の実際のパスが食い違うことがある）

### その他

- `any` を使う前に型の出所を確認。devDep を追加すれば正しい型が使えることが多い
- 関数名に `upsert` を使うのは insert-or-update の両方を実装している場合のみ
- UI ラベルと実際の動作が異なる場合、ラベルを実態に合わせるかコメントで意図を明示する

---

## 残タスク

- [ ] KanbanBoard の CURRICULUM/SOLUTION 重複ロジックを DRY に
- [ ] テストに実際のシードデータを使用
- [ ] 管理メニューに「問題集 (並び替え)」リンク追加
- [ ] コメントを英語に統一
- [ ] 空のカンバンカラムに「ここに問題集をドロップできます」等のプレースホルダーメッセージを表示（UX改善）

---

## 検証方法（手動確認）

1. SOLUTION タブでカードをドラッグ&ドロップし、カラム間移動ができることを確認
2. ドロップ後にページをリロードして順序が保持されていることを確認（DB 保存確認）
3. CURRICULUM タブでも同様に並び替えができることを確認
4. CURRICULUM のカードを SOLUTION カラムにドロップできないことを確認（移動禁止）
5. ColumnSelector でカラムの表示/非表示を切り替え、URL パラメータが更新されることを確認
6. ページリロード後も選択カラムが URL から復元されることを確認
7. 未公開の問題集に「未公開」バッジが表示されることを確認
8. ネットワークを意図的に遮断した状態でドロップし、エラー Toast とロールバックが発生することを確認
