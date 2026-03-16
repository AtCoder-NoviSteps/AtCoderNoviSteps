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
- **object getter パターン必須**: `createSortable({ get id() { return placement.id }, get index() { return i }, get group() { return columnId }, get type() { return group } })` — `id` / `index` だけでなく `group` / `type` も同様。内部で `$effect.pre` を使うため、通常の値渡しはスナップショットになり prop 変更が追跡されない
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

### Prisma / DB

- バリデーションループに DB 呼び出しが入ったら N+1 を疑い、`findMany({ where: { id: { in: ids } } })` + `Map` パターンに置き換える
- Prisma enum とアプリ enum は構造が同じでも TypeScript は別型として扱う。キャストが必要な箇所を残すこと

### Svelte 5

- `use:action` はその要素が DOM にマウントされた瞬間に自動実行され、アンマウント時に戻り値の `destroy()` が自動呼び出しされる。`{ destroy: cleanup }` の形で返すことで Svelte アクション型に合わせる
- snippet を維持すべき判断基準: コンポーネント化したときに props が10個以上になるなら snippet のまま維持が妥当

### テスト

- URL パース + バリデーションのインライン式は `URLSearchParams` を引数に取る純粋関数に切り出すと単体テスト可能になる。デフォルト値はその関数内に定数として定義し、仕様であることをコメントで明示する

### コードレビュー（AI）

- AIレビューが sentinel 値・非null アサーション・null 安全性を指摘した場合、鵜呑みにせずデータフロー全体（生成元 → マップ登録 → ガード → 利用側）を追って検証する。フィルタや `calcXxx` 関数がすでに安全性を保証しているケースは誤検知になる
- コードレビューで参照されているファイルパスは実在確認が必要（ドキュメント上のパスとリポジトリ内の実際のパスが食い違うことがある）
- 「効率の悪いアルゴリズム」指摘は適用箇所を選ぶ。シードスクリプトや管理者専用処理など実行頻度・データ規模が小さい箇所での `find()` → `Map` 置き換えは YAGNI 違反。N+1 や本番のホットパスが対象になるときに初めて有効な指摘となる

---

## PR #3252 レビュー対応

### レビュー指摘の判断

| #   | 指摘                                          | 判断             | 理由                                                                                                                                                                                                                                       |
| --- | --------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | KanbanBoard.svelte 177行・責務過多            | **棄却**         | 重要ロジックは `_utils/kanban.ts` に純粋関数として切り出し済み。コンポーネントに残るのはURL/DnD副作用と密結合した薄いグルーコード。storeに切り出してもPlaywrightなしでは実質テスト不可。                                                   |
| 2   | initializeXxx の共通化余地                    | **棄却**         | curriculum（grade計算→グループ化→priority割り当て）とsolution（全件PENDING＋連番）は構造が根本的に異なる。共通化するとかえって読みにくくなる。                                                                                             |
| 3   | SolutionCategory 二重定義（最優先とされた点） | **棄却（誤読）** | `const SolutionCategory` はPrisma enumをJSランタイム値として使うためのミラー（`Object.keys()` 用）。型は `SolutionCategoryOrigin` の alias であり同期ズレは起きない。Prisma enumはランタイム値として直接使えないため、このパターンは必要。 |
| 4   | workbook_placements.test.ts 539行             | **一部対応**     | 下記TODOを参照。                                                                                                                                                                                                                           |
| 5   | XOR制約のZod/SQL二重管理にコメントなし        | **対応**         | 下記TODOを参照。                                                                                                                                                                                                                           |

### 教訓

- AIレビューが「最優先」と判定した箇所（#3）が実は誤読だった。ランタイム値としてのenum利用パターンを見落とした誤検知。指摘の優先度評価は実コードを確認してから判断する。

---

## 残タスク

- [ ] 空のカンバンカラムに「ここに問題集をドロップできます」等のプレースホルダーメッセージを表示（UX改善）
- [ ] `workbook_placements.ts` とそのテストを `workbook_placements/` ディレクトリに2ファイル分割（DB操作 vs 純粋関数）
  - `workbook_placements/crud.ts` / `crud.test.ts` — `getXxx`, `updateXxx`, `createXxx`, `validateAndUpdatePlacements`（Prismaモック必要）
  - `workbook_placements/initializers.ts` / `initializers.test.ts` — `initializeCurriculumPlacements`, `initializeSolutionPlacements` とその補助関数（モック不要）
  - インポート修正は `+server.ts`, `+page.server.ts`, `seed.ts` の3ファイルのみ（各1行）
  - 5分割はファイル間の凝集度が下がるため見送り（`fetchUnplacedWorkbooks` 等の内部関数が分断される）
- [ ] `workbook_placements` Zodスキーマの `.refine()` にコメント追加（XOR制約はZodとmigration SQLの二重管理であり、Zodが早期検証・SQLが最終防壁である旨を明記）

---
