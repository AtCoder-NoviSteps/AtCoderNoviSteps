# 問題集一覧 URLパラメータフィルタリング 実装計画

**Goal:** `/workbooks` ページで `WorkBookPlacement.priority` 順に問題集を表示し、URLパラメータ（`?tab=curriculum&grades=Q10` / `?tab=solution&categories=GRAPH` / `?tab=created_by_user`）でサーバーサイドフィルタリングを行う

**Architecture:** `+page.server.ts` でURLパラメータを解析し、タブに応じてサービス関数を呼び分ける。`CURRICULUM`/`SOLUTION` は `getWorkbooksByPlacement(query)` が `WorkBookPlacement` レコードで絞り込み・`priority ASC` ソートして返す。`CREATED_BY_USER` は `getWorkBooksCreatedByUsers()` を呼ぶ（管理者専用・非管理者は `FOUND` リダイレクト）。全タブとも単一 `workbooks` を返す。クライアントサイドのグレードフィルタリングを削除し、`goto()` + `buildWorkbooksUrl()` による SvelteKit クライアントサイドナビゲーションに置き換える。

---

## 背景・経緯

- PR #3252 で `WorkBookPlacement` モデルを使った管理者向け並び替え機能を実装済み
- PR #3281 で関連する機能について事前にリファクタリング
- 本タスクは管理者が設定した並び順を `/workbooks` 公開ページに反映させる

**決定済みの仕様:**

- placement レコードがない問題集は表示しない（Prisma のネスト where フィルタが IS NOT NULL を暗黙的に含む）
- `isReplenished` トグルはクライアントサイドのままで維持
- `CREATED_BY_USER` タブは管理者のみ閲覧可能（`?tab=created_by_user` URL パラメータ管理・非管理者は `redirect(FOUND, '/workbooks')` でリダイレクト）
- グレード/カテゴリ ボタンクリック → `buildWorkbooksUrl()` で URL 組み立て → `goto()` で SvelteKit クライアントナビゲーション
- URLパラメータなし時のデフォルト: カリキュラム Q10 / 解法別 SEARCH_SIMULATION
- 問題集が存在しないカテゴリはカテゴリボタンに表示しない（`getAvailableSolutionCategories()` でサーバーサイド判定）

---

## 方針・判断基準

| #   | 方針                                                                                    | 理由                                                                                                                                                         |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `WorkBookTab` は `WorkBookType` と同パターンの const オブジェクト                       | tab 値の比較にハードコード文字列を使うと変更に弱い。`WorkBookTab.CURRICULUM` 等の定数を使う                                                                  |
| 2   | `CREATED_BY_USER` は URL パラメータ管理（サーバーサイドフィルタリング）                 | ローカル `$state` での管理は URL の再現性がなく、URL 共有・直アクセスができない                                                                              |
| 3   | 非管理者が `?tab=created_by_user` にアクセスした場合は `redirect(FOUND, '/workbooks')`  | 空データを返すより明示的なリダイレクトの方が UX として正しい                                                                                                 |
| 4   | `workbooks` / `userCreatedWorkbooks` を統合し単一 `workbooks` に                        | 両方を常に fetch するのはパフォーマンス上の無駄。タブに応じて1回だけ呼ぶ                                                                                     |
| 5   | タブ分岐は `Record<WorkBookTab, () => string>` ルックアップ（if-else を廃止）           | 方針策定時は「if-else を維持」としたが refactor で撤回。各ラムダが call time にリアクティブな `data` を閉じ込めるため、`undefined` 非対称も解消              |
| 6   | `buildPlacementQuery()` は `+page.server.ts` 内のプライベートヘルパーとして維持         | 重複なし・1箇所のみ使用。utils への移動は過剰                                                                                                                |
| 7   | `WorkBookList.svelte` Props は discriminated union に変更                               | optional props + `?? fallback` は型安全でない。Svelte 5 では `let props: Props = $props()` または rest spread + `...restProps` で discriminated union を維持 |
| 8   | `workbookGradeModes` は discriminated union の CURRICULUM ブランチのみに配置            | `SolutionTable` は `workbookGradeModes: _` で破棄している。SOLUTION/CREATED_BY_USER では不要                                                                 |
| 9   | `AVAILABLE_CATEGORIES` はサーバーサイドで `getAvailableSolutionCategories()` により判定 | クライアント側は現在選択中のカテゴリの問題集しか持たないため、他カテゴリの存在を知れない                                                                     |
| 10  | `partitionWorkbooksAsMainAndReplenished` に改名                                         | `splitWorkbooksByReplenishment` は main の存在が不明。両端（main/replenished）が名前に現れる方が直感的                                                       |
| 11  | テスト内の mock パターンを `mockWorkbookFindMany()` 等のヘルパーとして切り出す          | プロジェクト規約（testing.md §Mock Helpers）。類似パターンの重複を防ぐ                                                                                       |
| 12  | `mapWithAuthorName()` をプライベート関数として切り出す                                  | `getPublishedWorkbooksByPlacement` / `getWorkBooksCreatedByUsers` で同一の `map()` が重複                                                                    |

---

## 却下した設計

| #   | 案                                                                                 | 却下理由                                                                                                             |
| --- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| R1  | `getWorkBooks()` を削除                                                            | `src/routes/sitemap.xml/+server.ts` で使用中。削除不可                                                               |
| R2  | `<Tabs>` 以降の各タブを `{#snippet}` で切り出す                                    | YAGNI。各タブはすでに `WorkBookList` コンポーネントに委譲済み。snippet 化は indirection を追加するだけ               |
| R3  | `CurriculumWorkBookList.svelte` / `SolutionWorkBookList.svelte` をコンポーネント化 | 細部の差異（`size="sm"` の有無・ラベル取得関数・active 判定ロジック）があり、抽象化コストが 2 箇所のメリットを上回る |
| R4  | `fetchWorkbooksByTab` を `async` に変更                                            | `async` は `await` を使う場合のみ必要。Promise をそのまま返す設計は意図通り                                          |
| R5  | E2E テスト: `for...of` を `test.each` 化                                           | Playwright にネイティブの `test.each` は存在しない。`for...of` ループが公式推奨のパラメータ化テストパターン          |
| R6  | E2E テスト: 定数を `$features/` からインポート                                     | `e2e/` は SvelteKit のパスエイリアスを解決しない（後述）。ローカル定数＋参照コメントが正解                           |

---

## 補足: SvelteKit `goto()` について

`$app/navigation` の `goto()` は Vue Router の `router.push()` に相当するクライアントサイドナビゲーション関数。`window.location` の変化（ブラウザリロード）は発生しないが、`+layout.svelte` が `{#if $navigating}` でスピナー表示するため UX 的にはリロード類似に見える。`$navigating` はサーバーから新しいデータが返るまで truthy のまま継続する。

**技術負債:** `+layout.svelte` が deprecated な `$app/stores` の `navigating` を使用中。SvelteKit 2.12+ では `$app/state` の `navigating` が推奨（本タスクのスコープ外）。

---

## 教訓・意思決定記録

> 「分類」は発見のきっかけになりやすいカテゴリ。同じ分類でミスが続く場合は該当カテゴリの確認を計画レビューに組み込むこと。

| #   | 分類     | 教訓                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 仕様確認 | 既存機能を「削除」として計画する前に「管理者のみに制限」という選択肢を確認する。「既存ユーザー向けに残す機能か」を確認してから削除を決める                                                                                                                                                                                                                                                                                                                                           |
| 2   | 実装調査 | ストアの実装（localStorage vs in-memory）は仮定でなく実コードを読んで確認する。`task_grades_by_workbook_type` は in-memory の Svelte `writable()` のみ。localStorage を使うのは `replenishmentWorkBooksStore` だけ                                                                                                                                                                                                                                                                   |
| 3   | 型設計   | SvelteKit では URLSearchParams を直接渡すパターンが標準。`string \| null` の引数型より `parseXxx(params: URLSearchParams)` の方がキャスト不要で安全（order ページの `parseInitialCategories(params)` が先例）                                                                                                                                                                                                                                                                        |
| 4   | 型設計   | サービス引数の分岐は discriminated union（`PlacementQuery`）で型レベルに閉じ込める。optional + fallback は呼び出し側に条件分岐を散らばらせる                                                                                                                                                                                                                                                                                                                                         |
| 5   | 仕様確認 | 管理者専用タブでも URL パラメータで状態管理する。URL の再現性・直アクセスのためには役割を問わず URL 駆動が正しい                                                                                                                                                                                                                                                                                                                                                                     |
| 6   | 型設計   | optional props + `?? fallback` より discriminated union Props が型安全。`let { common1, common2, ...restProps }: Props = $props()` の rest spread で TypeScript の discriminated union narrowing が維持される                                                                                                                                                                                                                                                                        |
| 7   | 型設計   | Props 設計前に使用先コンポーネントのソースを読む。`SolutionTable` が `workbookGradeModes: _` で破棄していることを見落とし、不要な prop を含めるミスを防ぐ                                                                                                                                                                                                                                                                                                                            |
| 8   | 型設計   | 型エイリアスを再エクスポートする前に消費側で `Record<T, *>` として使われていないか確認する。`export type { WorkBookTab as ActiveTab }` と計画したが `Record<ActiveTab, TabConfig>` が `created_by_user` を要求してエラー。必要なら `Exclude<T, 未使用値>` で絞り込む                                                                                                                                                                                                                 |
| 9   | スコープ | 実装コストが低く（サービス関数1つの追加）UX 価値が高い機能を安易にスコープ外にしない。「単に filtering するだけ」レベルの機能は同フェーズに含める                                                                                                                                                                                                                                                                                                                                    |
| 10  | 実装調査 | `e2e/` ディレクトリは SvelteKit のパスエイリアス（`$lib`、`$features`）を解決しない。E2E テスト内では URL 文字列値を `const TAB_CURRICULUM = 'curriculum'` のようにローカル定数として定義し、型インポートは避ける                                                                                                                                                                                                                                                                    |
| 11  | 仕様確認 | アクセス制御（タブ表示）とデータ可視性（非公開データの見え方）は別の仕様軸。アクセス制御を実装したら「見えるデータの範囲は何か」も明示的に確認する                                                                                                                                                                                                                                                                                                                                   |
| 12  | 仕様確認 | URL パラメータでフィルター状態を実装したら「どこから戻ってくるか」を列挙する。ブラウザ Back は URL を復元するが、サイト内ナビリンクは `/workbooks`（パラメータなし）に遷移する                                                                                                                                                                                                                                                                                                       |
| 13  | 実装品質 | UI パターン（空状態・ローディング等）を追加したら全タブ・全テーブルに適用されているか横断確認する。CURRICULUM/SOLUTION に `EmptyWorkbookList` を追加して CREATED_BY_USER を漏らしたミスから                                                                                                                                                                                                                                                                                          |
| 14  | テスト   | `includeUnpublished = true` のテストで「キーが存在しない」ことを `expect(callArg?.where).not.toHaveProperty('isPublished')` で確認する。`toHaveBeenCalledWith` でキーを含まないことの確認は「キーは存在するが値が違う場合」を見落とす                                                                                                                                                                                                                                                |
| 15  | 仕様確認 | sessionStorage 復元は「パラメータなし URL への遷移」のみに適用する（`window.location.search` が空のときだけ復元）。直アクセス（`?tab=curriculum`）やブラウザ Back（URL 復元済み）と衝突しない。復元ロジックを追加するたびに「どの遷移パターンが対象か・対象外か」を列挙すること                                                                                                                                                                                                      |
| 16  | UI実装   | Flowbite `ButtonGroup` はレスポンシブ折り返し非対応（内部的に `flex`）。折り返しが必要な場合は `<div class="flex flex-wrap gap-1">` + 個別 `Button` に切り替える（`TaskTable.svelte` が先例）                                                                                                                                                                                                                                                                                        |
| 17  | UI実装   | Tailwind v4 の important 修飾子は `dark:text-primary-500!`（v4形式）。v3 形式の `dark:!text-primary-500` は NG。IDE の `suggestCanonicalClasses` 警告で気づける                                                                                                                                                                                                                                                                                                                      |
| 18  | Svelte   | Svelte 5 コンポーネントの `<script>` 内で `let x = data.y` や `const x = expr(props.y)` は初期値しか取らない。props や server data から派生する値は必ず `$derived(expr)` を使う。`pnpm check` が "This reference only captures the initial value" と警告する（phase-11 finding #1: `loggedInUser`/`role`/`tasksMapByIds` が `data` 更新後に古い値を保持していたバグ。phase-5 finding: `AVAILABLE_CATEGORIES` が `const` のため `availableCategories` prop 変化に反応しなかったバグ） |
| 19  | Svelte   | Discriminated union Props の narrowing は `let props: Props = $props()` でアクセスする場合に効く。ただし共通フィールドだけ destructure し残りを `...restProps` に集めた場合も TypeScript は `restProps` を discriminated union として正しく推論する（`{ common1, common2, ...restProps }: Props = $props()`）。全フィールドを destructure すると narrowing が失われるので注意                                                                                                        |
| 20  | 実装品質 | 同じ派生計算（`buildTaskResultsByWorkBookId()` 等）がテンプレートや関数内で複数回呼ばれていないか、実装後に grep で確認する。計画段階で「同じ関数が2回以上現れるか」を見越して単一の `$derived` に集約する設計にする（phase-11 simplify: 3箇所での重複呼び出しを `$derived` に統合）                                                                                                                                                                                                 |
| 21  | 仕様確認 | sessionStorage で URL を復元するときは `goto(url, { replaceState: true })` を使い、ブラウザ履歴を汚染しない。`replaceState: false`（デフォルト）だと復元のたびに履歴エントリが増え、Back キーの挙動が壊れる                                                                                                                                                                                                                                                                          |

---

## 最終検証

- [x] `pnpm test:unit` — 全ユニットテスト通過（1952 passed, 1 skipped）
- [ ] `pnpm test:e2e -- --grep "workbooks"` — E2Eテスト通過（手動実行要）
- [x] `pnpm check` — 型エラーなし（既存の auth 2件のみ）
- [x] `pnpm lint` — Lintエラーなし（警告のみ）
- [x] `pnpm format` — フォーマット適用済み
- [x] `coderabbit review --plain` — 22件、全て nitpick/potential_issue。critical/high なし
- [ ] `/session-close`
- [ ] 手動確認（`pnpm dev`）:
  - `/workbooks` → カリキュラム Q10 が表示
  - グレードボタンクリック → URL・コンテンツ更新
  - 解法別タブクリック → `?tab=solution&categories=SEARCH_SIMULATION`
  - カテゴリボタンクリック → URL・コンテンツ更新
  - 問題集が存在しないカテゴリのボタンが非表示
  - `/workbooks?tab=solution&categories=GRAPH` 直アクセス → 正しく表示
  - 管理者: `/workbooks?tab=created_by_user` → ユーザ作成タブが表示
  - 一般ユーザ: `/workbooks?tab=created_by_user` → `/workbooks` にリダイレクト
  - 補充教材トグルが引き続き動作する
