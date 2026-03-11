# リファクタリング

## TODO

### Phase 0: ルール整備（以降の全フェーズで自動適用される前提）

- [x] `.claude/rules/` にコーディングルールを英語で追加
  - [x] 1文 `if () return` 禁止 → 必ず `if () { return }` と書く
  - [x] ラムダ引数の1文字変数禁止（イテレータ index `i` は許容）
  - [x] 一般的でない省略形禁止（例: `res` → `response`, `SolutionCols` → `SolutionCategories`）
  - [x] `Hoge[]` ではなく複数形の型エイリアスを定義して使う
  - [x] service 層以外での CRUD 直書き禁止
  - [x] テストでは `toBeTruthy()` ではなく `toBe(true)` を使う
  - [x] テストデータは実際の fixture を参照する（抽象的な `'t1'`, `'t2'` は禁止）
  - [x] .claude/rules/prisma-db.md に src/features の service 層も追加
- [x] `AGENTS.md` に `src/features/` ディレクトリを追記
- [x] `docs/guides/architecture.md` に `_types/`, `_utils/` ディレクトリの規約を日本語で追記

### Phase 1: 機械的な単一箇所修正（リスク最小・依存なし）

- [x] `+server.ts`: `result` → `validationError` にリネーム
- [x] `+page.svelte`: `<h2>` → `<HeadingOne title="..." />` に置換
- [x] `_utils/kanban.ts`: `res` → `response` にリネーム
- [x] `_utils/kanban.ts`: `enumKeys` → `columnKeys` にリネーム
- [x] `KanbanBoard.svelte`: `SolutionCols` → `SolutionCategories` にリネーム
- [x] `KanbanCard.svelte`: `PublicationStatusLabel` と `WorkbookLink` を別の行に分ける
- [x] `ColumnSelector.svelte`: L22 の1行 return にブレースを追加
- [x] `ColumnSelector.svelte`: ボタンの色を `green` → `primary` に変更
- [x] `ColumnSelector.svelte`: 最小値2の理由をコメントで英語明記（DnD にはカード移動先として最低2パネル必要）
- [x] テストファイル: `toBeTruthy()` → `toBe(true)` に置換
- [x] テストファイル: ラムダ引数の1文字変数（`r` 等）を意味のある名前に修正

### Phase 2: 型定義の整理（Phase 3 以降の前提）

- [x] `_types/kanban.ts`: `columnKey` のハードコード → `TabConfig` の `columnKey` に型を定義（`'solutionCategory' | 'taskGrade'` を `ColumnKey` 型として抽出）
- [x] `_types/kanban.ts`: `PlacementUpdates` 型を定義（`PlacementUpdate[]` の代替）
- [x] `_types/kanban.ts`: `SortableProps` の属性の違いをコメントで明記、または明示的な名前に変更
- [x] `workbook_placement.ts`: `PlacementInputs` 型を定義（`PlacementInput[]` の代替）
- [x] `workbook_placement.ts`: `UnplacedCurriculumRows` 型を定義
- [x] `workbook_placements.ts`（service）: `workBookType` ハードコード → `WorkBookType` を使用
- [x] `workbook_placements.ts`（service）: 他の `Hoge[]` も複数形の型を定義・使用
- [x] テストファイル: ハードコード値 → `TaskGrade`, `SolutionCategory`, `WorkBookType` 型を使用

### Phase 3: 命名・リネーム（型定義に依存）

- [x] `calcPriorityUpdates` → `reCalcPriorities` に改名
- [x] `getWorkBookPlacements` → `getPlacementsByWorkBookType` に改名
- [x] `buildTasksByTaskId` → `buildTaskMapFromCurriculumRows` に改名
- [x] `KanbanColumn.svelte`: Props を意味のある単位で並び替え
- [x] `KanbanColumn.svelte`: カラム内カード数を右寄せ + 数字を大きく

### Phase 4: UI スタイル修正

- [x] `KanbanTabBar.svelte`: タブの padding/margin を `/workbooks`（`WorkbookTabItem` / `TabItemWrapper`）と合わせる
- [x] `KanbanTabBar.svelte`: 表示カテゴリ・グレードのボタン色をタブの配色と合わせる + ライトモードホバー時は緑系テキストハイライト
- [x] `KanbanTabBar.svelte`: `'PENDING'` ハードコード → `SolutionCategory` 型を使用

### Phase 5: 関数リファクタリング（純粋関数 → テスト容易）

- [x] `_utils/kanban.ts` の `reCalcPriorities`: `isChanged` 時の null 埋めが DB で両方 null 違反を起こさないか調査 → 問題なし（`[columnKey]: columnId` が常に片方を上書きするため）、コメントで明記
- [x] `_utils/kanban.ts` の `reCalcPriorities`: for 文 → 関数型（flatMap）に書き直し
- [x] `workbook_placements.ts`: `buildTaskMapFromCurriculumRows` の二重 for 文 → `flatMap` + `new Map(...)` で関数型に書き直し
- [x] `workbook_placements.ts`: `groupWorkbooksByGrade` → `reduce` で関数型に書き直し
- [x] `zod/schema.test.ts`: `workBookPlacementSchema` を workbook schema の外側に配置

### Phase 6: サービス層の構造改善（段階的に実施）

**Step 1: メソッド分割**

- [x] `createInitialPlacements` を単一責務に分割（メインメソッドが先、サブメソッドが後）
- [x] `validateAndUpdatePlacements` も同様に分割

**Step 2: メソッド順序の再整理**

- [x] ファイル全体のメソッド順序を以下に従って並べ替え:
  1. 基本的な CRUD
  2. カリキュラム: 初期化 → 更新系
  3. 解法別: 初期化 → 更新系
  4. カリキュラムと解法別に共通する処理
  5. seed.ts 専用

### Phase 7: コンポーネント調査・改善

以下はまず調査し、困難と判断したら理由をコメントに残してスキップする:

- [x] 調査: `KanbanTabBar.svelte` の Props 肥大化 → 意味ある単位で型定義すべきか?
  - 結論: 8 props は Svelte 5 の flat props モデルで許容範囲。変更なし
- [x] 調査: `KanbanCard.svelte` の Props 肥大化 → 同上
  - 結論: `Card & SortableProps` 交差型が既に整理済み。変更なし
- [x] 調査: `solutionBoard` / `curriculumBoard` snippet を `KanbanTabBar` に移動可能か?
  - 結論: snippet が `allItems`, `TAB_CONFIGS`, `displayedSolutionCategories` など親の状態に依存するため移動不可。snippet は親スコープへのアクセスが強みであり、それを活かすべき
- [x] 調査: `updateUrl` を `_utils` に分離可能か?
  - 結論: `buildUpdatedUrl(url, activeTab, selectedSolutionCategories, selectedGrades): URL` として `_utils/kanban.ts` に純粋関数として抽出。`replaceState` の副作用は呼び出し元に残す
- [x] 調査: `auth.ts` の単体テスト追加の可否（redirect の副作用がテスト困難か?）
  - 結論: Lucia 設定のみで副作用なし・テスタブルなロジックがないため対象外
- [x] `KanbanBoard.svelte`: state のハードコード → 型定義を使用
  - `'PENDING'` → `SolutionCategory.PENDING`、`'GRAPH'` → `SolutionCategory.GRAPH`、`'Q10'`/`'Q9'` → `TaskGrade.Q10`/`TaskGrade.Q9`
- [x] `KanbanBoard.svelte`: `tabConfigs` を定数ファイルまたは `_utils` に移動
  - `TAB_CONFIGS` として `_utils/kanban.ts` に移動
- [x] `saveUpdates` の配置: `_utils` のままでよいか検討（`_utils` が不自然に感じる原因の特定）
  - 結論: HTTP fetch はサービス層（サーバー側 DB アクセス）ではなくクライアント側の処理。`_utils` はフィーチャースコープのユーティリティとして適切

### Phase 8: テストの整備

- [x] `src/features/workbooks/fixtures/workbook_placements.ts` を新設し、テストデータを移動
- [x] テストデータを `prisma/tasks.ts` や `fixtures/workbooks.ts` の実データに基づくものに置換
- [x] `mockResolvedValue` の重複キャストパターン → `mockFindMany` / `mockFindUnique` ヘルパー関数に抽出
- [x] 冗長な `expect(result).toEqual(mockPlacements)` → fixture 参照に統一、独立した assert と統合
- [x] テスト順序をサービスのメソッド順序に合わせて並べ替え（Phase 6 Step 2 に依存）
- [x] 不足しているテストケースを追加（`buildTaskMapFromCurriculumRows`, `buildCurriculumWorkbooksForInit`）
- [x] `+page.server.ts`: `createInitialPlacements()` のエラーハンドリング漏れを調査 → throw 時は SvelteKit が 500 として扱うため現状維持で問題なし（`success: true` には到達しない）

### Phase 9: kanban.ts の単体テスト補強

- [x] `_utils/kanban.ts` の正常系・異常系・境界値テストを追加（既存の `kanban.test.ts` を拡充）
  - `buildUpdatedUrl`: solution/curriculum タブ切替、空配列、既存パラメータ上書き、元 URL の非破壊を追加
  - `reCalcPriorities`: クロスカラム移動（両カラムが変更対象）、空→空のケースを追加
  - `buildKanbanItems`: `placement=null` 除外の明示的アサーションを追加
  - 既存の `(wb) =>` → `(workbook) =>` に修正（コーディングルール違反）

### Phase 10: ドキュメント更新（上記が全て完了したら実行）

- [x] `docs/guides/architecture.md` の最終更新（Phase 0 で追記した内容の確認・補完）
  - \_types//\_utils// の規約・コンポーネントを薄く保つ方針は既に記載済み
- [x] コンポーネントは薄くし、型宣言・汎用処理は `_types/` / `_utils/` に分離する規約を明記
  - `.claude/rules/svelte-components.md` に「Keep Components Thin」「Snippet vs Component」を追記
- [x] 汎用処理には単体テストを書く規約を明記
  - `.claude/rules/testing.md` に「Testing Extracted Utilities」セクションを追記
- [x] 毎回指示している内容を規約に明記
  - `AGENTS.md` の Guidelines に実装フロー（計画 → 実装 → 批判的レビュー → 教訓整理 → クリーンアップ）を追記
- [x] Claude Code の拡張ポイント（`.claude/rules/`, skills, hooks 等）を調査・整理
  - `docs/guides/claude-code.md` を新規作成（機能の使い分け・作業フロー規約）

### 解決済み

- [x] `prisma/seed.ts` の CRUD 直書き → `findMany` は残っているが、他の helper は service 層を使用済み
- [x] `validateAndUpdatePlacements` の `null` 返却 → `{ error: string } | null` は方針通りの Result パターン

---

## 方針・指針

### フェーズ設計

- 変更リスクの低い順（局所的・最小リスク → 構造的・広範囲）にフェーズを並べる
- 各フェーズの依存関係を明示し、後続フェーズの前提条件を明確にする

### 純粋関数の抽出と副作用の分離

- URL 更新処理（`updateUrl`）のように副作用（`replaceState`）を含む関数は、URL 構築ロジックを純粋関数（`buildUpdatedUrl`）として `_utils` に抽出することでテスト可能になる。副作用は呼び出し元に残す
- `_utils` に移動する純粋関数は、引数で依存を明示する（`$page.url` の直接参照ではなく `url: URL` として受け取る）

### snippet の親スコープ依存

- snippet の強みは親スコープの `$state` に直接アクセスできること。コンポーネント化すると props が膨大になる場合は snippet に留める
- snippet を別コンポーネントの props として渡すパターンは、snippet が参照する変数が多いほど「移動」ではなく「props を増やすだけ」になる

### 静的設定定数の配置

- タブごとの静的設定（`TAB_CONFIGS`）は使用コンポーネントの script ではなく `_utils` に移動することで、コンポーネントが「状態管理」に集中できる
- 静的設定（`Record<ActiveTab, TabConfig>`）には `ActiveTab` をキー型として使い、文字列インデックスよりも型安全にする

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
- `saveUpdates` の単体テストは不要: ロジックが `if (!response.ok) throw` の1行のみで、fetch モックのセットアップコストがテスト価値を上回る。E2E テストが HTTP 通信をカバーする

---

## 技術的教訓

> 次回以降も有用な教訓のみ残す。詳細なパターンは各 `.claude/rules/` ファイルを参照。

### TypeScript

- Prisma enum とアプリ enum は構造が同じでも TypeScript は別型として扱う。キャストが必要な箇所は残すこと
- `as never` の代替: `as unknown as Awaited<ReturnType<typeof prisma.xxx.findMany>>`
- ユーティリティ関数の引数型は「実際に使うフィールドの最小型」に絞る → 呼び出し元のキャストが不要になる
- `Parameters<typeof fn>[0]` で型定義の二重管理を避ける

### Svelte 5

- `$state()` の初期化式で `$props()` の値を参照すると「This reference only captures the initial value」警告が出る。意図的な場合は `untrack(() => ...)` でラップする
- `{#snippet}` はコンポーネントタグの外（トップレベル）に定義する。タグ内に書くと named slot として解釈されて型エラーになる
- snippet vs コンポーネントの判断軸 → `.claude/rules/svelte-components.md` 参照

### 状態管理

- タブ系の状態は `Record<ActiveTab, T>` に統合すると `if (activeTab === '...')` 分岐が消える
- 純粋な設定値（state ではない）は `TabConfig` に集約してプロパティアクセスで分岐を排除する
- ドラッグ操作の変更検出: 手動追跡より「開始時の snapshot と現在の Record を比較」が安全

### サービス層の構造設計

→ `prisma-db.md` に反映済み。以下は補足:

- メインメソッド（公開 API）をファイル先頭に置き、プライベートなサブ関数を直後に配置する
- バリデーションループを独立した関数に抽出するとオーケストレーターが「validate → upsert」の 2 ステップになり意図が明確になる
- `export` を付けないことでプライベートを表現（TypeScript の慣習）
- ファイル内セクションをコメントで区切ると大きいファイルでもナビゲーションコストを下げられる

### テスト設計

→ `.claude/rules/testing.md` に反映済み。以下は補足:

- `Promise.all` で同一 mock 関数を複数回呼ぶ場合、`mockResolvedValueOnce` を呼び出し順に積み上げれば対応できる
- `fail()` vs `error()`: `fail()` はページに留まる。フォームに `form.error` 表示 UI がない場合は throw だけで十分
- 「サービス関数を呼ばずインラインロジックだけ検証する」テストは削除してよい

### 命令型 → 関数型変換

- 二重ループで `Map` を構築する処理は `flatMap(...).map(...)` + `new Map(entries)` で書き直せる
- `flatMap` で変更があるカラムだけ展開し、変更がない場合は `[]` を返すことで `filter + flatMap` を 1 ステップに統合できる

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
