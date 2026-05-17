# タスクインポートページ: ソース別取得リファクタリング

## 背景・課題・目的

### 課題

1. **拡張困難**: 対応コンテストサイト・種別の追加に複数クラスの変更が必要。
2. **API アクセス過多**: `/tasks` ページ初期ロード時に AtCoder + AOJ 全種別（5種類）を並列取得。管理者が特定ソースしか必要としない場合も全ソースの API を叩く。
3. **AojApiClient の god class**: `this.apiClients` がコンストラクタ内にハードコーディングされており、新しい AOJ コンテスト種別の追加が `AojApiClient` 内部変更を伴う。
4. **継承が深い**: `AojTasksApiClientBase` → `AojCoursesApiClient` / `AojChallengesApiClient` の継承構造が shared logic の追跡を難しくしている。

### 目的

- **アクセス削減**: ボタン押下時に選択されたソースのみ取得する
- **拡張容易化**: 新ソースを `ContestTaskImportSource` 型と `importSources` に 1 エントリ追加するだけで対応できる構造へ
- **設計改善**: 継承廃止・関数ベースへの整理（AOJ 特有の部分と汎用部分の分離）
- 関連 PR: #3524（事前に関連ファイルを機能単位で集約）の続き。次 PR: AOJ ICPC 系統の追加

---

## 設計決定と根拠

### 1. データ取得トリガー: form action (`?/fetch`) + `use:enhance`

`load()` はページ初期表示時に API を叩かない。ユーザーがソースを選択して「データ取得」ボタンを押すと `?/fetch` action に POST され、選択されたソースのみ API を叩く。

- URL が変わらない → ブックマーク・ブラウザバックが不要な管理者画面に適切
- 既存の `?/create` / `?/update` と同じ SvelteKit form action パターンで一貫性を保つ

### 2. clients/index.ts: dispatcher パターン

`ContestTaskImportSource` を flat な string union type として定義し、`importSources` オブジェクトに `label` / `contests` / `tasks` の 3 属性を集約する。

**個別関数案（却下）:**
`fetchAojPckPrelimContests()` 等の個別関数は理解しやすいが、`+page.server.ts` 側に source-specific な if/switch が生まれる。

**Dispatcher 採用の理由:**

- 呼び出し側がシンプルになり、新ソース追加は `importSources` への 1 エントリ追加だけで完結する
- flat string union のため、フォームデータのバリデーションが容易（`isContestTaskImportSource()` 型ガードで境界検証）
- `Record<ContestTaskImportSource, ...>` により新ソース追加時のキー漏れをコンパイルエラーで検出
- 対応ソースが増えるほど優位性が増す（次 PR: ICPC 追加が予定されている）

### 3. AojApiClient の廃止・god class 解体

旧 `AojApiClient` は削除。`clients/index.ts` の dispatcher が同等の責務を担う。`AojTasksApiClientBase` も削除し、shared logic は standalone 関数として `contest_task_fetcher.ts` に切り出す。

**継承廃止の理由:** `getCachedOrFetchContests` / `getCachedOrFetchTasks` は `httpClient` と `cache` を引数に受け取れば独立して動作する。継承より合成（composition）のほうが依存関係が明示的。

**`contest_task_fetcher.ts` を `aizu_online_judge/` 外に配置した理由:** シグネチャに AOJ 固有の型を持たせない設計にすることで、将来 AtCoder クライアントがキャッシュを導入する際にも再利用可能にする。

**`fetchAllData` のエラー握りつぶしを廃止した理由:** 旧実装は try/catch + `return []` でエラーを黙殺していた。ユーザーが明示的にソースを選んだ場合、空配列が返っても原因がわからないため、エラーを上位に伝播させる方針に変更。

### 4. 検索・ページネーション: 分離コンポーネント + 親での状態管理

**ラッパー案（却下）:**
ラッパーコンポーネントは `Contests` 型を知る必要があり汎用性が低い。TaskTableForImport を包む専用ラッパーは indirection を増やすだけで再利用性を生まない。

**TaskTableForImport 直接実装案（却下）:**
TaskTableForImport が状態を持つと、将来他ページに描画ロジックを切り出す際に状態管理の責務が混在する。

**採用: コンポーネント分離 + 親管理**
`TaskSearchBox` / Flowbite `Pagination` を独立配置し、`TaskTableForImport` は描画専念。`+page.svelte` が `$state` / `$derived` で状態とフィルタ計算を保持する。

### 5. `?/update` の `tasks/[task_id]/+page.server.ts` への移設

元の実装は `?/update` 内で未登録タスクの登録という副作用を持っていた。しかし `?/create` でコンテストインポート時に全タスクが登録済みのため、`update` 時点で未登録タスクは存在しない。論理的に到達不能なケースを処理しようとしており無意味なため、副作用を削除して `taskService.updateTask()` のみに絞り、移設する。

### 6. `TaskListForEdit.svelte` を `_components/` へ移動

`src/lib/` は reusable なコードの置き場。使用箇所が `/tasks` ルートのみのコンポーネントを置くのは不適切。`workbooks/order/_components/` と同じパターンに統一。

### 7. フィクスチャを raw API レスポンス形式で保持する方針

旧 `record_requests.ts` は変換済みデータ（`ContestsForImport`）をフィクスチャに保存していた。これは nock でモックすると「raw API レスポンスを返す nock → クライアントが変換 → アサート」という正しいテストフローが成立せず、変換ロジックがゼロカバレッジになっていた。

**方針:** フィクスチャには raw API レスポンスをそのまま保存し、変換処理はクライアント実装の中でテストする。courses と challenges で `contests.json` のスキーマが異なる（courses: `{ filter, courses[] }`、challenges: `{ largeCl, contests[] }`）ため、種別ごとにディレクトリを分割して管理する。

**AOJ challenges の特殊性:** challenges エンドポイント（`/challenges/cl/{type}/{round}`）はコンテストと問題の両方を1レスポンスで返す（`days[].problems` に埋め込み）。`tasks.json` は不要で、`contests.json` 1ファイルから両方を取り出す。この設計はクライアントコードのコメントに記載済み。

### 8. `create` アクションで `fetchTasks` を呼ばない理由（AOJ サイレント失敗の修正）

旧実装の `create` アクションはインポートボタン押下時に `fetchTasks(source)` を再度呼び出していた。`getCachedOrFetch` のキャッシュが切れた場合（開発サーバー再起動など）、AOJ API への再リクエストが失敗すると catch で `[]` を返し、**何も保存せず `{ success: true }` を返す**（サイレント失敗）。AtCoder は複数回呼んでも安定しているため、AOJ 限定の不具合として気づきにくかった。

**修正方針:** `fetch` アクション実行時に取得済みのタスクデータをフォームの hidden input に JSON で乗せ、`create` アクションはフォームから受け取ったデータをそのまま使う。再 API コールを排除することでキャッシュミスの影響を受けない。

### 9. Flowbite `Pagination` から `PaginationNav` への変更

Flowbite Svelte v1.33.1 の `<Pagination>` コンポーネントは `pages` 配列に `onclick` を渡しても Svelte 5 で機能しない。`<PaginationNav>` は `onPageChange: (page: number) => void` を受け取り、numbered pages を正しく描画する。

### 10. `use:enhance` コールバックで `update()` も `applyAction()` も呼ばない理由

`update()` はもちろん、`applyAction()` も内部で `invalidateAll()` を呼び出す。これにより Flowbite Select の内部状態がリセットされ、ドロップダウンが AtCoder に戻る。どちらも呼ばずに `result.data` を直接 `$state` に代入することで `invalidateAll()` を完全に回避する。

### 11. `importContests` をローカル `$state` で保持する理由

`create` アクション成功後、SvelteKit は `form` prop を `{ success: true }` で上書きする。`importContests` を `form.importContests` から直接参照していると一覧が消える。ローカル `$state` として保持し、`form.importContests` が存在するときだけ同期することで、`create` 後も一覧を維持できる。

### 12. Superforms を採用しない理由

`fetch` フォームの入力は `source` 1フィールドのみ。Zod スキーマ・`superValidate`・両ファイルの変更コストに対して、得られる機能（`$delayed`・`$message`）は手動の `isFetching` / `fetchError` 2変数で代替できる。`importContests` はフォーム入力ではなくアクションの返却データであり Superforms が管理しない。Superforms は「フィールド単位のバリデーションエラー表示が必要なフォーム」向き。

### 13. E2E テストを追加しない理由

`?/fetch` はサーバーサイドで外部 API を呼ぶため Playwright の `page.route()` でインターセプトできず、自動化コストが高い。admin 限定ページかつ手動確認で十分と判断。

---

## 教訓

### `$effect` を介した `form` → ローカル state 同期は信頼できない

`applyAction(result)` → `form` prop 更新 → `$effect` で `importContests` に代入する 2 段階同期は、Svelte 5 で同じ構造のオブジェクトが連続して返ると `$effect` が再発火しないことがある。`use:enhance` コールバック内で `result.data` を直接 `$state` に代入するほうが確実でシンプル。

---

## 残タスク（このPR対象外）

- `filterUnregisteredTasks()` を `_utils/` に切り出してテストを追加（`classifyContest()` 依存のロジックあり、テスト価値あり）
- AOJ ICPC 系統のコンテスト追加（次 PR）
- ソートの実装（検索・ページネーション安定後の別 PR）
