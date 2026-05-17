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

`load()` はページ初期表示時に API を叩かない（`{ importContests: null }` を返す）。
ユーザーがソースを選択して「データ取得」ボタンを押すと `?/fetch` action に POST され、選択されたソースのみ API を叩く。

- URL が変わらない → ブックマーク・ブラウザバックが不要な管理者画面に適切
- 既存の `?/create` / `?/update` と同じ SvelteKit form action パターンで一貫性を保つ
- `use:enhance` でページ全体リロードなし（問題表示部分のみ更新）

### 2. clients/index.ts: dispatcher パターン

`ContestTaskImportSource` を flat な string union type として定義し、`importSources` オブジェクトに `label` / `contests` / `tasks` の3属性を集約する。`fetchContests` / `fetchTasks` / `getImportSourceLabel` / `importSourceEntries` を export する。

```typescript
export type ContestTaskImportSource =
  | 'atcoder'
  | 'aoj_courses'
  | 'aoj_pck_prelim'
  | 'aoj_pck_final'
  | 'aoj_jag_prelim'
  | 'aoj_jag_regional';
```

**個別関数案との比較:**

- 個別関数（`fetchAojPckPrelimContests()` 等）は理解しやすいが、`+page.server.ts` 側に source-specific な if/switch が生まれる
- Dispatcher は呼び出し側がシンプルになり、新ソース追加は `importSources` への1エントリ追加だけで完結する
- `ContestTaskImportSource` が flat string union のため、フォームデータのシリアライズ・バリデーションが容易（`isContestTaskImportSource()` 型ガードで境界検証）
- 対応ソースが増えるほど dispatcher の優位性が増す（次 PR: ICPC 追加が予定されている）

### 3. AojApiClient の廃止・god class 解体

旧 `AojApiClient`（`this.apiClients` ハードコーディング）は削除。`clients/index.ts` の dispatcher が同等の責務を担う。`AojTasksApiClientBase` も削除し、shared logic は standalone 関数として `aizu_online_judge/contest_task_fetcher.ts` に切り出す。

- **継承廃止の理由**: `getCachedOrFetchContests` / `getCachedOrFetchTasks` は `httpClient` と `cache` を引数に受け取れば独立して動作する。継承より合成（composition）のほうが依存関係が明示的。
- `AojCoursesApiClient` / `AojChallengesApiClient` は `(httpClient, cache)` を constructor で受け取るスタンドアロンクラスとして存続。

### 4. 検索・ページネーション: 分離コンポーネント + 親での状態管理

**ラッパー案（却下）:**
ラッパーコンポーネントは `Contests` 型を知る必要があり汎用性が低い。TaskImportTable を包む専用ラッパーは indirection を増やすだけで再利用性を生まない。

**TaskImportTable 直接実装案（却下）:**
TaskImportTable が状態を持つと、将来他ページに描画ロジックを切り出す際に状態管理の責務が混在する。

**採用: コンポーネント分離 + 親管理**

- `TaskSearchBox.svelte` — 検索入力（`bind:value` で `searchQuery` を親と共有）
- Flowbite `Pagination` — ページネーション（`+page.svelte` で直接使用）
- `TaskImportTable` — 描画専念。フィルタ済み・ページ済み `Contests` を props で受け取るだけ
- `+page.svelte` — `$state` で `searchQuery` / `currentPage` を持ち、`$derived` でフィルタ・スライスを計算

この構造により TaskImportTable は純粋な描画コンポーネントとして保たれ、`TaskSearchBox` は将来の再利用の余地を持つ。

---

## ファイル変更一覧

```
src/lib/clients/
├── index.ts                         # 変更: ContestTaskImportSource + dispatcher 関数
├── contest_task_fetcher.ts          # 新規: getCachedOrFetchContests/Tasks standalone 関数（汎用）
├── aizu_online_judge/
│   ├── clients.ts                   # 変更: 継承廃止・god class 削除
│   ├── clients.test.ts              # 変更: 新クラス構造に合わせて更新
│   ├── types.ts                     # 変更なし
│   └── utils.ts                     # 変更なし
└── fixtures/
    └── aizu_online_judge/
        ├── courses/                 # 新規（既存の混在データから分割）
        │   ├── contests.json
        │   └── tasks.json
        └── challenges/              # 新規
            ├── pck_prelim/
            │   ├── contests.json
            │   └── tasks.json
            ├── pck_final/
            │   ├── contests.json
            │   └── tasks.json
            ├── jag_prelim/
            │   ├── contests.json
            │   └── tasks.json
            └── jag_regional/
                ├── contests.json
                └── tasks.json

src/routes/(admin)/tasks/
├── +page.server.ts                  # 変更: load 空返却・fetch action 追加・create/update 修正
├── +page.svelte                     # 変更: Source 選択 UI・状態管理追加
└── _components/
    ├── TaskImportTable.svelte       # 移動 + 変更: lib/components/ から移動・リネーム・source prop 追加
    └── TaskSearchBox.svelte    # 新規: 検索入力コンポーネント

src/lib/components/
└── TaskListForEdit.svelte           # 削除（_components/ へ移動）
```

---

## 実装フェーズ

### Phase 1: フィクスチャ整理とテスト先行（TDD: Red）

**狙い:** 新クラス構造に対するテストを先に書く。この時点では実装が変わっていないので一部テストは失敗する（Red）。Phase 2 の実装でパスさせる。

**タスク:**

1. 既存 `fixtures/aizu_online_judge/contests.json` / `tasks.json` を分析し、種別ごとに振り分け
   - courses: `shortName` 形式のコンテスト ID（ITP1, ALDS1 等）
   - pck_prelim / pck_final / jag_prelim / jag_regional: challenge 系

2. 各種別のディレクトリと JSON ファイルを作成（最低 2〜3 件のサンプルデータ）

3. `AojCoursesApiClient` のテストを `courses/` フィクスチャで新規作成
   - Nock で `/courses` エンドポイントをモック
   - `getContests()` / `getTasks()` の構造検証
   - 備考: 現テストは `client.getContests = async () => mock` でメソッドを差し替えており、`getCachedOrFetchContests` / `getCachedOrFetchTasks` はゼロカバレッジ。Nock ベースに変えることで HTTP fetch → transformer → キャッシュのパスが初めてカバーされる。専用単体テストは不要（`getContests()` 経由で間接カバー十分）

4. `AojChallengesApiClient` のテストを各種別フィクスチャで新規作成（PCK PRELIM / PCK FINAL / JAG PRELIM / JAG REGIONAL 各1テスト）

5. 既存の `fixtures/aizu_online_judge/contests.json` / `tasks.json`（混在ファイル）と旧テストを削除

**検証:** 新テストが Red（失敗）であることを確認。既存テストは削除済みのため競合なし。

---

### Phase 2: AOJ クライアントリファクタリング（TDD: Green）

**狙い:** Phase 1 で書いたテストをパスさせる形で継承廃止・god class 削除を実装する。

**タスク:**

1. `src/lib/clients/contest_task_fetcher.ts` を新規作成（`aizu_online_judge/` 外に配置）
   - `getCachedOrFetchContests<T>(httpClient, cache, config)` standalone 関数
   - `getCachedOrFetchTasks<T>(httpClient, cache, config)` standalone 関数
   - シグネチャに AOJ 固有の型なし（`HttpRequestClient` / `ContestTaskCache` / `ContestsForImport` / `TasksForImport` はすべて `clients/` レベルの汎用型）
   - ログラベルの "AOJ" 固定文字列を削除し `label` パラメータに統合（例: `label: 'AOJ course'`）
   - 将来 AtCoder クライアントがキャッシュを導入する際にも再利用可能

2. `AojCoursesApiClient` を `AojTasksApiClientBase` から切り離す
   - `constructor(private httpClient, private cache)` に変更
   - `getCachedOrFetch*` を standalone 関数呼び出しに変更
   - 継承: なし

3. `AojChallengesApiClient` も同様に切り離す

4. `AojTasksApiClientBase` クラスを削除

5. `AojApiClient` (god class) を削除

**検証:** `pnpm test:unit` で Phase 1 のテストがすべてパス（Green）

---

### Phase 3: clients/index.ts の再設計

**狙い:** Dispatcher 関数の提供。`+page.server.ts` 側がルーティングロジックを持たない構造へ。

**タスク:**

1. `ContestTaskImportSource` 型を定義・export

2. `isContestTaskImportSource(value: unknown): value is ImportSource` 型ガードを実装
   - 境界検証（フォームデータの `source` フィールド検証に使用）

3. `importSources` オブジェクトを定義し `fetchContests` / `fetchTasks` / `getImportSourceLabel` を実装

   ```typescript
   type ContestTaskImportSourceConfig = {
     label: string;
     contests: () => Promise<ContestsForImport>;
     tasks: () => Promise<TasksForImport>;
   };

   // AOJ Challenges の contests/tasks で params が重複しないようにヘルパーを用意
   function buildAojChallengeConfig(
     params: ChallengeParams,
     label: string,
   ): ContestTaskImportSourceConfig {
     return {
       label,
       contests: () => aojChallengesClient.getContests(params),
       tasks: () => aojChallengesClient.getTasks(params),
     };
   }

   const importSources: Record<ContestTaskImportSource, ContestTaskImportSourceConfig> = {
     atcoder: {
       label: 'AtCoder',
       contests: () => atCoderClient.getContests(),
       tasks: () => atCoderClient.getTasks(),
     },
     aoj_courses: {
       label: 'AOJ - コース',
       contests: () => aojCoursesClient.getContests(),
       tasks: () => aojCoursesClient.getTasks(),
     },
     aoj_pck_prelim: buildAojChallengeConfig(
       { contestType: 'PCK', round: 'PRELIM' },
       'AOJ - パソコン甲子園 予選',
     ),
     aoj_pck_final: buildAojChallengeConfig(
       { contestType: 'PCK', round: 'FINAL' },
       'AOJ - パソコン甲子園 本選',
     ),
     aoj_jag_prelim: buildAojChallengeConfig(
       { contestType: 'JAG', round: 'PRELIM' },
       'AOJ - JAG 模擬国内',
     ),
     aoj_jag_regional: buildAojChallengeConfig(
       { contestType: 'JAG', round: 'REGIONAL' },
       'AOJ - JAG 模擬地区',
     ),
   };

   export const fetchContests = (source: ContestTaskImportSource) =>
     importSources[source].contests();
   export const fetchTasks = (source: ContestTaskImportSource) => importSources[source].tasks();
   export const getImportSourceLabel = (source: ContestTaskImportSource) =>
     importSources[source].label;
   export const importSourceEntries = Object.entries(importSources) as [
     ContestTaskImportSource,
     ContestTaskImportSourceConfig,
   ][];
   ```

   - `label` / `contestType` / `round` の3属性が `importSources` の1箇所に集約。UI ラベルテーブルは不要になる
   - `Record<ContestTaskImportSource, ...>` により新ソース追加時のキー漏れをコンパイルエラーで検出
   - `importSourceEntries` を `<Select>` の選択肢生成に使用（`+page.svelte` 側でループ）
   - AOJ Challenges の `params` は `buildAojChallengeConfig()` ヘルパーで重複排除

4. `AojApiClient.constructor` にあったインスタンス生成ロジックを `clients/index.ts` に移行する
   - `AojApiClient` は Phase 2 で削除済み。`clients/index.ts` の `createClients()` も削除し、モジュールスコープのシングルトンとして直接生成する

   ```typescript
   // clients/index.ts（Phase 3 後のイメージ）
   const caches = new ContestTaskCache(new Cache<ContestsForImport>(), new Cache<TasksForImport>());
   const aojHttpClient = new HttpRequestClient(AOJ_API_BASE_URL);

   const aojCoursesClient = new AojCoursesApiClient(aojHttpClient, caches);
   const aojChallengesClient = new AojChallengesApiClient(aojHttpClient, caches);
   ```

   - `contestCache` / `taskCache` / `aojHttpClient` は courses と challenges で共有（現在の `AojApiClient` と同じ設計）
   - `fetchAllData` の `Promise.allSettled` は新設計では不要（1ソース = 1クライアント呼び出し）のため削除
   - `fetchAllData` のエラー処理（try/catch + `return []`）は `fetchContests` / `fetchTasks` では行わずエラーを上位に伝播させる。握りつぶしをやめる理由: ユーザーが明示的にソースを選んだ場合、空配列が返っても原因がわからない
   - 備考: Phase 2 で `AojApiClient` を削除した直後は `clients/index.ts` の import が壊れる（中間状態）。Phase 3 で同時に解消する

5. 旧 `getContests()` / `getTasks()` を削除
6. `mergeDataFromAPIs()` を削除し、メトリクスログを `fetchContests` / `fetchTasks` 内に移植
   - 複数ソースの集約・重複排除ロジックは不要になるため削除
   - `errorCount` / `totalTime` は新設計では意味をなさないため削除（エラーは伝播、重複排除なし）
   - `source` / `type` を追加し、1ソース単位で計測する形に変更

   ```typescript
   export const fetchContests = async (
     source: ContestTaskImportSource,
   ): Promise<ContestsForImport> => {
     const start = performance.now();
     const result = await importSources[source].contests();

     console.info('API metrics:', {
       source,
       type: 'contests',
       itemCount: result.length,
       apiTime: `${(performance.now() - start).toFixed(0)}ms`,
     });

     return result;
   };
   // fetchTasks も同様
   ```

**検証:** `pnpm test:unit` 全テストパス（Phase 4 実装前のため +page.server.ts はまだ壊れている点に注意）

---

### Phase 4: サーバーサイド変更

**狙い:** `load()` の API 呼び出し削除・`?/fetch` action 追加・既存 action の source 対応。

**タスク:**

1. `?/fetch` action を新規追加
   - `source` をフォームデータから取得し `isContestTaskImportSource()` でバリデーション（不正なら `fail(BAD_REQUEST, ...)` ）
   - `fetchContests(source)` + `fetchTasks(source)` + `taskService.getTasks()` を実行。API 例外は catch して `fail(INTERNAL_SERVER_ERROR, { message: 'データ取得に失敗しました' })` を返す
   - `BAD_REQUEST` / `INTERNAL_SERVER_ERROR` は `$lib/constants/http-response-status-codes` から import
   - `prepareTaskMap(tasksFromDB)` → `filterUnregisteredTasks()` → `mergeContestsAndUnregisteredTasks()` で整形して `importContests` を返す

2. `load()` を変更 — `fetchContestsAndTasksFromAPI()` 呼び出し・DB アクセス・データ整形ロジックを削除。`validateAdminAccess` のみ残す（return なし）。`importContests` は `form` prop 経由で受け取るため `load()` から返す必要はない。なお `prepareTaskMap` / `filterUnregisteredTasks` / `mergeContestsAndUnregisteredTasks` はファイル内ローカル関数として残し、呼び出し元を `load()` から `?/fetch` に変えるだけ

3. `fetchContestsAndTasksFromAPI()` を削除

4. `?/create` action を修正
   - フォームデータから `source: ImportSource` を受け取り `isContestTaskImportSource()` でバリデーション
   - `apiClient.getTasks()` → `fetchTasks(source)` に変更

5. `?/update` action を `tasks/[task_id]/+page.server.ts` へ移設
   - `apiClient.getTasks()` + `createTask()` の副作用を削除し `taskService.updateTask()` のみに残す
   - 理由: `?/create` でコンテストインポート時に全タスクが登録済みのため、`update` 時点で未登録タスクは存在しない。副作用は論理的に到達不能なケースを処理しようとしており無意味
   - `TaskForm.svelte` の `action="/tasks?/update"` → `action="?/update"`（相対パスに変更）
   - `(admin)/tasks/+page.server.ts` から `update` action を削除
   - `source` 不要のため `TaskForm.svelte` へのフィールド追加は不要

**検証:**

- `pnpm test:unit` 全テストパス
- 手動: `tasks/[task_id]` でグレードを変更 → 保存後に値が反映されていること（`?/update` 移設後の動作確認）

---

### Phase 5: UI 変更（最高リスク）

**狙い:** Source 選択 + データ取得ボタン + 検索 + ページネーション UI の実装。

**タスク:**

1. `src/lib/components/TaskListForEdit.svelte` を `src/routes/(admin)/tasks/_components/TaskTableForImport.svelte` へ移動・リネーム
   - `+page.svelte` のインポートパスを更新
   - 背景: `src/lib/` は reusable なコードの置き場。使用箇所が 1 ルートのみのコンポーネントを置くのは不適切。`workbooks/order/_components/` と同じパターンに統一。

2. `_components/TaskSearchBox.svelte` を新規作成
   - props: `bind:value` の `searchQuery: string`、`placeholder?: string`
   - Flowbite `Input` コンポーネントを使用
   - アクセシビリティ: `<Label>` と紐づける
   - サニタイズ処理は不要: `searchQuery` は `bind:value`（DOM 値として扱われるのみ）と `$derived` の文字列比較にしか使わない。`{@html ...}` を使わない限り Svelte がテンプレート式を自動エスケープするため XSS の経路がない。加えて admin 限定ページのため攻撃対象も限定的

3. `_components/TaskTableForImport.svelte` を変更
   - `source: ImportSource` prop を追加（インポートフォームの hidden field に使用）
   - 既存の `importContests: Contests` prop はそのまま（フィルタ済み・ページ済みデータを受け取る）
   - `{#if importContest.tasks.length > 0}` のフィルタは削除（呼び出し元でフィルタ済みになるため）

4. `+page.svelte` を変更
   - source 選択: Flowbite `Select` + "データ取得" `Button`（`?/fetch` form action, `use:enhance`）。選択肢は `importSourceEntries` をループして生成（各エントリの `config.label` を表示テキストに使用）
   - `form` prop から `importContests` を受け取る（`let { data, form } = $props()`）
   - `searchQuery = $state('')` / `currentPage = $state(1)` / `PAGE_SIZE = 20` を追加
   - `$derived` でフィルタ・ページング計算:
     ```
     filtered = importContests.filter(tasks.length > 0 かつ searchQuery にマッチ)
     paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
     ```
   - `_components/TaskSearchBox` / `_components/TaskTableForImport` / Flowbite `Pagination` を配置
   - source が変わるたびに `currentPage = 1` にリセット

**検証:** 開発サーバーで手動確認（後述）

---

## 破壊的変更まとめ

| 変更                                          | 影響                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------------- |
| `AojApiClient` 削除                           | `clients/index.ts` のみが参照元 → Phase 3 で同時修正                                   |
| `AojTasksApiClientBase` 削除                  | 継承元 → Phase 1 で解消                                                                |
| `getContests()` / `getTasks()` 削除           | `+page.server.ts` が参照 → Phase 4 で修正                                              |
| `load()` が return なし（空）になる           | `importContests` は `form` prop 経由に変わる → Phase 5 UI で対応                       |
| `?/create` の `source` 必須化                 | TaskTableForImport のフォームに hidden field 追加が必要                                |
| `?/update` の副作用削除・移設                 | `tasks/[task_id]/+page.server.ts` へ移動。`TaskForm.svelte` の action を相対パスに変更 |
| AOJ fixtures ディレクトリ構造変更             | テストコードの fixture パス変更                                                        |
| `TaskTableForImport` を `_components/` へ移動 | `+page.svelte` のインポートパス変更（1 箇所のみ）                                      |

---

## 検証方法

### 単体テスト（各 Phase 後に実行）

```bash
pnpm test:unit
```

### 型チェック

```bash
pnpm check
```

### E2E テストについて

このPRでは E2E テストを追加しない。理由：`?/fetch` はサーバーサイドで外部 API を呼ぶため Playwright の `page.route()` でインターセプトできず、自動化コストが高い。admin 限定ページかつ下記の手動確認で十分と判断。

### 結合確認（Phase 4-5 完了後・手動）

1. `pnpm dev` で開発サーバー起動
2. 管理者アカウントで `/tasks` にアクセス → 初期表示で外部 API が叩かれないことをブラウザ Network タブで確認
3. ドロップダウンで各ソース（6 種）を選択 → 「データ取得」ボタン押下 → 該当ソースの API のみ呼ばれること
4. 未登録タスクが表示されること
5. 検索フィールドに入力 → リアルタイムフィルタリング（コンテスト ID / タイトル）
6. ページネーション操作
7. 「インポート」ボタン押下 → タスク登録成功・画面が更新されること
8. ソース変更後に再取得 → 前の結果がクリアされること

---

## 残タスク（このPR対象外）

- `filterUnregisteredTasks()` を `_utils/` に切り出してテストを追加（`classifyContest()` 依存のロジックあり、テスト価値あり）
- AOJ ICPC 系統のコンテスト追加（次 PR）
- ソートの実装（検索・ページネーション安定後の別 PR）
