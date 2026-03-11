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

### ルール管理

- `.claude/rules/` のフロントマター属性は `globs` ではなく `paths` を使う（`globs` は非推奨）
- ルールは「関心の分離」で既存ファイルへの追記と新規ファイル作成を使い分ける：コーディングスタイル（言語レベル）、DB/サービス層（アーキテクチャレベル）、テスト（品質レベル）
- ルールファイルの `paths` でスコープを絞ることで、関係ないファイル編集時にノイズにならない

### サービス層の構造設計

- メインメソッド（公開エントリーポイント）をファイルの先頭に置き、プライベートなサブ関数を直後に配置する。これにより「何をするか」が先に目に入り、「どのようにするか」は後から読める
- メソッド分割の基準: DB クエリ・ビジネスロジック・DB 書き込みが混在している場合は「DB クエリを担当するプライベート関数」を抽出して 1 関数 1 責務に保つ
- バリデーションループを独立した関数（例: `validatePlacements`）に抽出すると、オーケストレーター関数が「validate → upsert」の 2 ステップだけになり意図が明確になる
- `export` を付けないことでプライベートであることを型として表現できる（TypeScript の慣習として `private` キーワードより明示的な場合がある）
- ファイル内のセクションをコメント（`// --- 1. 基本的な CRUD ---` 等）で区切ることで、大きいファイルでもナビゲーションコストを下げられる

### テスト設計

- `vi.mocked(prisma.xxx.findMany).mockResolvedValue(value as unknown as Awaited<ReturnType<typeof prisma.xxx.findMany>>)` の重複キャストはテストファイル内のヘルパー関数（`mockFindMany`, `mockFindUnique`）に抽出することで、各テストケースを 1 行で記述できる
- テストデータを fixture ファイルに分離すると、仕様変更時に fixture だけ更新すれば全テストが追随する。インライン定義より保守コストが低い。切り出す判断軸は「複数のテストケースで共有されるか」であり、`_utils` への切り出しとは無関係。単一テスト専用のデータはインラインのままで十分
- 「サービス関数を呼ばずインラインロジックだけ検証する」テストは削除してよい。サービスの動作を確認しないテストは仕様変更時に誤って削除されやすく、誤検知のリスクが高い
- `fail()` vs `error()` の選択: `fail()` はページに留まってフォーム結果を返す。`error()` または uncaught throw はエラーページに遷移する。フォームに `form.error` 表示 UI がない場合は throw させるだけで十分（`fail()` は意味をなさない）
- fixture から `filter` でサブセットを作る場合、フィルタ後のデータの中身をよく確認すること。同じ id でも fixture が更新されると別のタスク/グレードを指す可能性がある（今回: workBook 6 が Q10 ではなく Q8 になっていた）
- `Promise.all` で同一 mock 関数を複数回呼ぶ場合、`mockResolvedValueOnce` を呼び出し順に積み上げれば対応できる。`createInitialPlacements` のように内部で `Promise.all([findMany, findMany])` を使う関数も同様にテスト可能

### テスト補強パターン

- 純粋関数として `_utils` に抽出した関数（例: `buildUpdatedUrl`）は、抽出直後にテストを書かないと「テスト可能なはずなのに未テスト」の状態が続く。抽出と同時にテストを追加するか、テスト補強フェーズで必ず対象に含める
- URL 操作テストでは「元 URL が変更されないこと（非破壊）」を必ずアサートする。`new URL(url)` でコピーを作っている意図が保たれているかの検証になる
- クロスカラム移動（カードが A カラムから B カラムへ）では、A・B 両方のカラムが「変更あり」と判定されて `reCalcPriorities` に含まれる。移動先カラムだけでなく移動元カラムのアサーションも書くこと

### CSS / Tailwind

- 同じ CSS プロパティを複数クラスで指定すると競合警告が出る。置換後は VSCode の cssConflict 診断で即時確認する
- 競合するクラスは片方だけでなく両方を削除して、意図するクラスだけを残す

### 命令型 → 関数型変換

- 二重ループで `Map` を構築する処理は `flatMap(...).filter(...).map(...)` + `new Map(entries)` で書き直せる
- for-of ループで `Map` に追加する処理は `reduce((map, item) => map.set(key, value), new Map())` に置き換えられる
- `flatMap` で変更があるカラムだけ展開し、変更がない場合は `[]` を返すことで `filter + flatMap` の連鎖を1ステップに統合できる
- `{ a: null, b: null, [key]: value }` のように先に null で初期化して後から computed key で上書きするパターンは意図が明確。ただし「なぜ両方 null でも DB 違反にならないか」はコメントで明記すること

### コンポーネント再利用

- 複数ページで同じタブスタイルを使いたい場合は共通ラッパーコンポーネント（例: `TabItemWrapper`）に集約しておく。直接 `TabItem` にカスタム `activeClass`/`inactiveClass` を書くとページ間でスタイルが乖離しやすい

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
