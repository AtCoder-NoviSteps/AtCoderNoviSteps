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
| 状態管理                       | URL パラメータ（`?tab=solution&cols=PENDING,GRAPH`）で管理。localStorage は SSR との hydration mismatch リスクあり                 |
| 初期化トリガー                 | form action の POST で実行。`load()` 内で DB INSERT は HTTP セマンティクス違反（GET の副作用）                                     |

---

## @dnd-kit/svelte 実装上の注意点

- **`onDragOver` で `move()` を呼ぶ必須**: `onDragEnd` のみだと `{#each}` の DOM と `OptimisticSortingPlugin` が不整合でフリーズ
- **object getter パターン必須**: `createSortable({ get id() { return placement.id }, get index() { return i } })` — 内部で `$effect.pre` を使うため、通常の値渡しは NG
- **`createSortable` はコンポーネントトップレベルで**: `{#each}` 内の `{@const}` で呼ぶとリアクティブ再評価でフリーズ
- **sortable `id` にプレフィックス禁止**: `move()` が `item.id === source.id` で照合するため
- **`use:action` 型の適合**: `attach(node)` の戻り値 `() => void` を `{ destroy: () => void }` にラップして Svelte アクション型に合わせる
- **`accept`（単数形）**: droppable の型フィルタは `accept`。`accepts` は存在しない
- **`@dnd-kit/dom` / `@dnd-kit/abstract` を devDependencies に追加**: `@dnd-kit/svelte` のイベントハンドラ型を正しく使うために必要

---

## 教訓

- **`any` を使う前に型の出所を確認**: `@dnd-kit/dom` を devDep に追加すれば正しい型が使えた
- **UI モックリポジトリ**: https://github.com/KATO-Hiro/dnd-kit-kanban（DnD の挙動を事前検証済み）
- **`svelte-sonner` はプロジェクトに未導入**: トースト通知は Flowbite の `Toast` コンポーネントを使う
- **Flowbite Svelte v1**: イベントハンドラは `onclick`（`on:click` は型エラー）

---

## 検証方法（手動確認）

4. `pnpm dev` でサーバー起動、管理者アカウントでログイン
5. `/workbooks/order` にアクセスし、カンバンボードが表示されることを確認
6. 「ボードに問題集を追加」ボタンで初期化が実行され、ボードに問題集が並ぶことを確認
7. SOLUTION タブでカードをドラッグ&ドロップし、カラム間移動ができることを確認
8. ドロップ後にページをリロードして順序が保持されていることを確認（DB 保存確認）
9. CURRICULUM タブでも同様に並び替えができることを確認
10. CURRICULUM のカードを SOLUTION カラムにドロップできないことを確認（移動禁止）
11. ColumnSelector でカラムの表示/非表示を切り替え、URL パラメータが更新されることを確認
12. ページリロード後も選択カラムが URL から復元されることを確認
13. 未公開の問題集に「未公開」バッジが表示されることを確認
14. ネットワークを意図的に遮断した状態でドロップし、エラー Toast とロールバックが発生することを確認

注: Q&A は `decisions.md` 参照。
