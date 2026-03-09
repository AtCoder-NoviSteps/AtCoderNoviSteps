# リファクタリング計画: 問題集の並び順管理 (#943)

## 概要

最小限の機能は実装済みだが、コード品質と拡張性に改善が必要。
今後の機能追加（ユーザ向け問題集の表示順反映など）に備えたリファクタリング。

フェーズは簡単・局所的な変更から、構造的・広範囲な変更の順に並べている。

また、自律的なコードベースの継続的な改善に向けた仕組みを作成・更新する。

---

Phase 1 〜 6 までのリファクタリングで判明した新たな修正点（難易度順）

## Phase 7: 定数・表記・色（最小リスク）

### 7.1 HTTP レスポンスコードを定数化

- [x] `+server.ts` — `status: 400` が 3箇所 → `src/lib/constants/http-response-status-codes.ts` の `BAD_REQUEST` に置換

### 7.2 未公開ラベルを既存コンポーネントに統一

- [x] `KanbanCard.svelte` — `<Badge color="red">未公開</Badge>` → `PublicationStatusLabel.svelte` に置き換え（表記が「未公開」→「非公開」に変わる）

### 7.3 色を `primary` 系に統一

- [x] `KanbanCard.svelte` — `hover:border-green-400` → `hover:border-primary-400`
- [x] `KanbanCard.svelte` — リンクホバー `hover:text-green-*` → `text-primary-700 dark:text-primary-500`（競合する `text-gray-900 dark:text-white` も削除）
- [x] `KanbanBoard.svelte` — アクティブタブ `text-green-600 border-green-600` → `text-primary-700 border-primary-700 dark:text-primary-500 dark:border-primary-500`
- [x] `+page.svelte` — ボタン背景 `bg-green-600 hover:bg-green-700` → `bg-primary-600 hover:bg-primary-700`

### 7.4 型のリネーム

- [x] `_types/kanban.ts` — `CardData` → `Card`、`Card[]` の型エイリアス `Cards` を定義
- [x] `_types/kanban.ts` — インライン `KanbanItems` を `KanbanColumns` として定義・エクスポート
- [x] 呼び出し元全体（`KanbanBoard.svelte`, `KanbanColumn.svelte`）のインポートを更新

---

## Phase 8: 型・命名（局所的な構造変更）

### 8.1 省略変数の確認と修正

- [x] `KanbanBoard.svelte` を精査し、ソート比較関数の `a`, `b` → `workbookA`, `workbookB` にリネーム

### 8.2 KanbanCard Props を分解

- [x] `_types/kanban.ts` に `SortableProps { columnId: string; group: string; index: number }` を定義
- [x] `KanbanCard.svelte` の Props を `Card & SortableProps` として合成するよう変更

### 8.3 KanbanBoard のインライン型を `_types/kanban.ts` に移動

- [x] `DragOverEventArg`, `DragEndEventArg`（`DndEvents` 経由）型エイリアスを `_types/kanban.ts` へ移動
- [x] インポートを更新

### 8.4 複数形の型エイリアスを追加・`.svelte` 内の型宣言を移動

- [x] `onDragEnd` のインライン `updates` 型 → `PlacementUpdate` として `_types/kanban.ts` に移動
- [x] `WorkbooksWithPlacement`（複数形）を `workbook_placement.ts` に追加、`KanbanBoard.svelte` の Props で使用

### 8.5 `WorkbookLink.svelte` を新規作成

- [x] `src/features/workbooks/components/shared/WorkbookLink.svelte` を作成
  - Props: `workBookId: number`, `title: string`
  - CSS: `text-primary-600 hover:underline dark:text-primary-500`
  - `flex-1`, `truncate`, サイズ指定はレイアウト固有のため含めない
- [x] `KanbanCard.svelte` のインライン `<a>` を `WorkbookLink` に置き換え

---

## Phase 9: UI スタイル調整（視覚的変更）

### 9.1 タブの余白調整

- [x] `KanbanBoard.svelte` — `Tabs` に `contentClass="mt-0 p-0"` を追加、TabItem のフォントサイズを `text-base` → `text-lg` に変更

### 9.2 カテゴリ/グレードボタンとパネルの隙間を空ける

- [x] `KanbanBoard.svelte` — tabHeader snippet の `div` を `mb-3` → `mb-4` に変更

### 9.3 横幅を問題集ページと合わせる

- [x] `ContainerWrapper.svelte` — `lgWidth` prop を追加（デフォルト `lg:w-3/4`）
- [x] `+page.svelte` — `lgWidth="lg:w-full"` を指定して `lg:w-3/4` を無効化

### 9.4 `<div class="mb-3">`で囲まている内容 の重複を snippet 化

- [x] `KanbanBoard.svelte` — `{#snippet tabHeader(label, options, selected, onchange, minRequired?)}` を追加し、両 TabItem の `<div class="mb-4">` ブロックを切り出して `{@render tabHeader(...)}` で呼び出す
- [x] `KanbanBoard.svelte` — `{#snippet tabItem(title, key, content: Snippet)}` を追加し、`activeClass`/`inactiveClass`/`onclick` の重複を排除。各タブのコンテンツは `solutionContent`/`curriculumContent` snippet として定義して渡す

---

## Phase 10: コード DRY 化（構造的変更）

### 10.1 `buildSolutionItems` / `buildCurriculumItems` を共通化

- [x] 共通ロジックを `buildKanbanItems(workbooks, enumKeys, getColumnKey)` として抽出
- [x] `_utils/kanban.ts` に配置し、単体テストを追加
- [x] `KanbanBoard.svelte` 内の両関数を `buildKanbanItems` 呼び出しに置き換え

### 10.2 `if (activeTab === 'solution')` 分岐を `TabConfig` で排除

- [x] `_types/kanban.ts` に `ActiveTab` / `TabConfig { labelFn; group; columnKey }` を定義
- [x] `const tabConfigs: Record<string, TabConfig>` に DnD ハンドラの設定を統合し、if 分岐を撤廃
- [x] `solutionItems`/`curriculumItems` を `allItems: Record<string, KanbanColumns>` に統合

### 10.3 `+page.svelte` の form snippet 化（評価）

- [ ] ~~`+page.svelte` は 25 行と小さいため、snippet 化の恩恵が薄い → スキップ~~

### 10.4 `onDragEnd` を責務単位で分割

- [x] `calcPriorityUpdates(before: KanbanColumns, after: KanbanColumns, columnKey): PlacementUpdate[]` を抽出
- [x] `saveUpdates(updates: PlacementUpdate[]): Promise<void>` を抽出
- [x] `_utils/kanban.ts` に配置し、単体テストを追加

---

## Phase 11: サービス層・テスト（最高難度）

### 11.1 `+page.server.ts` の CRUD を service 層に移動

- [ ] `load()` 内の `prisma.workBook.findMany(...)` を `getWorkbooksWithPlacements()` として `workbook_placements.ts` に抽出
- [ ] `+page.server.ts` の `load()` は薄いラッパーに

### 11.2 `+server.ts` のバリデーション + CRUD を service 層に移動

- [ ] `prisma.workBookPlacement.findUnique(...)` と cross-type バリデーションロジックを `validateAndUpdatePlacements(updates)` として `workbook_placements.ts` に抽出
- [ ] POST ハンドラはバリデーション呼び出し → service 呼び出しのみに
- [ ] モックを使ったテストを追加

### 11.3 `initializeCurriculumPlacements` を分割

- [ ] `groupWorkbooksByGrade(workbooks, gradeModes): Map<TaskGrade, number[]>` を抽出
- [ ] `buildPlacementsFromGroups(workbooks, gradeModes, byGrade): PlacementCreate[]` を抽出
- [ ] 分割後に単体テストを追加

### 11.4 `seed.ts` の CRUD を service 層に移動

- [ ] `addWorkBookPlacements()` 内の直接 Prisma 呼び出しを service 層のメソッドを使う形に置き換え
- [ ] service 層以外では CRUD 処理の直書きを禁止（ルールを明記）
- [ ] テストを追加

### 11.5 KanbanBoard のコンポーネント分割

- [ ] `KanbanTabBar.svelte`（タブ切替 + ColumnSelector）を切り出す
- [ ] Phase 10.1, 10.2 完了後に実施（依存関係あり）

---

## Phase 1: 即効性のある修正（局所的・低リスク）

### 1.1 コメントを英語に統一

- [x] `KanbanBoard.svelte`: 日本語コメントをすべて英語化
- [x] `+page.server.ts`: 同上
- [x] `+server.ts`: コメントとエラーメッセージを英語化（管理者専用画面のため英語のみで十分）
- [x] `workbook_placements.ts`（service）: 残存する日本語コメント
- [x] `workbook_tasks.ts`（utils）: 日本語コメント

### 1.2 省略された変数名 → 明示的な命名

- [x] `KanbanBoard.svelte`: `([k]) =>` → `([category]) =>`、`(c) =>` → `(card) =>` など
- [x] `ColumnSelector.svelte`: `(v) =>` → `(item) =>`、`opt` → `option`
- [x] `selectedSolutionCols` の filter `(c)` → `(category)`、`selectedGrades` の filter `(g)` → `(grade)`

### 1.3 デバッグコードの削除

- [x] `src/features/workbooks/services/workbooks.ts:183` — `console.log(await getWorkBook(workBookId))` を削除

### 1.4 不要な async の除去

- [x] `src/features/workbooks/services/workbook_tasks.ts` — `getWorkBookTasks` から `async` / `await Promise.all` を除去（同期的な map のみで async 処理なし）
- [x] 呼び出し元 `workbooks.ts:118` と `workbooks.ts:162` から `await` を除去

### 1.5 配色: 青系統 → 緑系統（default）

- [x] `+page.svelte`: `bg-blue-600 hover:bg-blue-700` → 緑系統
- [x] `KanbanCard.svelte`: `hover:border-blue-400` → 緑系統
- [x] `ColumnSelector.svelte`: `bg-blue-600 border-blue-600` → 緑系統

### 1.6 ColumnSelector の改善

- [x] `minSelect` → `minRequired` にリネーム（意図が明確になる）
- [x] 下限の設定根拠を英語コメントで明記: "Minimum columns required for drag-and-drop to function"
- [x] button の `class` 属性を簡潔に記述（`{@const isSelected}` + 三項演算子 class 文字列に統合）
- [x] `{@const}` で `option.value` の繰り返し参照を削減 → `isSelected` に適用

---

## Phase 2: 型の整理

### 2.1 `src/features/workbooks/types/workbook_placement.ts` を作成

- [x] `workbook.ts` から `WorkBookPlacement` 関連の型を抽出
- [x] `SolutionCategory` 定数 + 型をこのファイルに移動
- [x] `SOLUTION_LABELS` を `KanbanBoard.svelte` からこのファイルに移動（日本語ラベルはそのまま）
- [x] `WorkBookPlacements`（配列型）を定義し、service/コンポーネントで使用
- [x] 全 import パスを更新（6ファイル: services, zod, fixtures, test, KanbanBoard）

### 2.2 `GRADE_LABELS` を `getTaskGradeLabel()` で置換

- [x] `KanbanBoard.svelte`: `GRADE_LABELS` オブジェクトを削除し、`$lib/utils/task.ts` の `getTaskGradeLabel()` を使用
- [x] `GRADE_OPTIONS` を `TaskGrade` + `getTaskGradeLabel()` から動的に生成

### 2.3 `as never` / 型アサーションの排除

- [x] `workbook_placements.test.ts`: `as never` を `WorkBookPlacements` 型付きモックデータに置換
- [x] `+page.server.ts`: `session?.user.username as string` → null チェック後にナロイング + `as string` 削除
- [x] `+server.ts`: 同上
- [x] テスト: `initializeSolutionPlacements(workbooks as never)` → キャスト削除（型が構造的に互換）

### 2.4 インライン型 → 共有型へ移動

- [x] `KanbanBoard.svelte` の `CardData` を `_types/kanban.ts` に移動
- [x] `WorkbookWithPlacement` を `workbook_placement.ts` に追加、KanbanBoard.svelte から削除

---

## Phase 3: データ構造の変更 + DRY化（コアリファクタリング）

### 3.1 `items` をフラット配列 → `Record<string, CardData[]>` に変更

この変更により以下が同時に実現される:

- パネル間のカードとカードの間への挿入（参照リポジトリ dnd-kit-kanban と同等の動作）
- `onDragEnd` での手動カラム割り当てロジックの排除
- `sort(() => 0)` ワークアラウンドの削除（Record ベースの `move()` がカラム間移動を自動処理）

手順:

- [x] `items` の状態を `CardData[]` → `Record<string, CardData[]>`（カラムキー）に変更
- [x] `buildInitialCards()` を `solutionCategory` または `taskGrade` でグループ化した Record を返すように変更
- [x] `solutionItems` と `curriculumItems` を別々の Record として管理
- [x] `onDragOver`: 適切な Record を `move()` に渡すように更新
- [x] `onDragEnd` を簡素化: 手動の `srcCard.solutionCategory = target.id` ロジックを削除（move() が処理）
- [x] `getCardsForSolutionCol()` / `getCardsForGradeCol()` を削除 — Record のキーアクセスで代替
- [x] priority 再計算: Record の各カラム値をイテレート
- [x] `snapshot` / ロールバックを Record 対応に更新

### 3.2 DragDropProvider テンプレートの DRY 化

3.1 の後、solution タブと curriculum タブは同一のテンプレート構造（Record をイテレートして KanbanColumn を描画）になる。

- [x] `{#snippet kanbanColumns(columns, items, labelFn, group)}` を抽出して重複を排除
- [x] snippet は5行で収まったため、コンポーネント抽出は不要

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

- [x] Record 構造から影響カラムを読み取り（`affectedCategories`/`affectedGrades` の Set が不要に）
- [x] `activeTab === 'solution'` の分岐を大幅に削減（onDragOver/onDragEnd で共通ロジック化）
- [x] priority 再計算を Record エントリへの単一ループに統合（snapshot 比較で差分検出）

---

## Phase 4: サーバ側・service 層

### 4.1 `validateAdminAccess` を `src/routes/(admin)/_utils/auth.ts` に抽出

- [x] `src/routes/(admin)/_utils/auth.ts` を作成
- [x] `+page.server.ts` から `validateAdminAccess` を移動
- [x] `+page.server.ts` と `+server.ts` の import を更新
- [x] `+server.ts` 内の重複を削除

### 4.2 `initializePlacements` ロジックを service 層に移動

- [x] `+page.server.ts` action 内の DB クエリ + スタブ Task 構築を `workbook_placements.ts` service に抽出（`createInitialPlacements`）
- [x] `prisma/seed.ts` の `addWorkBookPlacements` との重複ロジックを統合（`buildTasksByTaskId` / `buildCurriculumWorkbooksForInit` ヘルパーで DRY 化）
- [x] `+page.server.ts` の action は薄いラッパーに: バリデーション → service 呼び出し → return

### 4.3 Seed: `addWorkBookPlacements` を他モデルと同じ粒度に分割

他モデル（`addWorkBooks` → `addWorkBook`）のパターンに合わせる:

- [x] `addCurriculumPlacements(unplacedCurriculum)` を抽出 — CURRICULUM の単一責務
- [x] `addSolutionPlacements(unplacedSolution)` を抽出 — SOLUTION の単一責務
- [x] `addWorkBookPlacements` は両者を呼び出すオーケストレータに
- [x] 4.2 で作成した service 層のメソッドを再利用（`buildTasksByTaskId`、`buildCurriculumWorkbooksForInit`、`initializeCurriculumPlacements`）
- [x] `as never` 型アサーション（旧 351 行目）を削除 — service 関数シグネチャの整合で不要に

### 4.4 Service 層のクリーンアップ

- [x] `workbook_placements.ts`: 型定義（`PlacementInput`、`WorkBookWithTasks`、`PlacementCreate`）を `types/workbook_placement.ts` に移動
- [x] `initializeCurriculumPlacements()` を責務ごとに分割 — `buildTasksByTaskId` / `buildCurriculumWorkbooksForInit` に抽出
- [x] 全エクスポート関数に明示的な戻り値の型を追加
- [x] 公開 API 関数に JSDoc を追加
- [x] `calcWorkBookGradeModes` の引数型を `WorkBookWithTasks` が直接渡せる最小型に変更（`as WorkbooksList` キャスト除去）
- [ ] ハードコードされた `'CURRICULUM'` / `'SOLUTION'` 文字列を `WorkBookType` 定数で置換（型制約で安全なため優先度低）

---

## Phase 5: UI の改善

### 5.1 ページレイアウト（`+page.svelte`）

- [x] `ContainerWrapper` で囲む
- [x] ページタイトルを「問題集（並び替え）」に変更
- [x] 「ボードに問題集を追加」ボタン: 左寄せ、タイトル直下に配置

### 5.2 KanbanBoard の UI

- [x] タブ: ライトモードで背景色の塗りつぶしを除去
- [x] フォントサイズ拡大: タブラベル（解法別 / カリキュラム）、カテゴリ/グレードボタン
- [x] ボタン: 緑系統 + ホバー時に背景色を変更

### 5.3 KanbanColumn の UI

- [x] フォントサイズ拡大: カラムラベル、カード数
- [x] ダークモード: カラム背景を識別可能にする
- [x] カード数が多い場合に縦方向スクロールバーを表示

### 5.4 KanbanCard の UI

- [x] 問題集詳細ページへのリンクを追加（`/workbooks/{workBookId}` — ID で直接アクセス可能）
- [x] 「未公開」バッジ → 赤色に変更
- [x] ホバー時: 枠線を緑系統に

### 5.5 管理画面ナビゲーション

- [x] `navbar-links.ts` の「問題集」の下に「問題集（並び替え）」リンクを追加

---

## Phase 6: テストの改善

### 6.1 単体テストの修正（`workbook_placements.test.ts`）

- [x] `as never` を適切な型付きテストデータに置換（Phase 2.3 で実施）
- [x] `taskGrade` に文字列リテラルではなく `TaskGrade` 列挙を使用
- [x] モックデータを `prisma/seed.ts` のフィクスチャに基づくより意味のある値に拡充
- [x] `taskGrade` と `solutionCategory` が混在するシナリオのテストを追加
- [x] `solutionCategory` 固有のテストを追加

### 6.2 E2E テスト — 新規シナリオ

優先度順:

**アクセス制御:**

- [x] 非 admin ユーザ → `/login` にリダイレクト

**「問題集を追加」ボタン:**

- [ ] 未配置の問題集がある場合にボタンが表示される（シード状態依存のためスキップ）
- [ ] クリック後、ボタンが消える（全問題集が配置済み）（同上）

**カラムセレクタ + URL:**

- [x] カテゴリ/グレードボタンをクリック → カラムの表示/非表示
- [x] URL に選択中のカテゴリ/グレードが反映される
- [x] クエリ文字列なしでアクセス時のデフォルト表示（tab=solution, PENDING・GRAPH カラムが表示される）

**Cross-type 移動拒否（API）:**

- [x] CURRICULUM↔SOLUTION 間の移動を POST → 400 レスポンス

**エラーハンドリング（API レベルのみ、DnD UI テストは Playwright mouse + @dnd-kit が不安定なため除外）:**

- [x] 存在しない placement ID で POST → 400
- [x] 不正なリクエストボディで POST → 400

---

## Phase 7: ドキュメント・自動化

### 7.1 ドキュメント更新

- [ ] `docs/guides/architecture.md`: `_types/`, `_utils/` ディレクトリの規約を追記

### 7.2 教訓

- [x] このリファクタリングで得た知見を記録（下記「教訓」セクションを参照）

### 7.3 Claude Code の自律的な修正に向けた基盤作り（保留 — rules/subagents/skills/custom commands の調査待ち）

- [ ] Claude Code の拡張ポイントを調査: `.claude/rules/`, subagents, custom commands, skills
- [ ] それぞれの適切な抽象度を判定
- [ ] このリファクタリングで特定された繰り返しパターンに対する rules/自動化を作成

---

## 教訓

### Prisma enum と アプリ enum の型不一致

`user.role` は Prisma 生成型 (`$Enums.Roles`)、`isAdmin()` は `$lib/types/user` の `Roles` enum を期待する。構造が同じでも TypeScript は別型として扱う。null ガードで `as Roles` キャストを除去できても enum 同士の不一致は残るため、キャストが必要な箇所は残した。

### `as never` の正しい置換方法

Prisma の `findMany` 戻り値型は複雑で、アプリ内の単純な型とは一致しない。`as never` の代替として `as unknown as Awaited<ReturnType<typeof prisma.xxx.findMany>>` を使うと型安全性が上がる。関数引数の `as never` は構造的部分型付けで除去できることが多い（余剰プロパティは変数経由なら許容される）。

### `{@const}` で repeated expression を削減

Svelte の `{#each}` ブロック内で `opt.value` を `selected.includes(opt.value)` などで複数回参照する場合、`{@const isSelected = selected.includes(option.value)}` で単一評価にまとめると DRY になる。さらに class 属性を三項演算子の文字列で記述すると `class:xxx=` ディレクティブの羅列より簡潔になる。

### enum を型ガードに使う場合の注意

`g in GRADE_LABELS`（Record）から `grade in TaskGrade` へ移行する際、TaskGrade には `PENDING` が含まれるため `grade !== 'PENDING'` の追加フィルタが必要。

### `@dnd-kit/helpers` の `move()` は `Record<string, Items>` をネイティブサポート

`move(items, event)` に `Record<string, CardData[]>` を渡すと、自動的にカラム間移動を処理する（ソースカラムから削除 → ターゲットカラムに挿入）。フラット配列のときに必要だった手動カラム割り当て（`srcCard.solutionCategory = target.id`）や `sort(() => 0)` ワークアラウンドが不要になる。

Record キーは `createDroppable` の `id` と一致する必要がある。空カラムへのドロップ時、`move()` は `target.id in items` でカラムを特定する。

### `createSortable` の `group` vs `type` の使い分け

- `group`: `move()` が Record のどのキーにアイテムが属するかを判定するために使用。Record キー（カラム ID）を設定する。
- `type`: `createDroppable` の `accept` とマッチングするコリジョンフィルタ用。「solution」「curriculum」のようなグループ種別を設定する。

この2つを混同すると、Record ベースの `move()` が正しく動作しない。

### Record ベースの状態管理での `CardData` 簡素化

フラット配列では `solutionCategory`、`taskGrade`、`priority` を CardData に持つ必要があった。Record ベースでは:

- カラム割り当て = Record キー（暗黙的）
- 優先度 = 配列インデックス（暗黙的）
- サーバ更新時のカラム情報 = Record エントリのイテレーションで取得

結果、CardData は表示に必要なフィールド（`id`, `workBookId`, `title`, `isPublished`）のみになり、KanbanColumn の `PlacementCard` インターフェースと統合できた。

### snapshot 比較による差分検出

`onDragEnd` で `affectedCategories`/`affectedGrades` の Set を手動管理する代わりに、ドラッグ開始時の snapshot と現在の Record を比較して変更カラムを検出するアプローチが簡潔。`cards.some((card, i) => card.id !== snapCards[i]?.id)` で順序変更も検出できる。

### ユーティリティ関数の引数型は使う最小型に絞る

`calcWorkBookGradeModes` は `WorkbooksList`（多くのフィールドを含む広い型）を受け取っていたが、実際に使うのは `id` と `workBookTasks` のみ。引数型を `{ id: number; workBookTasks: WorkBookTaskBase[] }[]` に絞ることで、`WorkBookWithTasks` を `as WorkbooksList` キャストなしに直接渡せるようになった。広い型を要求する関数は呼び出し元で不要なキャストを強いる。

### seed 固有ロジックは service に持ち込まない

`solutionCategoryMap`（URL スラッグ → カテゴリ のマッピング）はシードデータ固有の知識であり、service 層に漏らすべきでない。service は PENDING で初期化し、seed 側でオーバーライドするパターンを維持することで関心分離を保った。

### `Parameters<typeof fn>[0]` で型の重複を避ける

seed 側で `addCurriculumPlacements` の引数型を明示的に書くと、service 側の `UnplacedCurriculumRow` と二重管理になる。`Parameters<typeof buildTasksByTaskId>[0]` を使うと service の型定義に追従でき、型の整合性が自動的に保たれる。

---

### Flowbite Svelte の TabItem: `activeClass` / `inactiveClass`（単数形）

`activeClasses` / `inactiveClasses`（複数形）は存在しない。正しいプロップ名は `activeClass` / `inactiveClass`。型エラーで即座に検出できるため、`pnpm check` を先に走らせてから続行するとよい。

### `workbooks/[slug]` は整数 ID でも解決できる

`getWorkbookWithAuthor(slug)` は `parseWorkBookId(slug)` でパースするため、数値 ID を文字列として渡せば `urlSlug` なしでも動作する。カンバンカードのリンクは `/workbooks/{workBookId}` で十分であり、`urlSlug` を `CardData` に追加する必要はなかった。

### KanbanCard のリンクとドラッグの干渉を防ぐ

`<a>` タグを DnD カード内に置くと、クリックイベントがドラッグに誤って伝播する場合がある。`onclick={(e) => e.stopPropagation()}` でリンクのクリックをカード側に伝えないことで干渉を防ぐ。

### ContainerWrapper はカンバン等の全幅レイアウトに `defaultWidth="w-full"` が必要

デフォルトは `w-5/6 lg:w-3/4` で幅が制限される。カンバンボードのように横スクロールが必要なページでは `defaultWidth="w-full"` を渡す。

### フィクスチャベースのテストデータは「実在する値」を使う

`initializeCurriculumPlacements` のテストでは抽象的な `'t1'`/`'t2'` ではなく、実際の fixture に存在するタスク ID（`math_and_algorithm_a`、`tessoku_book_bz` など）とそのグレードを使うことで、仕様変更時にテストが実際のデータとの整合性をチェックできるようになる。

### `minRequired` を意識したカラムトグルのテスト設計

`ColumnSelector` の `minRequired={1}` により、選択中の非 PENDING カラムが 1 枚のみの場合はそれを非選択にできない。トグルのテストでは「最初から複数カラムを選択した状態（GRAPH + DATA_STRUCTURE）で一方を外す」ことで、この制約を回避しながら正常系を検証できる。

### URL 同期は初回ロード時には起こらない

`KanbanBoard.svelte` は `$effect` による `replaceState` でコンポーネントの状態変化を URL に反映するが、ページ初回ロード時（変化なし）は URL を書き換えない。そのため「クエリ文字列なしでアクセスしたときの URL パラメータ」を検証するより、「表示されるべきカラムが実際に表示されている」という UI 状態で検証する方が正確。

### E2E の beforeEach でページを必要最小限のパスに goto する

API エラーハンドリングのテストでは、`page.evaluate` で fetch を発行するためにセッション Cookie が必要。`beforeEach` でページを一度 goto してセッションを確立してから fetch するパターンが、`loginAsAdmin` 後に個別に goto するより効率的。

### Tailwind `color` ユーティリティの競合に注意

`hover:text-green-600` を `text-primary-700` に置き換える際、既存の `text-gray-900` が残ると同じ CSS プロパティを重複指定する警告が出る。VSCode の cssConflict 診断がリアルタイムで検出するので、置換後すぐに確認する。競合するクラスは両方を削除して意図するクラスだけを残す。

### コンポーネント内部で `#if` を持つ場合は呼び出し元を簡素化できる

`PublicationStatusLabel` は `{#if !isPublished}` を内包しているため、呼び出し元では `{#if !isPublished}` のラッパーが不要になる。単純に `<PublicationStatusLabel {isPublished} />` と書けばよい。

### 型のインライン定義を型ファイルに移す際は呼び出し元を全検索する

`type KanbanItems = Record<string, CardData[]>` はコンポーネントローカルで定義されていたが、`KanbanColumn.svelte` が `CardData` を直接インポートしていた。型ファイルの変更だけでは不十分で、`Grep` で全参照ファイルを確認してからリネームする。

### `Card & SortableProps` 合成 + スプレッド呼び出しで props の重複を排除

`KanbanCard` の Props を `Card & SortableProps` の交差型にすると、`KanbanColumn` 側の呼び出しを `{...card} index={i} {columnId} {group}` のスプレッドにまとめられる。card に属するプロパティ（`id`, `workBookId`, `title`, `isPublished`）を個別に列挙する必要がなくなり、`Card` 型にフィールドを追加しても呼び出し側を変更せずに済む。`Card.id` を `placementId` としてバインドしたい場合は `let { id: placementId, ... }: Card & SortableProps = $props()` でデストラクチャリング時にエイリアスを付ける。

### DnD イベント型は `_types` に置く

`DragOverEventArg` / `DragEndEventArg` は `DragDropEvents` の `Parameters` から導出する型エイリアスで、コンポーネント固有の実装ではない。`_types/kanban.ts` に置くことで、将来的に他のコンポーネントが同じ型を参照する際に重複定義を防げる。

### 複数形の型エイリアスは配列型の表現を統一する

`WorkbookWithPlacement[]` を `WorkbooksWithPlacement` として定義しておくと、Props の型注釈が `workbooks: WorkbooksWithPlacement` と読みやすくなる。`Cards = Card[]` と同様のパターン。ただし既存コードにバラまかれた `WorkbookWithPlacement[]` の置き換えは段階的に行い、混在させない。

### `ContainerWrapper` の `lg:w-3/4` はオプション化が必要なケースがある

`ContainerWrapper` は `lg:w-3/4` をハードコードしているため、カンバンボードのように全幅が必要なページでは意図せず幅が制限される。`lgWidth` prop（デフォルト `'lg:w-3/4'`）を追加することで、呼び出し元が `lgWidth="lg:w-full"` で上書きできる。`defaultWidth="w-full"` だけでは `lg:` ブレークポイントでの挙動を制御できない点に注意。

### パラメータ付き snippet で同構造の繰り返しを DRY 化

同一コンポーネント内で引数だけ異なる同構造のマークアップは、`{#snippet name(param1, param2, ...)}` のパラメータ付き snippet に切り出せる。`{@render name(...)}` の呼び出し側では型安全に引数を渡せる。snippet が外部 state（`$state` や他 snippet）を参照しない純粋な表示ロジックである場合に特に有効。

コンテンツが可変の場合は `content: Snippet` をパラメータとして受け取り、呼び出し元で別途 snippet を定義して渡す。`{@render tabItem('タイトル', 'key', myContent)}` のように snippet 変数を引数に渡せる。

### `Record<string, T>` で `$state` を統合すると if 分岐が消える

`solutionItems` / `curriculumItems` を別々の `$state` として持つと、DnD ハンドラのすべての箇所で `if (activeTab === 'solution')` 分岐が必要になる。これを `allItems = $state<Record<string, KanbanColumns>>({ solution: ..., curriculum: ... })` に統合すると、`allItems[activeTab]` の単一アクセスで分岐が消える。配列の場合より Record（辞書）の方がタブ系の状態管理に向いている。

### `TabConfig` は「変化しない設定」を集約する

DnD ハンドラで tab ごとに変わる設定（`columnKey`, `labelFn`, `group`）を `const tabConfigs: Record<string, TabConfig>` にまとめると、`if (activeTab === 'solution')` を `tabConfigs[activeTab].columnKey` のプロパティアクセスに置き換えられる。`TabConfig` に含めるのは「純粋な設定値（＝state でないもの）」に限定するのが Svelte 5 のリアクティビティと相性が良い。

### `$state()` 初期化で props を参照すると Svelte が警告する

`let foo = $state(someFunction(prop))` のように `$props()` の値を `$state()` の初期化式内で直接参照すると、`"This reference only captures the initial value"` 警告が出る。これは Svelte がリアクティブな読み取りを検出しているためで、意図的に初期値のみ取りたい場合は `untrack(() => ...)` でラップする。ローカル関数（クロージャ）経由で参照すると Svelte がトラッキングを省略する場合があるが、`untrack` を使う方が意図が明確。

### `buildKanbanItems` の `enumKeys` は「存在するキー」を列挙する

`buildKanbanItems` はまず `enumKeys` 全体で空配列を初期化するため、`getColumnKey` が返すキーは必ず `enumKeys` に含まれている必要がある。一部のキーだけを渡したテストでは `record[col].push(...)` が undefined エラーになる。テストでは「実際に使うすべてのキー」か「テスト対象のワークブックが属するキーのみ」を確実に渡すこと。

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
