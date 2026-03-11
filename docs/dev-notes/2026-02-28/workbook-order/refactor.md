# リファクタリング

## TODO

### Phase 0: ルール整備（以降の全フェーズで自動適用される前提）

- [ ] `.claude/rules/` にコーディングルールを英語で追加
  - [ ] 1文 `if () return` 禁止 → 必ず `if () { return }` と書く
  - [ ] ラムダ引数の1文字変数禁止（イテレータ index `i` は許容）
  - [ ] 一般的でない省略形禁止（例: `res` → `response`, `SolutionCols` → `SolutionCategories`）
  - [ ] `Hoge[]` ではなく複数形の型エイリアスを定義して使う
  - [ ] service 層以外での CRUD 直書き禁止
  - [ ] テストでは `toBeTruthy()` ではなく `toBe(true)` を使う
  - [ ] テストデータは実際の fixture を参照する（抽象的な `'t1'`, `'t2'` は禁止）
- [ ] `AGENTS.md` に `src/features/` ディレクトリを追記
- [ ] `docs/guides/architecture.md` に `_types/`, `_utils/` ディレクトリの規約を追記

### Phase 1: 機械的な単一箇所修正（リスク最小・依存なし）

- [ ] `+server.ts`: `result` → `validationError` にリネーム
- [ ] `+page.svelte`: `<h2>` → `<HeadingOne title="..." />` に置換
- [ ] `_utils/kanban.ts`: `res` → `response` にリネーム
- [ ] `_utils/kanban.ts`: `enumKeys` → `columnKeys` にリネーム
- [ ] `KanbanBoard.svelte`: `SolutionCols` → `SolutionCategories` にリネーム
- [ ] `KanbanCard.svelte`: `PublicationStatusLabel` と `WorkbookLink` を別の行に分ける
- [ ] `ColumnSelector.svelte`: L22 の1行 return にブレースを追加
- [ ] `ColumnSelector.svelte`: ボタンの色を `green` → `primary` に変更
- [ ] `ColumnSelector.svelte`: 最小値2の理由をコメントで英語明記（DnD にはカード移動先として最低2パネル必要）
- [ ] テストファイル: `toBeTruthy()` → `toBe(true)` に置換
- [ ] テストファイル: ラムダ引数の1文字変数（`r` 等）を意味のある名前に修正

### Phase 2: 型定義の整理（Phase 3 以降の前提）

- [ ] `_types/kanban.ts`: `columnKey` のハードコード → `TabConfig` の `columnKey` に型を定義（`'solutionCategory' | 'taskGrade'` を `ColumnKey` 型として抽出）
- [ ] `_types/kanban.ts`: `PlacementUpdates` 型を定義（`PlacementUpdate[]` の代替）
- [ ] `_types/kanban.ts`: `SortableProps` の属性の違いをコメントで明記、または明示的な名前に変更
- [ ] `workbook_placement.ts`: `PlacementInputs` 型を定義（`PlacementInput[]` の代替）
- [ ] `workbook_placement.ts`: `UnplacedCurriculumRows` 型を定義
- [ ] `workbook_placements.ts`（service）: `workBookType` ハードコード → `WorkBookType` を使用
- [ ] `workbook_placements.ts`（service）: 他の `Hoge[]` も複数形の型を定義・使用
- [ ] テストファイル: ハードコード値 → `TaskGrade`, `SolutionCategory`, `WorkBookType` 型を使用

### Phase 3: 命名・リネーム（型定義に依存）

- [ ] `calcPriorityUpdates` → `reCalcPriorities` 等に改名（英語的に自然な名前へ）
- [ ] `getWorkBookPlacements` → 問題集の種類を指定していることが分かる命名に変更
- [ ] `buildTasksByTaskId` → unplaced curriculum workbook rows であることが分かる命名に変更
- [ ] `KanbanColumn.svelte`: Props を意味のある単位で並び替え
- [ ] `KanbanColumn.svelte`: カラム内カード数を右寄せ + 数字を大きく

### Phase 4: UI スタイル修正

- [ ] `KanbanTabBar.svelte`: タブの padding/margin を `/workbooks`（`WorkbookTabItem` / `TabItemWrapper`）と合わせる
- [ ] `KanbanTabBar.svelte`: 表示カテゴリ・グレードのボタン色をタブの配色と合わせる + ライトモードホバー時は緑系テキストハイライト
- [ ] `KanbanTabBar.svelte`: `'PENDING'` ハードコード → `SolutionCategory` 型を使用

### Phase 5: 関数リファクタリング（純粋関数 → テスト容易）

- [ ] `_utils/kanban.ts` の `calcPriorityUpdates`: `isChanged` 時の null 埋めが DB で両方 null 違反を起こさないか調査 → 問題あれば修正
- [ ] `_utils/kanban.ts` の `calcPriorityUpdates`: for 文 → 関数型（map/filter）に書き直し
- [ ] `workbook_placements.ts`: `buildTasksByTaskId` の二重 for 文 → `flatMap` 等で関数型に書き直し
- [ ] `workbook_placements.ts`: `groupWorkbooksByGrade` → 関数型でシンプルに書き直し
- [ ] `zod/schema.test.ts`: `workBookPlacementSchema` を workbook schema の外側に配置

### Phase 6: サービス層の構造改善（段階的に実施）

**Step 1: メソッド分割**

- [ ] `createInitialPlacements` を単一責務に分割（メインメソッドが先、サブメソッドが後）
- [ ] `validateAndUpdatePlacements` も同様に分割

**Step 2: メソッド順序の再整理**

- [ ] ファイル全体のメソッド順序を以下に従って並べ替え:
  1. 基本的な CRUD
  2. カリキュラム: 初期化 → 更新系
  3. 解法別: 初期化 → 更新系
  4. カリキュラムと解法別に共通する処理
  5. seed.ts 専用

### Phase 7: コンポーネント調査・改善

以下はまず調査し、困難と判断したら理由をコメントに残してスキップする:

- [ ] 調査: `KanbanTabBar.svelte` の Props 肥大化 → 意味ある単位で型定義すべきか?
- [ ] 調査: `KanbanCard.svelte` の Props 肥大化 → 同上
- [ ] 調査: `solutionBoard` / `curriculumBoard` snippet を `KanbanTabBar` に移動可能か?
- [ ] 調査: `updateUrl` を `_utils` に分離可能か?（`$page.url` を引数にすれば可能では?）
- [ ] 調査: `auth.ts` の単体テスト追加の可否（redirect の副作用がテスト困難か?）
- [ ] `KanbanBoard.svelte`: state のハードコード → 型定義を使用
- [ ] `KanbanBoard.svelte`: `tabConfigs` を定数ファイルまたは `_utils` に移動
- [ ] `saveUpdates` の配置: `_utils` のままでよいか検討（`_utils` が不自然に感じる原因の特定）

### Phase 8: テストの整備

- [ ] `src/features/workbooks/fixtures/workbook_placements.ts` を新設し、テストデータを移動
- [ ] テストデータを `prisma/tasks.ts` や `fixtures/workbooks.ts` の実データに基づくものに置換
- [ ] `mockResolvedValue` の重複キャストパターン → ヘルパー関数に抽出（vitest の制約なら理由をコメント）
- [ ] 冗長な `expect(result).toEqual(mockPlacements)` → 直後の assert でカバーされていれば削除
- [ ] テスト順序をサービスのメソッド順序に合わせて並べ替え（Phase 6 Step 2 に依存）
- [ ] 不足しているテストケースを追加
- [ ] `+page.server.ts`: `createInitialPlacements()` のエラーハンドリング漏れを調査 → 失敗時に `success: true` が返る問題を修正

### Phase 9: kanban.ts の単体テスト補強

- [ ] `_utils/kanban.ts` の正常系・異常系・境界値テストを追加（既存の `kanban.test.ts` を拡充）

### Phase 10: ドキュメント更新（上記が全て完了したら実行）

- [ ] `docs/guides/architecture.md` の最終更新（Phase 0 で追記した内容の確認・補完）
- [ ] コンポーネントは薄くし、型宣言・汎用処理は `_types/` / `_utils/` に分離する規約を明記
- [ ] 汎用処理には単体テストを書く規約を明記
- [ ] 毎回指示している内容を規約に明記して確実に実行されるようにする
  - [ ] 忖度せずに批判的な観点からレビューする
  - [ ] plan.md では TODO リストを作る
  - [ ] プロダクションコードとテストを実装 → テスト通過 → TODO 更新 → 教訓を再利用可能な形でまとめる → 古い TODO や 計画を 破棄
- [ ] Claude Code の拡張ポイント（`.claude/rules/`, subagents, custom commands, skills, hooks 等）を調査し、繰り返しパターンに対して次回以降は自律的に修正できるようにする

### 解決済み

- [x] `prisma/seed.ts` の CRUD 直書き → `findMany` は残っているが、他の helper は service 層を使用済み
- [x] `validateAndUpdatePlacements` の `null` 返却 → `{ error: string } | null` は方針通りの Result パターン

---

## 方針・指針

### フェーズ設計

- 変更リスクの低い順（局所的・最小リスク → 構造的・広範囲）にフェーズを並べる
- 各フェーズの依存関係を明示し、後続フェーズの前提条件を明確にする

### snippet vs コンポーネントの判断軸

snippet を第一選択とする条件:

1. 親の `$state` に直接アクセスが必要（コンポーネント化すると props が多数必要になる）
2. 独自の状態やライフサイクルを持たない純粋な表示ロジック
3. 同一ファイル内の限定的な DRY 化が目的（他ファイルからの再利用なし）

コンポーネントに昇格する条件:

- 独自の状態管理・ライフサイクルが必要になった場合
- 約30行を超えた場合（認知負荷の閾値）

### DB への CRUD は service 層に集約

- seed・ルートハンドラは service を呼ぶだけにする
- HTTP 層のエラー処理を service 層で引き取る際は `Response` / `json()` を持ち込まず、`{ error: string } | null` の純粋な値を返す設計にする

### やらないと決めた方針

- ページファイルが小さい（25行程度）場合は snippet 化しない
- seed は統合テスト相当のため単体テスト対象外
- DnD UI の Playwright テストは mouse + @dnd-kit が不安定なため除外
- 型制約で安全なハードコード定数の置換は優先度を下げる

---

## 技術的教訓

### TypeScript

- Prisma enum とアプリ enum は構造が同じでも TypeScript は別型として扱う。キャストが必要な箇所は残すこと
- `as never` の代替: `as unknown as Awaited<ReturnType<typeof prisma.xxx.findMany>>`
- 関数引数の `as never` は構造的部分型付けで除去できることが多い（余剰プロパティは変数経由なら許容）
- ユーティリティ関数の引数型は「実際に使うフィールドの最小型」に絞る → 呼び出し元のキャストが不要になる
- `Parameters<typeof fn>[0]` で型定義の二重管理を避ける

### Svelte 5

- `$state()` の初期化式で `$props()` の値を参照すると「This reference only captures the initial value」警告が出る。意図的な場合は `untrack(() => ...)` でラップする
- `{#snippet}` はコンポーネントタグの外（トップレベル）に定義する。タグ内に書くと named slot として解釈されて型エラーになる
- `{#each}` 内で同じ式を複数回参照する場合は `{@const}` で単一評価にまとめる
- コンポーネントが内部で `{#if}` を持つ場合、呼び出し元でのラッパーは不要

### 状態管理

- タブ系の状態は `Record<string, T>` に統合すると `if (activeTab === '...')` 分岐が消える
- タブごとに変わる「純粋な設定値（state でないもの）」は `TabConfig` に集約し、プロパティアクセスで分岐を排除する
- `onDragEnd` 等で影響範囲を手動管理する代わりに、ドラッグ開始時の snapshot と現在の Record を比較して変更箇所を検出する

### テスト

- テストデータには抽象的な値（`'t1'`, `'t2'`）より実際の fixture に存在する値を使う。仕様変更時に整合性チェックになる
- URL 同期は初回ロード時には発生しないため、URL パラメータより UI 状態（表示されるべき要素の存在）で検証する
- E2E でセッション Cookie が必要な fetch テストは、`beforeEach` でページを goto してセッションを確立してから発行する

### seed

- seed 固有の知識は service 層に持ち込まない
- service は汎用的な初期値で初期化し、seed 側でオーバーライドするパターンで関心の分離を保つ

### CSS / Tailwind

- 同じ CSS プロパティを複数クラスで指定すると競合警告が出る。置換後は VSCode の cssConflict 診断で即時確認する
- 競合するクラスは片方だけでなく両方を削除して、意図するクラスだけを残す

---

## 出典

- [SvelteKit Form Actions](https://svelte.dev/docs/kit/form-actions) — フォームアクションの仕組み（fetch vs form action の判断根拠）
- [SvelteKit Routing - server](https://svelte.dev/docs/kit/routing#server) — `+server.ts` の仕様（JSON API エンドポイントの採用根拠）
- [Svelte 5 Snippets](https://svelte.dev/docs/svelte/snippet) — snippet の仕様（snippet vs コンポーネント判断）
- [Svelte 5 Component Basics](https://svelte.dev/docs/svelte/svelte-components) — コンポーネント分割の基準
- [@dnd-kit/helpers `move()`](https://github.com/clauderic/dnd-kit/tree/master/packages/helpers) — flat array vs Record の挙動の違い
- [dnd-kit-kanban 参照リポジトリ](https://github.com/KATO-Hiro/dnd-kit-kanban) — Record ベースのカンバン実装例
- [Playwright Locators](https://playwright.dev/docs/locators) — ロケータの優先順位（E2E テストの設計方針）
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) — テスト設計のベストプラクティス
- [Superforms Nested Data](https://superforms.rocks/concepts/nested-data) — `dataType: 'json'` の仕様（不採用の根拠）
