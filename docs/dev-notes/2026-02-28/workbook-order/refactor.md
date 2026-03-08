# リファクタリング計画: 問題集の並び順管理 (#943)

## 概要

最小限の機能は実装済みだが、コード品質と拡張性に改善が必要。
今後の機能追加（ユーザ向け問題集の表示順反映など）に備えたリファクタリング。

フェーズは簡単・局所的な変更から、構造的・広範囲な変更の順に並べている。

また、自律的なコードベースの継続的な改善に向けた仕組みを作成・更新する。

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
- [ ] モックデータを `prisma/seed.ts` のフィクスチャに基づくより意味のある値に拡充
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

- [x] このリファクタリングで得た知見を記録（下記「教訓」セクションを参照）

### 7.3 Claude Code の自律的な修正に向けた基盤作り（保留 — rules/subagents/skills/custom commands の調査待ち）

- [ ] Claude Code の拡張ポイントを調査: `.claude/rules/`, subagents, custom commands, skills
- [ ] それぞれの適切な抽象度を判定
- [ ] このリファクタリングで特定された繰り返しパターンに対する rules/自動化を作成

---

## 教訓（Phase 1-4 完了時点）

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
