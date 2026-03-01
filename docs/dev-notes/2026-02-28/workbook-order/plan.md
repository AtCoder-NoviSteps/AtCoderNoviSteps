# 計画: 問題集の並び順管理 (Issue #943)

## Context

管理者が問題集（カリキュラム、解法別）の表示順序をカンバンボード UI でドラッグ&ドロップ管理できるようにする。現状は並び順を管理する仕組みがなく、workbook.id 昇順で暗黙的に運用している。

**スコープ**: 本 Issue はカンバン管理画面の実装のみ。ユーザー向け `/workbooks` ページの表示順への反映は別 Issue で次リリース対応。

---

## 確定事項

| 項目            | 決定内容                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| URL             | `/(admin)/workbooks/order` (静的セグメントで `[slug]` より優先される)                                    |
| 対象            | CURRICULUM、SOLUTION のみ（CREATED_BY_USER は除外）                                                      |
| DB 設計         | **案B**: `WorkBookPlacement` 別テーブルに `solutionCategory` + `taskGrade` + `priority` を集約           |
| パネル間移動    | CURRICULUM間: 許可、SOLUTION間: 許可、CURRICULUM↔SOLUTION: **禁止**                                      |
| 管理者判断      | パネル間移動後は管理者の判断が計算値（最頻値）より優先される                                             |
| 保存タイミング  | ドロップ時に即時保存（楽観的更新 + エラー時ロールバック）                                                |
| DnD ライブラリ  | `@dnd-kit/svelte`（公式版 dndkit.com/svelte、Svelte 5.29+ 対応）                                         |
| THEME enum      | 初期リリースから除外（YAGNI）                                                                            |
| priority 再計算 | 連番振り直し（1, 2, 3, ...）。ドロップ時にパネル内全カードを再番号付け                                   |
| sortable group  | CURRICULUM タブ / SOLUTION タブそれぞれで同一 group を使用し、クロスリスト移動を許可                     |
| 問題集の追加    | form action（POST）で「ボードに問題集を追加」ボタン押下時に実行（load() での GET 時 DB INSERT は避ける） |
| UI レイアウト   | タブ切替（CURRICULUM / SOLUTION）+ PENDING ピン留め + セレクトボックスで表示カラム選択                   |
| 状態管理        | タブ・セレクトボックスの選択状態は URL パラメータで管理（`?tab=solution&cols=PENDING,GRAPH`）            |
| 保存の入力形式  | Superforms 経由で form action を呼出。placement の `id` で識別                                           |
| DnD リスク      | @dnd-kit/svelte は発展途上。代替候補: SortableJS（`use:action` ラップ必要、ライブラリ自体は安定）        |
| 未公開 workbook | placement を作成する（管理画面で全 workbook を管理可能）。カードに未公開バッジを表示                     |
| DnD helpers     | `@dnd-kit/helpers`（`move()` 関数）を別途インストール必要                                                |

---

## DB 設計

### 1. 新 enum `SolutionCategory`

```prisma
enum SolutionCategory {
  PENDING             // 未分類
  SEARCH_SIMULATION   // 探索・シミュレーション・実装
  DYNAMIC_PROGRAMMING // 動的計画法
  DATA_STRUCTURE      // データ構造
  GRAPH               // グラフ
  TREE                // 木
  NUMBER_THEORY       // 数学（整数論）
  ALGEBRA             // 数学（代数）
  COMBINATORICS       // 数え上げ・確率・期待値
  GAME                // ゲーム
  STRING              // 文字列
  GEOMETRY            // 幾何
  OPTIMIZATION        // 最適化
  OTHERS              // その他
  ANALYSIS            // 考察テクニック
}
```

**変更点**: `MATH_INTEGER` → `NUMBER_THEORY`、`MATH_ALGEBRA` → `ALGEBRA`（意味が明確）、`THEME` 削除

### 2. 新テーブル `WorkBookPlacement`

```prisma
model WorkBookPlacement {
  id                Int               @id @default(autoincrement())
  workBookId        Int               @unique
  taskGrade         TaskGrade?        // CURRICULUM 用（SOLUTION は null）
  solutionCategory  SolutionCategory? // SOLUTION 用（CURRICULUM は null）
  priority          Int               // 1以上。1に近いほど上側に表示
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  workBook WorkBook @relation(references: [id], fields: [workBookId], onDelete: Cascade)

  @@map("workbookplacement")
}
```

**XOR 制約**: Zod スキーマ + DB CHECK 制約で `taskGrade XOR solutionCategory`（どちらか片方のみ non-null）を多層保証。CHECK 制約はマイグレーション SQL に手動追記（Prisma に `@@check` はないため）。

### 3. WorkBook モデルへの変更

WorkBook にリレーションフィールドのみ追加（仮想リレーション、ALTER TABLE なし）:

```prisma
model WorkBook {
  // 既存フィールド...
  placement WorkBookPlacement?
}
```

---

## 初期配置ロジック

### トリガー

- カンバンページの「ボードに問題集を追加」ボタン（form action `initializePlacements`）で POST 実行
- `load()` 内での DB INSERT は HTTP セマンティクス違反（GET の副作用）のため行わない
- ボタンは未作成の placement がある場合のみ表示（各 workbook ごとに WorkBookPlacement の有無を確認）
- クリック時は未作成分のみ追加（既存 placement は温存）
- 新規 workbook 追加時も同じ判定で管理画面から追加可能

### CURRICULUM

- `WorkBookPlacement` レコードが未作成の場合のみ計算
- `getWorkBookGradeModes()` を utils に切り出して流用（最頻値グレードを算出）
- 同一グレード内は `workbook.id` 昇順で priority を設定
- `createMany` でバルク INSERT（約120件、1クエリで完結）

### SOLUTION

- 全て `solutionCategory: PENDING` で初期配置
- 管理者がカンバンボード上で手動分類

---

## ドロップ時の保存設計

### フロー

1. `onDragStart`: `$state` のスナップショットを `structuredClone()` で保持
2. `onDragOver`: `items = move(items, event)`（`@dnd-kit/helpers`）で UI を即時更新（multi-container では `onDragOver` で `move()` を呼ぶ必要がある。`onDragEnd` のみだと `{#each}` と DOM が不整合でフリーズする）
3. `onDragEnd`: 移動元・移動先パネルの全カードの priority を連番振り直し（1, 2, 3, ...）で再計算し、form action で DB 保存
4. `prisma.$transaction()` 内で個別 `update` をバルク実行（最大200件、管理者専用で数十ms、問題なし）
5. 失敗時: スナップショットで `$state` を上書き（ロールバック）+ トースト通知

### エラー処理

- ネットワークエラー: 楽観的更新をロールバック + トースト「保存に失敗しました」
- バリデーションエラー: CURRICULUM↔SOLUTION 間移動の禁止を UI 側で制御（ドロップ不可）
- DB エラー: トランザクションでアトミック性を保証、ロールバック + トースト

### CURRICULUM↔SOLUTION 間移動禁止の実装

- `type` + `accept`/`accepts` で制御（詳細は @dnd-kit/svelte ドキュメント参照）
- 不可ドロップ時の視覚フィードバック: カーソル `not-allowed` + カラム背景色をグレーアウト
- サーバー側: form action でも workBookType の一致をバリデーション（多重防御）

---

## リファクタリング

### getWorkBookGradeModes の切り出し

- 現在地: `src/routes/workbooks/+page.svelte:73`（コンポーネント内）
- 移動先: `src/features/workbooks/utils/workbooks.ts`（複数形: 複数の問題集に対する集合操作のため）
- 変更: `tasksByTaskId` を引数として受け取る純粋関数に変更
- 元のコンポーネントからは切り出した関数を呼ぶようにリファクタリング

---

## ディレクトリ構成

```
src/routes/(admin)/workbooks/order/
├── +page.server.ts          # ロード・アクション（admin 認証込み）
├── +page.svelte             # ページコンポーネント（薄くする）
└── _components/             # このルート専用コンポーネント
    ├── KanbanBoard.svelte   # ボード全体（タブ切替 + レイアウト管理）
    ├── KanbanColumn.svelte  # パネル（droppable）
    ├── KanbanCard.svelte    # 問題集用のカード（sortable）
    └── ColumnSelector.svelte # 表示させるカラムを選択するセレクトボックス
```

---

## UI レイアウト設計

### 方針

旧 UI モック（`docs/ui-mock/2025-11-25/`）は SOLUTION + CURRICULUM を同一グリッドに混在表示（4カラム）しており、現設計（タブ切替 + 15〜18 カラム）と大幅に乖離。新しい UI モックを作成してから実装に入る。

### レイアウト: タブ切替 + PENDING ピン留め + セレクトボックス

- **タブ**: CURRICULUM / SOLUTION を切替
- **SOLUTION タブ**: PENDING カラムを左側に常時固定 + セレクトボックスで右側に表示する SolutionCategory を選択（下限 2、DnD 移動に必要で厳守。上限は初期値 4 を推奨するが全カテゴリ選択も可能（低確率のオプション。検証環境リリース後に共同開発メンバーからの FB で調整））
- **CURRICULUM タブ**: セレクトボックスで表示する TaskGrade を選択（同上の制約）。PENDING 列は不要（CURRICULUM では DB 登録時に難易度計算済みで PENDING の workbook は存在しない）。現時点で約70問題集、10Q〜6Q。最小3件/カラム（10Q）、最多約20件/カラム（6Q）
- セレクトボックス未選択時: PENDING のみ表示（SOLUTION）/ 全非表示（CURRICULUM）
- **状態管理**: タブ・セレクトボックスの選択状態は URL パラメータ（`?tab=solution&cols=PENDING,GRAPH`）で管理。`$page.url.searchParams` で読み取り、`replaceState` で更新。リロード・ブックマークで維持される

### 選定理由

- 15〜18 カラムの横スクロールは管理者専用でも操作が厳しい
- 折り返しグリッドは DnD の操作性が低下する
- PENDING ピン留めにより SOLUTION の初期分類フロー（PENDING → 各カテゴリ）が常に可能
- セレクトで表示カラムを絞ることで画面幅に収まる

### 新 UI モック

- 配置先: `docs/ui-mock/2026-02-28/workbook-order/index.html`
- Step 0（実装前）で作成

---

## 実装ステップ

### Step 0: UI モック作成

- `docs/ui-mock/2026-02-28/workbook-order/index.html` を作成
- タブ切替 + PENDING ピン留め + セレクトボックスのレイアウトを HTML + Tailwind で再現
- 実装着手前にレイアウト・操作感を確認

### Step 1: リファクタリング — getWorkBookGradeModes 切り出し

- テストファースト: `src/features/workbooks/utils/workbooks.test.ts` にテストケースを先に記述
- `src/features/workbooks/utils/workbooks.ts` に実装（複数形: 複数の問題集に対する集合操作のため）
- `src/routes/workbooks/+page.svelte` から呼び出し変更

### Step 2: DB マイグレーション

- `prisma/schema.prisma`: SolutionCategory enum + WorkBookPlacement モデル追加
- `pnpm exec prisma migrate dev --create-only --name add_workbook_placement`
- 生成された migration.sql に CHECK 制約を手動追記:
  ```sql
  ALTER TABLE "workbookplacement"
  ADD CONSTRAINT "workbookplacement_xor_grade_category"
  CHECK (
    ("taskGrade" IS NOT NULL AND "solutionCategory" IS NULL)
    OR ("taskGrade" IS NULL AND "solutionCategory" IS NOT NULL)
  );
  ```
- `pnpm exec prisma migrate dev` で適用
- `pnpm exec prisma generate`

### Step 3: 型定義・Zod スキーマ

- テストファースト: `src/features/workbooks/zod/schema.test.ts` に XOR テストケースを先に記述
- `src/features/workbooks/types/workbook.ts`: WorkBookPlacement 型追加
- `src/features/workbooks/zod/schema.ts`: placement スキーマ（XOR refinement）実装

### Step 4: サービス層

- テストファースト: `src/features/workbooks/services/workbook_placements.test.ts` にテストケースを先に記述
- 新ファイル `src/features/workbooks/services/workbook_placements.ts`:
  - `getWorkBookPlacements(workBookType)` — type 別の placement 取得
  - `upsertWorkBookPlacements(placements)` — バルク upsert（`prisma.$transaction()` + 個別 update）
  - `initializeCurriculumPlacements(workbooks, tasksByTaskId)` — 初期配置
  - `initializeSolutionPlacements(workbooks)` — 全て PENDING で初期配置

### Step 5: DnD ライブラリ導入

- `pnpm add @dnd-kit/svelte @dnd-kit/helpers`
- 動作確認（最小構成のドラッグ&ドロップ）
- **リスク**: @dnd-kit/svelte は Svelte 5 ネイティブ対応だが発展途上。致命的な問題が見つかった場合の代替候補: [SortableJS](https://sortablejs.github.io/Sortable/)（Svelte 5 の `use:action` で自前ラップが必要だが、ライブラリ自体は安定・実績豊富）

### Step 6: ページ・API

- `+page.server.ts`:
  - `load()`: 具体的な Prisma クエリ:

    ```typescript
    const workbooks = await prisma.workBook.findMany({
      where: { workBookType: { in: ['CURRICULUM', 'SOLUTION'] } },
      include: {
        placement: true,
        workBookTasks: { select: { taskId: true } },
      },
      orderBy: { id: 'asc' },
    });
    const hasUnplacedWorkbooks = workbooks.some((workbook) => !workbook.placement);
    ```

    - `isPublished` フィルタなし（未公開も管理対象）
    - `workBookTasks` は初期化時の `getWorkBookGradeModes` 用

  - form action `initializePlacements`（POST）: 未作成分の placement を初期化。CURRICULUM 用の task データ取得:
    ```typescript
    const curriculumWorkbooks = await prisma.workBook.findMany({
      where: { workBookType: 'CURRICULUM', placement: null },
      include: {
        workBookTasks: {
          include: { task: { select: { task_id: true, grade: true } } },
        },
      },
    });
    ```
  - form action `updatePlacements`（POST）: Superforms 経由。移動元+移動先カラムの影響を受けた placement のみ送信:
    ```typescript
    {
      updates: Array<{
        id: number;
        priority: number;
        solutionCategory?: SolutionCategory;
        taskGrade?: TaskGrade;
      }>;
    }
    ```

- admin 認証: `event.locals.user` の role チェック
- 「ボードに問題集を追加」ボタン: 未作成の placement がある場合のみ表示

### Step 7: UI コンポーネント

- `KanbanBoard.svelte`: DragDropProvider + SOLUTION/CURRICULUM をタブで切替表示
- `ColumnSelector.svelte`: セレクトボックス（multi-select）で表示カラムを選択
  - SOLUTION タブ: PENDING は常時表示 + 他カテゴリを 2〜4 つ選択
  - CURRICULUM タブ: TaskGrade を 2〜4 つ選択
- `KanbanColumn.svelte`: createDroppable + enum ラベルをカラムヘッダーに表示 + カード一覧
- `KanbanCard.svelte`: createSortable + workbook タイトル表示 + 未公開バッジ（`isPublished=false` のカードを視覚的に区別）
- enum → 日本語ラベルの定数マップ定義（例: `DYNAMIC_PROGRAMMING` → `動的計画法`）
- CURRICULUM↔SOLUTION 間移動の禁止: `accept` プロパティ + `type` 識別（詳細は「ドロップ時の保存設計」参照）
- 楽観的更新: `onDragStart` でスナップショット → `onDragOver` で `move()` → `onDragEnd` で DB 保存 → catch でロールバック + トースト通知
- **@dnd-kit 実装上の注意**（[dnd-kit-kanban モック](https://github.com/KATO-Hiro/dnd-kit-kanban)で検証済み）:
  - sortable `id` にプレフィックス禁止: `move()` が `item.id === source.id` で照合するため、データの `id` をそのまま使用
  - object getter パターン必須: `createSortable({ get id() { return placement.id }, get index() { return i }, ... })`（内部で `$effect.pre` を使うため）
  - `createSortable` はコンポーネントトップレベルで呼ぶ（`{#each}` 内の `{@const}` は NG — リアクティブ再評価でフリーズ）
  - `KanbanColumn` の `createDroppable` に `collisionPriority: 1` を設定（空カラムへのドロップ用）
  - Flowbite Svelte v1 では `onclick` を使用（`on:click` は型エラー）

### Step 8: ドキュメント・シードデータ

- `docs/guides/architecture.md`: workbook_placements サービスの追加を反映
- `CONTRIBUTING.md`: フロントエンドセクションに `@dnd-kit/svelte` の URL を追記
- `prisma/seed.ts`: WorkBookPlacement のシードデータ追加:
  - `addWorkBookPlacements()` 関数を `addWorkBooks()` の後に新設
  - **CURRICULUM**: `getWorkBookGradeModes()` で最頻値グレードを自動計算し、同一グレード内は `workbook.id` 昇順で priority を設定
  - **SOLUTION**: `src/features/workbooks/fixtures/solution_category_map.ts` に `urlSlug → SolutionCategory` マッピングを定義。2〜3 カテゴリに各 3 件程度を振り分け、残りは `PENDING`
  - 実行順の依存: workbooks + tasks の両方が存在した後に実行する必要がある
  - `src/features/workbooks/fixtures/` に placement のシードデータ定義ファイルを追加

---

## テスト計画

**方針**: services テストは `vi.mock()` で DB をモック（既存パターン `src/test/lib/services/task_results.test.ts` に従う）。テストは `src/features/` 内にファイル隣接配置。

| 対象                           | ファイル                                                      | 正常系                                      | 異常系                                                               |
| ------------------------------ | ------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| Zod XOR                        | `src/features/workbooks/zod/schema.test.ts`                   | taskGrade のみ / solutionCategory のみ      | 両方 null、両方 non-null、不正な enum 値                             |
| getWorkBookGradeModes          | `src/features/workbooks/utils/workbooks.test.ts`              | 最頻値計算、同数タイ                        | 空配列、全 PENDING、タスク未登録の workbook                          |
| initializeCurriculumPlacements | `src/features/workbooks/services/workbook_placements.test.ts` | 初期配置ロジック、priority 順序             | 既存 placement 混在ケース、workbook にタスクが0件                    |
| upsertWorkBookPlacements       | `src/features/workbooks/services/workbook_placements.test.ts` | バルク upsert、既存レコード更新             | 存在しない workBookId、0や負の priority                              |
| CURRICULUM↔SOLUTION 禁止       | `src/features/workbooks/services/workbook_placements.test.ts` | 同種パネル間移動の許可                      | CURRICULUM→SOLUTION、SOLUTION→CURRICULUM（サーバー側バリデーション） |
| E2E カンバンボード             | `tests/workbook_order.test.ts`                                | ボード表示、カード順序、並替→リロード後保持 | 管理者ではないユーザによるリダイレクト                               |

---

## チェックリスト（横断的確認）

- [ ] `pnpm check` 型エラーなし
- [ ] `pnpm format && pnpm lint` パス
- [ ] `pnpm test:unit` パス
- [ ] getWorkBookGradeModes 切り出し後、既存 `/workbooks` ページを目視確認（リグレッション）

---

## 検証方法

1. Step 1 完了後、`/workbooks` ページを目視確認し getWorkBookGradeModes のリグレッションがないことを確認
2. `pnpm exec prisma migrate dev` が正常終了
3. `pnpm check` で型エラーなし
4. 管理者で `/(admin)/workbooks/order` にアクセス → カンバンボード表示
5. 一般ユーザーでアクセス → `/login` にリダイレクト
6. CURRICULUM カードを別グレードパネルにドロップ → DB 更新確認
7. SOLUTION カードを別カテゴリパネルにドロップ → DB 更新確認
8. CURRICULUM → SOLUTION パネルへのドロップ → 禁止されることを確認
9. ネットワーク遮断中にドロップ → UI ロールバック + トースト表示確認
10. 「ボードに問題集を追加」ボタン押下で未作成の WorkBookPlacement が生成されることを確認
11. 全問題集が配置済みの状態で「ボードに問題集を追加」ボタンが非表示になることを確認
12. セレクトボックスで表示カラムが切り替わることを確認
13. `pnpm test:unit` 全テストパス
14. `pnpm format && pnpm lint` パス

注: Q&A は `decisions.md` に移動済み。
