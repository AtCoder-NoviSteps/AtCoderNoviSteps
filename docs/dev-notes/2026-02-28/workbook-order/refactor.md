# リファクタリング計画: 問題集の並び順管理 (#943)

## 概要

最小限の機能は実装済みだが、コード品質と拡張性に改善が必要。
今後の機能追加（ユーザ向け問題集の表示順反映など）に備えたリファクタリング。

フェーズは簡単・局所的な変更から、構造的・広範囲な変更の順に並べている。

また、自律的なコードベースの継続的な改善に向けた仕組みを作成・更新する。

---

## Phase 1: 即効性のある修正（局所的・低リスク）

### 1.1 コメントを英語に統一

- [ ] `KanbanBoard.svelte`: 日本語コメントをすべて英語化
- [ ] `+page.server.ts`: 同上
- [ ] `+server.ts`: コメントとエラーメッセージを英語化（管理者専用画面のため英語のみで十分）
- [ ] `workbook_placements.ts`（service）: 残存する日本語コメント
- [ ] `workbook_tasks.ts`（utils）: 日本語コメント

### 1.2 省略された変数名 → 明示的な命名

- [ ] `KanbanBoard.svelte`: `([k]) =>` → `([category]) =>`、`(c) =>` → `(card) =>` など
- [ ] `ColumnSelector.svelte`: `(v) =>` → `(value) =>`、`opt` → `option`
- [ ] `selectedSolutionCols` の filter `(c)` → `(category)`、`selectedGrades` の filter `(g)` → `(grade)`

### 1.3 デバッグコードの削除

- [ ] `src/features/workbooks/services/workbooks.ts:183` — `console.log(await getWorkBook(workBookId))` を削除

### 1.4 不要な async の除去

- [ ] `src/features/workbooks/services/workbook_tasks.ts` — `getWorkBookTasks` から `async` / `await Promise.all` を除去（同期的な map のみで async 処理なし）
- [ ] 呼び出し元 `workbooks.ts:118` と `workbooks.ts:162` から `await` を除去

### 1.5 配色: 青系統 → 緑系統（default）

- [ ] `+page.svelte`: `bg-blue-600 hover:bg-blue-700` → 緑系統
- [ ] `KanbanCard.svelte`: `hover:border-blue-400` → 緑系統
- [ ] `ColumnSelector.svelte`: `bg-blue-600 border-blue-600` → 緑系統

### 1.6 ColumnSelector の改善

- [ ] `minSelect` → `minRequired` にリネーム（意図が明確になる）
- [ ] 下限の設定根拠を英語コメントで明記: "Minimum columns required for drag-and-drop to function"
- [ ] button の `class` 属性を簡潔に記述
- [ ] `{@const}` で `option.value` の繰り返し参照を削減できるか評価 → 有効なら適用

---

## Phase 2: 型の整理

### 2.1 `src/features/workbooks/types/workbook_placement.ts` を作成

- [ ] `workbook.ts` から `WorkBookPlacement` 関連の型を抽出
- [ ] `SolutionCategory` 定数 + 型をこのファイルに移動
- [ ] `SOLUTION_LABELS` を `KanbanBoard.svelte` からこのファイルに移動（日本語ラベルはそのまま）
- [ ] `WorkBookPlacements`（配列型）を定義し、service/コンポーネントで使用
- [ ] 全 import パスを更新

### 2.2 `GRADE_LABELS` を `getTaskGradeLabel()` で置換

- [ ] `KanbanBoard.svelte`: `GRADE_LABELS` オブジェクトを削除し、`$lib/utils/task.ts` の `getTaskGradeLabel()` を使用
- [ ] `GRADE_OPTIONS` を `TaskGrade` + `getTaskGradeLabel()` から動的に生成

### 2.3 `as never` / 型アサーションの排除

- [ ] `workbook_placements.test.ts`: `as never` を seed データパターンに基づく適切な型付きモックデータに置換
- [ ] `+page.server.ts`: `session?.user.username as string` → null チェック後にナロイング
- [ ] `+server.ts`: 同上
- [ ] service 層: 関数シグネチャを整合させ、呼び出し側で `as never` が不要になるようにする

### 2.4 インライン型 → 共有型へ移動

- [ ] `KanbanBoard.svelte` の `CardData`, `WorkbookWithPlacement` を適切な場所に移動
  - `CardData`: カンバン固有 → `_types/kanban.ts`
  - `WorkbookWithPlacement`: `+page.server.ts` の load でも使用 → `workbook_placements.ts`

---

## Phase 3: データ構造の変更 + DRY化（コアリファクタリング）

### 3.1 `items` をフラット配列 → `Record<string, CardData[]>` に変更

この変更により以下が同時に実現される:

- パネル間のカードとカードの間への挿入（参照リポジトリ dnd-kit-kanban と同等の動作）
- `onDragEnd` での手動カラム割り当てロジックの排除
- `sort(() => 0)` ワークアラウンドの削除（Record ベースの `move()` がカラム間移動を自動処理）

手順:

- [ ] `items` の状態を `CardData[]` → `Record<string, CardData[]>`（カラムキー）に変更
- [ ] `buildInitialCards()` を `solutionCategory` または `taskGrade` でグループ化した Record を返すように変更
- [ ] `solutionItems` と `curriculumItems` を別々の Record として管理
- [ ] `onDragOver`: 適切な Record を `move()` に渡すように更新
- [ ] `onDragEnd` を簡素化: 手動の `srcCard.solutionCategory = target.id` ロジックを削除（move() が処理）
- [ ] `getCardsForSolutionCol()` / `getCardsForGradeCol()` を削除 — Record のキーアクセスで代替
- [ ] priority 再計算: Record の各カラム値をイテレート
- [ ] `snapshot` / ロールバックを Record 対応に更新

### 3.2 DragDropProvider テンプレートの DRY 化

3.1 の後、solution タブと curriculum タブは同一のテンプレート構造（Record をイテレートして KanbanColumn を描画）になる。

- [ ] `{#snippet kanbanColumns(items, labelFn, group)}` を抽出して重複を排除
- [ ] snippet が約30行を超える場合は `KanbanTab.svelte` コンポーネントとして抽出

**snippet vs コンポーネントの判断軸:**

snippet を第一選択とする理由:

1. 親コンポーネントの `$state`（`items`, `onDragEnd` など）に直接アクセスが必要 — コンポーネントだと props が多数必要になる
2. 独自の状態やライフサイクルを持たない純粋な表示ロジックである
3. 同一ファイル内の2箇所での DRY 化が目的で、他ファイルからの再利用がない

コンポーネントに昇格すべき条件:

- snippet が肥大化し、ColumnSelector やタブ切替ロジックなど独自の状態管理を含むようになった場合
- 約30行を超えた場合（認知負荷の閾値）

### 3.3 `onDragEnd` の簡素化

3.1 の後、`onDragEnd` は以下のように簡素化される:

- [ ] Record 構造から影響カラムを読み取り（`affectedCategories`/`affectedGrades` の Set が不要に）
- [ ] `activeTab === 'solution'` の分岐を可能な限り削除（Record キーが抽象化）
- [ ] priority 再計算を Record エントリへの単一ループに統合

---

## Phase 4: サーバ側・service 層

### 4.1 `validateAdminAccess` を `src/routes/(admin)/_utils/auth.ts` に抽出

- [ ] `src/routes/(admin)/_utils/auth.ts` を作成
- [ ] `+page.server.ts` から `validateAdminAccess` を移動
- [ ] `+page.server.ts` と `+server.ts` の import を更新
- [ ] `+server.ts` 内の重複を削除

### 4.2 `initializePlacements` ロジックを service 層に移動

- [ ] `+page.server.ts` action 内の DB クエリ（未配置ワークブックの取得）+ スタブ Task 構築を `workbook_placements.ts` service に抽出
- [ ] `prisma/seed.ts` の `addWorkBookPlacements` との重複ロジックを統合（同じ `tasksByTaskId` Map 構築）
- [ ] `+page.server.ts` の action は薄いラッパーに: バリデーション → service 呼び出し → return

### 4.3 Seed: `addWorkBookPlacements` を他モデルと同じ粒度に分割

他モデル（`addWorkBooks` → `addWorkBook`）のパターンに合わせる:

- [ ] `addCurriculumPlacements(unplacedCurriculum)` を抽出 — CURRICULUM の単一責務
- [ ] `addSolutionPlacements(unplacedSolution)` を抽出 — SOLUTION の単一責務
- [ ] `addWorkBookPlacements` は両者を呼び出すオーケストレータに
- [ ] 4.2 で作成した service 層のメソッドを再利用（スタブ Task 構築、`initializeCurriculumPlacements`）
- [ ] `as never` 型アサーション（351行目）を削除 — service 関数シグネチャの整合で不要に

### 4.4 Service 層のクリーンアップ

- [ ] `workbook_placements.ts`: 型定義を `types/workbook_placement.ts` に移動（Phase 2.1）
- [ ] ハードコードされた文字列を `TaskGrade` / `SolutionCategory` 定数で置換
- [ ] `initializeCurriculumPlacements()` を責務ごとに分割（複数の関心事がある場合）
- [ ] 全エクスポート関数に明示的な戻り値の型を追加
- [ ] 公開 API 関数に JSDoc を追加

---

## Phase 5: UI の改善

### 5.1 ページレイアウト（`+page.svelte`）

- [ ] `ContainerWrapper` で囲む
- [ ] ページタイトルを「問題集（並び替え）」に変更
- [ ] 「ボードに問題集を追加」ボタン: 左寄せ、タイトル直下に配置

### 5.2 KanbanBoard の UI

- [ ] タブ: ライトモードで背景色の塗りつぶしを除去
- [ ] フォントサイズ拡大: タブラベル（解法別 / カリキュラム）、カテゴリ/グレードボタン
- [ ] ボタン: 緑系統 + ホバー時に背景色を変更

### 5.3 KanbanColumn の UI

- [ ] フォントサイズ拡大: カラムラベル、カード数
- [ ] ダークモード: カラム背景を識別可能にする
- [ ] カード数が多い場合に縦方向スクロールバーを表示

### 5.4 KanbanCard の UI

- [ ] 問題集詳細ページへのリンクを追加（`/workbooks` と同様、既存リンクコンポーネントを使用）
- [ ] 「未公開」バッジ → 赤色に変更
- [ ] ホバー時: 枠線を緑系統に

### 5.5 管理画面ナビゲーション

- [ ] `navbar-links.ts` の「問題集」の下に「問題集（並び替え）」リンクを追加

---

## Phase 6: テストの改善

### 6.1 単体テストの修正（`workbook_placements.test.ts`）

- [ ] モックデータを `prisma/seed.ts` のフィクスチャに基づく意味のある値に置換
- [ ] `as never` を適切な型付きテストデータに置換
- [ ] `taskGrade` に文字列リテラルではなく `TaskGrade` 列挙を使用
- [ ] `taskGrade` と `solutionCategory` が混在するシナリオのテストを追加
- [ ] `solutionCategory` 固有のテストを追加

### 6.2 E2E テスト — 新規シナリオ

優先度順:

**アクセス制御:**

- [ ] 非 admin ユーザ → `/login` にリダイレクト

**「問題集を追加」ボタン:**

- [ ] 未配置の問題集がある場合にボタンが表示される
- [ ] クリック後、ボタンが消える（全問題集が配置済み）

**カラムセレクタ + URL:**

- [ ] カテゴリ/グレードボタンをクリック → カラムの表示/非表示
- [ ] URL に選択中のカテゴリ/グレードが反映される
- [ ] クエリ文字列なしでアクセス時のデフォルトパラメータ（tab=solution, categories=PENDING,GRAPH）

**Cross-type 移動拒否（API）:**

- [ ] CURRICULUM↔SOLUTION 間の移動を POST → 400 レスポンス

**エラーハンドリング（API レベルのみ、DnD UI テストは Playwright mouse + @dnd-kit が不安定なため除外）:**

- [ ] 存在しない placement ID で POST → 400
- [ ] 不正なリクエストボディで POST → 400

---

## Phase 7: ドキュメント・自動化

### 7.1 ドキュメント更新

- [ ] `docs/guides/architecture.md`: `_types/`, `_utils/` ディレクトリの規約を追記

### 7.2 教訓

- [ ] このリファクタリングで得た知見を記録（実装中に加筆）
  - dnd-kit のフラット配列 vs Record によるカラム間ソートの違い
  - validateAdminAccess 共有ガードパターン
  - seed / service 層の重複排除

### 7.3 Claude Code の自律的な修正に向けた基盤作り（保留 — rules/subagents/skills/custom commands の調査待ち）

- [ ] Claude Code の拡張ポイントを調査: `.claude/rules/`, subagents, custom commands, skills
- [ ] それぞれの適切な抽象度を判定
- [ ] このリファクタリングで特定された繰り返しパターンに対する rules/自動化を作成

---

## 出典

- [SvelteKit Form Actions](https://svelte.dev/docs/kit/form-actions) — フォームアクションの仕組み（fetch vs form action の判断根拠）
- [SvelteKit Routing - server](https://svelte.dev/docs/kit/routing#server) — `+server.ts` の仕様（JSON API エンドポイントの採用根拠）
- [Svelte 5 Snippets](https://svelte.dev/docs/svelte/snippet) — snippet の仕様（Phase 3.2 の snippet vs コンポーネント判断）
- [Svelte 5 Component Basics](https://svelte.dev/docs/svelte/svelte-components) — コンポーネント分割の基準
- [@dnd-kit/helpers `move()`](https://github.com/clauderic/dnd-kit/tree/master/packages/helpers) — flat array vs Record の挙動の違い（Phase 3.1 の設計根拠）
- [dnd-kit-kanban 参照リポジトリ](https://github.com/KATO-Hiro/dnd-kit-kanban) — Record ベースのカンバン実装例
- [Playwright Locators](https://playwright.dev/docs/locators) — ロケータの優先順位（E2E テストの設計方針）
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) — テスト設計のベストプラクティス
- [Superforms Nested Data](https://superforms.rocks/concepts/nested-data) — `dataType: 'json'` の仕様（不採用の根拠）
