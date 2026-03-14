# AI レビュー対応から得られた教訓

PR #3252 CodeRabbit レビュー（任意対応・必須対応の全18件）への対応振り返り。

---

## テスト

### アサーションは重要なパスをすべてカバーする

`getPlacementsByWorkBookType` のテストが `where` 条件のみを検証しており、`orderBy: { priority: 'asc' }` が削除されても通ってしまう状態だった。

**ルール**: DB クエリのテストは `where` だけでなく `orderBy`・`include` など機能上重要なパラメータも `expect.objectContaining` でアサートする。

### テストのクリーンアップは `try/finally` で囲む

E2E テストで DB を書き換えた後のリストアが `// Restore` コメントの後ろに平文で書かれており、アサーション失敗時にクリーンアップがスキップされて後続テストを汚染する可能性があった。

**ルール**: DB を副作用として変更するテストのリストア処理は必ず `try/finally` に入れる。

### Zod スキーマには `.int()` を忘れない

`z.number().positive()` は小数（`1.5`）を通す。Prisma の `Int` 型に渡すと壊れる。整数フィールドには必ず `z.number().int().positive()` とし、小数境界値テストを追加する。

### E2E セレクタは `data-testid` で一意に特定する

`page.locator('div').filter({ has: heading }).first()` は heading を子孫に含む全祖先 div にマッチするため、`.first()` が意図しないラッパーを返すことがある。重要な DOM ターゲットには `data-testid` を付与し `page.locator('[data-testid="..."]')` で直接取得する。

**一般化候補**: `.claude/rules/testing.md` に E2E セレクタ規約として追加できる。

---

## 非同期・状態管理

### 非同期呼び出し前にリアクティブ変数をキャプチャする

`onDragEnd` で `await saveUpdates()` の後に `allItems[activeTab]` を参照していたため、非同期中にタブを切り替えると間違ったボードが復元される可能性があった。

**ルール**: Svelte の `$state` 変数を非同期処理のロールバックに使う場合は、`await` の前に `const capturedX = x` でキャプチャする。

---

## DB・Prisma

### ループ内の DB 呼び出しをバッチ化する

`validatePlacements` がループ内で `findUnique` を毎回発行していた（N+1）。`findMany({ where: { id: { in: ids } } })` でバッチ化し、`Map` で引き当てる。

**ルール**: バリデーションループに DB 呼び出しが入ったら N+1 を疑い、`findMany` + `Map` パターンに置き換える。

### DB の CHECK 制約は ERD.md にコメントで残す

migration に `workbookplacement_xor_grade_category` CHECK 制約があるが ERD.md に記載がなかった。Prisma は CHECK 制約を `schema.prisma` で表現できないため、ERD コメントが唯一の可視化手段になる。

**ルール**: migration で CHECK 制約を追加したら ERD.md の該当エンティティ直下に `%% XOR constraint: ...` のコメントを追記する。

**一般化候補**: `.claude/rules/prisma-db.md` に追記できる。

---

## SvelteKit

### `+server.ts` では `redirect()` でなく `error()` を使う

`validateAdminAccess()` は `redirect()` を throw するため `+server.ts`（JSON API）から呼ぶとクライアントが HTML を受け取る。API ルート向けには `error(401/403)` を throw する別ヘルパーが必要。

**ルール**: ページルート（`+page.server.ts`）には `redirect()`、API ルート（`+server.ts`）には `error()` を使う。共用認証ヘルパーを作るときはどちらのコンテキストで呼ばれるか設計段階で確定する。

→ `src/routes/(admin)/_utils/auth.ts` に `validateAdminAccessForApi()` として実装済み。`.claude/rules/auth.md` に注記追加済み。

---

## UI・イベント

### DnD 環境では `onclick` に加えて `onpointerdown` も止める

`@dnd-kit` の Pointer センサーは `pointerdown` でドラッグを開始する。`onclick` だけ `stopPropagation` しても DnD が先に反応してリンクナビゲーションが壊れる。

**ルール**: DnD カード内のインタラクティブ要素は `onclick` と `onpointerdown` の両方を止める。

### UI ラベルは実際の制約と一致させる

`ColumnSelector` のラベルが「2つ以上選択」なのに `minRequired={1}` だった。PENDING が暗黙的に常時表示される仕様のため意味的には正しいが、ラベルと実装が乖離していた。

**ルール**: ラベルと実際の動作が異なる場合、ラベルを実態に合わせて修正するか、コメントで意図を明示する。

---

## バリデーション・型

### `in` 演算子による enum バリデーションは `Object.hasOwn` に置き換える

`category in SolutionCategory` はプロトタイプチェーン上のキー（`toString` 等）も通す。`Object.hasOwn(SolutionCategory, category)` に変更する。

### 命名は実装を正確に反映する

`upsertWorkBookPlacements` は実際には `prisma.update()` のみで upsert ではなかった。`updateWorkBookPlacements` にリネーム。

**ルール**: 関数名に `upsert` を使うのは insert-or-update の両方を実装している場合のみ。

### TypeScript の型注釈を省略しない

`+page.svelte` の `data` prop に `PageData` 型が未指定だった。SvelteKit が自動生成する `$types` の `PageData` を明示することで型安全性が確保される。

---

## ドキュメント

### ライブラリ一覧のインデント構造は依存関係を暗示する

`CONTRIBUTING.md` で `@dnd-kit/svelte` が Flowbite Svelte のサブ項目に入っており「Flowbite の拡張」と誤読される構造だった。ピア依存・独立パッケージはトップレベルに並べる。

### 2種類のテスト配置戦略は明記する

`src/test/`（`src/lib/` のミラー）と `src/features/**/` のコロケーションが混在する理由をドキュメントに明記しないと新テストの置き場所で迷う。→ `AGENTS.md` に追記済み。

---

## ツール

### スキルの CLI コマンドは実際に流して確認する

`/refactor-plan` スキルの `gh issue view` に `--comments` フラグが抜けており issue のコメントが取得できなかった。CLI フラグの漏れは静かに失敗するため、スキル作成後に実コマンドを手動確認する。

---

## rules / AGENTS.md への一般化状況

| 教訓                                 | 一般化先                          | ステータス |
| ------------------------------------ | --------------------------------- | ---------- |
| `redirect()` vs `error()` の使い分け | `.claude/rules/auth.md` Key Files | 実装済み   |
| features テスト配置コロケーション    | `AGENTS.md` Project Structure     | 実装済み   |
| DB CHECK 制約 → ERD.md コメント      | `.claude/rules/prisma-db.md`      | 検討中     |
| E2E セレクタは `data-testid` を使う  | `.claude/rules/testing.md`        | 検討中     |
| スキル作成チェックリスト             | `.claude/rules/` 新規             | 検討中     |
