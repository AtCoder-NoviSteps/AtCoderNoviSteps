# 設計判断の記録 (Issue #943)

plan.md から分離した Q&A 議事録。各質問の検討経緯と結論を記録する。

---

## Q1: SolutionCategory の命名 → `Category` 採用（`SolutionType` は `WorkBookType` と混同）

## Q2: MATH_INTEGER の命名 → `NUMBER_THEORY` に変更。`MATH_ALGEBRA` → `ALGEBRA`

## Q3: WorkBook に solutionCategory を追加する是非 → 案B（WorkBookPlacement に集約）採用

## Q4: 属性の分散配置 → 案B（WorkBookPlacement に統一）。テーブル名 `WorkBookPlacement`（「配置」の意）

## Q5: URL `/workbooks/order` vs `/workbooks/[slug]` → SvelteKit で静的セグメント優先、問題なし

## Q6: ドロップ時の即時保存 → 最大200件 UPDATE、管理者専用で問題なし

## Q7: dnd-kit でのカンバンボード実装

**結論**: `@dnd-kit/svelte`（Svelte 5.29+ 対応）。DragDropProvider + createDroppable + createSortable。CURRICULUM↔SOLUTION 間はドロップ先バリデーションで禁止。

## Q8: `_components/` の export 禁止メカニズム

**結論**: SvelteKit では `+` prefix のファイルのみがルーティング対象。`_` prefix は慣習であり技術的強制力なし。ESLint / PR レビューで担保。

## Q9: バルク upsert の DB 負荷

**結論**: 初期化は約120件の `createMany`。ドロップ時は `prisma.$transaction()` + 個別 update。問題ない規模。

## Q10: getWorkBookGradeModes の切り出し

**結論**: `src/features/workbooks/utils/workbooks.ts`（複数形）に追加。`tasksByTaskId` を引数とする純粋関数に変更。理由: 複数の問題集に対する集合操作であり、既存の `workbooks.ts` の責務と一致する（Q18 で最終確定）。

## Q11: テスト計画の欠落

**結論**: Zod XOR、getWorkBookGradeModes、サービス層、E2E のテストを追加。詳細は plan.md のテスト計画セクション参照。

## Q12: カンバンボードのラベル表示

**指摘**: enum 値をカラムヘッダーとして表示する計画が未記載だった。
**対応**: Step 7 に enum → 日本語ラベルの定数マップ定義を追加。CURRICULUM(18値) と SOLUTION(15値) のカラム数が多いため、タブ切替 + 横スクロールの方針も追記。UIモック作成後に確定予定。

## Q13: workBookId のインデックス

**結論**: 不要。`@unique` により自動で UNIQUE INDEX が作成される。`taskGrade`/`solutionCategory` のインデックスも約120+数十件規模のため YAGNI で不要。

## Q14: WorkBook へのリレーションフィールド追加の安全性

**結論**: 安全。`placement WorkBookPlacement?` は Prisma の仮想リレーションフィールドであり、SQL テーブルにカラムは追加されない。外部キーは WorkBookPlacement.workBookId 側。マイグレーション時に WorkBook テーブルへの ALTER TABLE は発生しない。

## Q15: Raw SQL vs Prisma ヘルパー

**結論**: `prisma.$transaction()` + 個別 `update` に変更。200件で20-50msの差は管理者専用画面で無視できる。型安全性・保守性を優先。Raw SQL は数千件以上のバルク操作でないと正当化されない。

## Q16: services 層のテスト方針

**結論**: `vi.mock()` で DB をモック。既存パターン（`src/test/lib/services/task_results.test.ts`）に従う。plan.md のテスト計画に方針を明記済み。

## Q17: テストの正常系・異常系カバレッジ

**指摘**: 異常系が不十分だった。
**対応**: 各テスト対象に異常系テストケースを追加。E2E も最小限すぎたため、カード順序確認・リロード後保持・非管理者リダイレクトを追加。

## Q18: ファイル名の統一

**指摘**: `getWorkBookGradeModes` の配置先ファイル名が未確定だった。
**対応**: `workbooks.ts`（複数形）に配置。理由: `getWorkBookGradeModes(workbooks: WorkbooksList)` は複数の問題集のリストを受け取る**集合操作**であり、既存の `workbooks.ts`（`canViewWorkBook`, `getUrlSlugFrom` 等の汎用ユーティリティ）と責務が一致する。一方 `workbook.ts`（単数形）は `parseWorkBookId`, `parseWorkBookUrlSlug` 等の**1つの問題集に対するパース処理**を担当しており、責務が異なる。テストも `workbooks.test.ts` に追加。

## Q19: ドキュメント・シードデータの更新

**指摘**: docs/guides/architecture.md、CONTRIBUTING.md、prisma/seed.ts の更新が計画に含まれていなかった。
**対応**: Step 8 として追加。変更ファイル一覧・チェックリストにも反映済み。

## Q20: `prisma.$transaction()` + 200回個別 update の N+1 問題

**指摘**: `prisma.$transaction()` 内で最大200回の `prisma.workBookPlacement.update()` を呼ぶのは N+1 パターンではないか。200回の UPDATE は DDoS ではないか。
**結論**: N+1 パターンであることは**認識した上での意図的な選択**。以下の理由で現状は問題なし:

- PostgreSQL は PK インデックスヒットの単純 UPDATE を高速処理（200件でトータル 50-200ms 程度）
- 行レベルロック（テーブルロックではない）のため他のクエリをブロックしない
- 管理者 1 人が数分に 1 回操作する程度の頻度であり、DDoS とは性質が異なる（DDoS は外部からの大量リクエスト攻撃。これは正規の管理者が 1 リクエスト内で発行する SQL）
- Q15 で決定した通り、Raw SQL は数千件以上のバルク操作でないと型安全性・保守性の犠牲に見合わない

**将来の閾値**: 500件超に増えた場合は Raw SQL `UPDATE ... SET priority = CASE WHEN ...` への切替を検討。現時点では YAGNI。

## Q21: seed.ts の WorkBookPlacement シードデータ

**指摘**: Step 8 に「シードデータ追加」とあるが、具体的な内容が未定義だった。
**結論**:

- CURRICULUM: `getWorkBookGradeModes()` で最頻値グレードを自動計算、同一グレード内は `workbook.id` 昇順で priority 設定
- SOLUTION: 3〜5 カテゴリ（`DATA_STRUCTURE`, `DYNAMIC_PROGRAMMING`, `GRAPH`, `SEARCH_SIMULATION`, `STRING`）に各 1〜2 件を振り分け、残りは `PENDING`
- `addWorkBookPlacements()` 関数を新設、`addWorkBooks()` + `addTasks()` の後に実行
- シードデータ定義は `src/features/workbooks/fixtures/workbook_placements.ts` に配置

## Q22: load() 内での DB INSERT はアンチパターン

**指摘**: Step 6 で `load()` 内で未作成分を初期配置する計画だったが、GET リクエストで DB 書き込みは HTTP セマンティクスに反する。ブラウザのプリフェッチやクローラーが意図しない初期化を引き起こす可能性。
**結論**: form action `initializePlacements`（POST）で「ボードに問題集を追加」ボタン押下時に実行。ボタンは未作成の placement がある場合のみ表示。クリック時は未作成分のみ追加（既存の問題集は、そのまま）。

## Q23: UI モックの乖離と新モック作成

**指摘**: 旧 UI モック（`docs/ui-mock/2025-11-25/`）は SOLUTION + CURRICULUM を同一グリッドに混在表示（4カラム）しており、現設計（タブ切替 + 15〜18 カラム）と大幅に乖離。Step 7 に「UIモック作成後に確定」とあるが、モック作成自体が実装ステップに含まれていなかった。
**結論**: Step 0（実装前）として新 UI モックを `docs/ui-mock/2026-02-28/workbook-order/` に作成。レイアウトを確定させてから実装に入る。

## Q24: UI レイアウトの最終決定

**検討した候補**:

- A: タブ切替 + 単純横スクロール → 15〜18 カラムのスクロールは管理者専用でも厳しい
- B: タブ切替 + 折り返しグリッド → DnD の操作性が低下
- C: セレクトボックスで絞り込み → カテゴリ間移動にセレクト切替が必要
- D: PENDING ピン留め + セレクト → SOLUTION の初期分類フローが常に可能

**結論**: **タブ切替（CURRICULUM / SOLUTION）+ PENDING ピン留め + セレクトボックス**。SOLUTION タブでは PENDING カラムを左側に常時固定、セレクトで右側に 2〜4 カテゴリを表示。初期分類ではセレクト切替が必要だが、運用可能な範囲。

## Q25: URL `/workbooks/order` vs テーブル `WorkBookPlacement` の命名

**結論**: 矛盾ではなくレイヤーの違い。URL はユーザー向け（「並び順」が直感的）、テーブルは内部実装（カテゴリ＋順序の「配置」）。確定事項に判断根拠を追記済み。

## Q26: @dnd-kit/svelte の API 検証

**指摘**: plan.md で使用している API 名（`createDroppable`, `createSortable`, `DragDropProvider`）が公式 API と一致するか未検証だった。
**結論**: 公式ドキュメント（dndkit.com/svelte）で確認済み。以下が利用可能:

- `DragDropProvider`, `createDroppable`, `createSortable` — 全て公式 API に存在
- droppable 側は `accepts`（**複数形**）、sortable 側は `accept`（**単数形**）
- `createSortable` に `type`, `accept`, `group`, `index` プロパティあり
- CURRICULUM↔SOLUTION 間移動禁止は `type` + `accept`/`accepts` で実現可能

## Q27: ゴールのスコープ

**指摘**: カンバンボードで管理する「並び順」がユーザー向けページに反映されるのかが plan.md に未記載。
**結論**: 本 Issue はカンバン管理画面の実装のみ。ユーザー向け `/workbooks` ページの表示順への反映は別 Issue で次リリース対応。plan.md の Context セクションに追記済み。

## Q28: CURRICULUM タブの PENDING 列

**指摘**: plan.md で「PENDING 固定列はオプション」と曖昧な記載だった。
**結論**: 不要。CURRICULUM では DB 登録時に難易度計算済みで PENDING の workbook は存在しない。plan.md から「オプション」の記載を削除し、不要の理由を明記済み。

## Q29: セレクトボックスの選択数制約

**指摘**: 「2〜4 つ選択」の根拠が不明だった。
**結論**:

- 下限 2: DnD でカード移動するには最低 2 カラム必要（厳守）
- 上限: 初期表示値として 4 を推奨するが、全カテゴリ選択も可能（低確率のオプション。検証環境リリース後に FB で調整）

## Q30: 初期化ボタンの判定ロジック

**指摘**: 「未作成の placement がある」の具体的な判定条件が未定義だった。
**結論**: 各 workbook（CURRICULUM + SOLUTION）ごとに WorkBookPlacement の有無を確認。新規 workbook 追加時も同じ判定で管理画面から初期化可能。

## Q31: priority 再計算アルゴリズム

**指摘**: ドロップ時の priority 再計算の具体的なアルゴリズムが未記載だった。
**結論**: 連番振り直し（1, 2, 3, ...）。ギャップ方式（Trello の lexorank 等）は数百万ユーザーの同時編集向けであり、管理者 1 人の本ケースでは YAGNI。

## Q32: sortable の group 設計

**指摘**: `createSortable` の `group` プロパティの使用方針が未記載だった。
**結論**:

- CURRICULUM タブ: 全 TaskGrade カラムを同一 group (`'curriculum'`) に設定
- SOLUTION タブ: 全 SolutionCategory カラムを同一 group (`'solution'`) に設定
- これによりタブ内のクロスリストソート（カラム間移動）が可能になる

## Q33: テストの配置

**指摘**: 既存テストは `src/test/lib/services/` にあるが、plan では `src/features/` 内に隣接配置しており規約が混在する。
**結論**: `src/features/` 内に隣接配置は意図的な段階的移行。プロジェクトの再構成を進めており、機能追加・修正時に段階的に移行している。新規コードは `src/features/` に、共通コードや移行前のものはそれ以外に配置。

## Q34: updatePlacements の入力形式

**結論**: Superforms 経由で form action を呼出。placement の `id`（PK）で識別。入力型: `{ placements: Array<{ id: number, priority: number, taskGrade?: TaskGrade, solutionCategory?: SolutionCategory }> }`。楽観的更新は Superforms の `onSubmit` / `onResult` コールバックで制御。

## Q35: タブ・セレクトボックスの状態管理

**検討した候補**:

- URL パラメータ: リロード・ブックマークで維持。実装は `$page.url.searchParams` + `replaceState`
- クライアント `$state` のみ: 実装最シンプルだがリロードで消える
- localStorage: リロード耐性あるが SSR との hydration mismatch リスク

**結論**: URL パラメータ（`?tab=solution&cols=PENDING,GRAPH`）。管理者1人の画面で共有不要だが、リロード耐性があり実装コストもほぼ変わらない。localStorage は SSR との不整合リスクが余計な複雑さを生む。

## Q36: DB CHECK 制約

**指摘**: XOR 制約が Zod のみだと、seed スクリプトや将来の別エントリポイントからの不正データを防げない。
**結論**: Prisma に `@@check` 属性は存在しない。`prisma migrate dev --create-only` で生成後、migration.sql に手動で CHECK 制約を追記して適用。Zod（API バリデーション）+ CHECK 制約（DB 最終防壁）の多層防御。

## Q37: @dnd-kit/svelte のリスク

**結論**: @dnd-kit/svelte は Svelte 5 ネイティブ対応がメリットだが発展途上であることを明記。致命的な問題が見つかった場合の代替候補: [SortableJS](https://sortablejs.github.io/Sortable/)（Svelte 5 の `use:action` で自前ラップが必要だが、ライブラリ自体は安定・実績豊富）。

## Q38: SOLUTION 手動分類の実用性

**指摘**: 50件弱を1件ずつ手動分類するフローは実用的か。バルク分類機能が必要ではないか。
**結論**: DnD での手動分類は現実的な作業量。今回の UI ならカードをドラッグするだけで済む。バルク分類は実装・メンテコストに見合わず YAGNI。

## Q39: `@@unique([taskGrade, priority])` の priority 再番号付け時の制約違反

**指摘**: `prisma.$transaction()` 内で順次 UPDATE すると中間状態で UNIQUE 制約違反が発生する。PostgreSQL はトランザクション内でも各 SQL 文ごとに制約チェック（DEFERRED でない限り）。
**結論**: `@@unique([taskGrade, priority])` / `@@unique([solutionCategory, priority])` は採用しない。本機能は管理者のみが操作するため同時実行が発生せず、DB レベルの複合ユニーク制約は不要と判断。連番振り直しロジックで priority 重複を防止すれば十分。DEFERRED 制約や 2ラウンド UPDATE は不要な複雑さ。

## Q40: `@dnd-kit/helpers` パッケージの追加

**指摘**: `move()` 関数は `@dnd-kit/svelte` に含まれず `@dnd-kit/helpers` が必要（[dnd-kit-kanban](https://github.com/KATO-Hiro/dnd-kit-kanban) モックで判明）。
**結論**: Step 5 を `pnpm add @dnd-kit/svelte @dnd-kit/helpers` に変更。

## Q41: multi-container での `onDragOver` / `onDragEnd` の使い分け

**指摘**: 複数カラム間移動では `move()` を `onDragOver` で呼ぶ必要がある。`onDragEnd` のみだと Svelte の `{#each}` データと `OptimisticSortingPlugin` の DOM 状態が不整合になりフリーズする（[dnd-kit-kanban](https://github.com/KATO-Hiro/dnd-kit-kanban) モックで検証済み）。
**結論**: `onDragStart` でスナップショット保持 → `onDragOver` で `items = move(items, event)` → `onDragEnd` で DB 保存のみ。

## Q42: sortable id のプレフィックス禁止

**指摘**: `move()` は `item.id === source.id` で照合するため、`card-${id}` のようなプレフィックスは NG。
**結論**: `createSortable({ get id() { return placement.id } })` でデータ id をそのまま使用。

## Q43: object getter パターンと `createSortable` の配置

**指摘**: `createSortable` / `createDroppable` は内部で `$effect.pre` を使うため、引数は object getter（`get id() { ... }`）で渡す必要がある。また `{#each}` 内の `{@const}` で呼ぶとリアクティブ再評価でフリーズする。
**結論**: KanbanCard.svelte のコンポーネントトップレベルで object getter パターンを使用。plan.md の設計と整合。

## Q44: 未公開 workbook の管理

**結論**: `isPublished=false` の workbook も placement を作成し管理画面で管理可能にする。カードに未公開バッジを表示して視覚的に区別。`load()` の `isPublished` フィルタは不要。

## Q45: `load()` / `initializePlacements` の Prisma クエリ形状

**指摘**: plan.md Step 6 の具体的なクエリが未定義だった。
**結論**: `load()` は `prisma.workBook.findMany({ where: { workBookType: { in: ['CURRICULUM', 'SOLUTION'] } }, include: { placement: true, workBookTasks: { select: { taskId: true } } } })`。`initializePlacements` は未配置の CURRICULUM workbook を `workBookTasks.task` 含めて取得し `getWorkBookGradeModes` に渡す。

## Q46: seed データの SOLUTION 振り分け

**結論**: `src/features/workbooks/fixtures/solution_category_map.ts` に `urlSlug → SolutionCategory` マッピングを定義。urlSlug ベースで 2〜3 カテゴリに各 3 件程度を振り分け、残りは PENDING。

## Q47: Flowbite Svelte v1 のイベントハンドラ

**指摘**: Flowbite Svelte v1 は Svelte 5 ネイティブのため `on:click` ディレクティブは型エラーになる。
**結論**: `onclick` プロパティを使用。Step 7 の実装指針に追記済み。
