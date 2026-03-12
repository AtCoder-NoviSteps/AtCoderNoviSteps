# リファクタリング（workbook order 機能）

workbook order 機能のリファクタリング記録。

調査観点・フェーズ設計の原則は `.claude/skills/refactor-plan/instructions.md` に抽出済み。
コーディング規約は `.claude/rules/` 各ファイルに反映済み。

---

## 主な意思決定

- **`_server.ts` vs form action**: JSON API が必要（ページ遷移なし）なので `+server.ts` を採用。form action は不要
- **snippet を維持した理由**: `solutionBoard` / `curriculumBoard` snippet は `$state` に直接アクセスしており、コンポーネント化すると props が10個以上になる。snippet のまま維持が妥当
- **`saveUpdates` のテストを省略した理由**: ロジックが `if (!response.ok) throw` の1行のみ。fetch モックのセットアップコストがテスト価値を上回る。E2E でカバー
- **DnD の Playwright テスト除外**: mouse + @dnd-kit の組み合わせが不安定なため
- **`createInitialPlacements` のエラーハンドリング**: throw 時は SvelteKit が 500 として処理するため現状維持で問題なし

## ハマった点

- Prisma enum とアプリ enum は構造が同じでも TypeScript は別型として扱う。キャストが必要な箇所を残すこと
- `$state()` の初期化式で `$props()` を参照すると「This reference only captures the initial value」警告。意図的なら `untrack(() => ...)` でラップ
- `{#snippet}` はコンポーネントタグの**外**（トップレベル）に定義する。タグ内に書くと named slot として解釈されて型エラー
- fixture を `.filter()` でサブセット化するとき、同じ ID でも fixture が更新されると別エンティティを指す可能性がある

## PR #3252 CodeRabbit レビュー対応メモ

### 対処が必要なもの

1. **N+1 クエリ（`validatePlacements`）**
   `validatePlacements()` でループ内に `findUnique` を毎回発行。`findMany({ where: { id: { in: [...] } } })` でバッチ化が必要。

2. **API エンドポイントでの `redirect()` 使用**
   `validateAdminAccess()` は `redirect()` を投げるため、`+server.ts` から呼ぶと `fetch()` がログインHTMLを受け取る。API エンドポイント向けには `error(401)` / `error(403)` に変更が必要。

3. **WorkbookLink の `pointerdown` 未処理**
   `@dnd-kit` の Pointer センサーは `pointerdown` でドラッグを開始するため `onclick` だけ止めても効かない。`onpointerdown={(e) => e.stopPropagation()}` の追加が必要。

4. **ドラッグロールバックのレースコンディション**
   `onDragEnd` で `saveUpdates` の**後**に `allItems[activeTab]` を参照しているため、非同期中にタブを切り替えると間違ったボードが復元される。`activeTab` と `snapshot` の値を非同期呼び出し**前**にキャプチャが必要。

5. **Zod スキーマで整数検証が不足**
   `z.number().positive()` は小数（`1.5`）を受け入れるが Prisma の `Int` 型に渡すと壊れる。`z.number().int().positive()` に変更が必要。

6. **`upsertWorkBookPlacements` の命名ミス**
   実装は `prisma.update()` のみで upsert ではない。`updateWorkBookPlacements` にリネームが妥当。

7. **`in` 演算子での enum バリデーション**
   `category in SolutionCategory` はプロトタイプチェーン上のキー（`toString` 等）も通す。`Object.hasOwn(SolutionCategory, category)` に変更し、重複値の Set デデュープも検討。

8. **`getPlacementsByWorkBookType` テストで `orderBy` のアサーション欠如**
   現在 `where` 条件のみ確認しており、`orderBy: { priority: 'asc' }` が削除されても通ってしまう。

9. **`+page.svelte` の `PageData` 型アノテーション欠如**
   `data` prop に `PageData` 型が未指定。型安全性の観点から明示が必要。

### 任意対応（軽微・ドキュメント系）

- **DB の `priority > 0` 制約欠如**: migration に `CHECK (priority > 0)` を追加すればアプリ層バイパス時の防御になるが、Zod + 既存 XOR 制約で十分なため優先度は低い。
- **ERD に XOR 制約の記載欠如**: migration には `workbookplacement_xor_grade_category` 制約が既にある。ERD 図への追記のみ。
- **`WorkBookGradeModeSource` 型エイリアスの抽出**: `calcWorkBookGradeModes` の引数 `{ id: number; workBookTasks: WorkBookTaskBase[] }[]` を名前付き型に抽出。1箇所のみなので YAGNI に近い。
- **開発ノートのクエリパラメータ例**: `?tab=solution&cols=PENDING,GRAPH` → `?tab=solution&categories=PENDING,GRAPH` に修正。
- **`/refactor-plan` スキルに `--comments` フラグ欠如**: `gh issue view $ARGUMENTS` → `gh issue view $ARGUMENTS --comments` に修正しないと issue のコメントが取得できない。
- **`AGENTS.md` に `src/features/**/` のテスト配置規約の記載欠如**: コロケーションパターンの説明を追記。
- **`CONTRIBUTING.md` の `@dnd-kit/svelte` のネスト誤り**: Flowbite Svelte のサブ項目になっているが、独立したピア依存として並列に記載すべき。
- **`.claude/rules/auth.md` にパスが未記載**: 新しい admin auth ヘルパーとルートサブツリーのパスを追記。

### 対処不要と判断したもの

- **`@dnd-kit/abstract` / `@dnd-kit/dom` の devDependencies 配置**: `import type` のみ使用しているためコンパイル時に消える。devDependencies で正しい。
- **DB の `priority > 0` 制約欠如**: Zod + 既存 XOR チェック制約で十分。migration 追加のコスト対効果が低い。
- **`gradeModes.get(workbook.id)!` の非null アサーション**: Map の構築元と参照元が同じ workbooks 配列のため安全。
- **フィクスチャの ID 99 の「不整合」**: `solutionPlacements`（placement 行）と `workbooksWithPlacements`（workbook+placement 結合）は別テスト用フィクスチャであり意図的な設計。

---

## 出典

- [SvelteKit Routing - server](https://svelte.dev/docs/kit/routing#server) — `+server.ts` の採用根拠
- [Svelte 5 Snippets](https://svelte.dev/docs/svelte/snippet) — snippet の仕様
- [@dnd-kit/helpers `move()`](https://github.com/clauderic/dnd-kit/tree/master/packages/helpers) — flat array vs Record の挙動
