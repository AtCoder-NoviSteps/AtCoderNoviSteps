# 問題集一覧 URLパラメータフィルタリング 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/workbooks` ページで `WorkBookPlacement.priority` 順に問題集を表示し、URLパラメータ（`?tab=curriculum&grades=Q10` / `?tab=solution&categories=GRAPH` / `?tab=created_by_user`）でサーバーサイドフィルタリングを行う

**Architecture:** `+page.server.ts` でURLパラメータを解析し、タブに応じてサービス関数を呼び分ける。`CURRICULUM`/`SOLUTION` は `getPublishedWorkbooksByPlacement(query)` が `WorkBookPlacement` レコードで絞り込み・`priority ASC` ソートして返す。`CREATED_BY_USER` は `getWorkBooksCreatedByUsers()` を呼ぶ（管理者専用・非管理者は `FOUND` リダイレクト）。全タブとも単一 `workbooks` を返し、`userCreatedWorkbooks` は廃止。クライアントサイドのグレードフィルタリングを削除し、`goto()` + `buildWorkbooksUrl()` による SvelteKit クライアントサイドナビゲーションに置き換える。

**Tech Stack:** SvelteKit 2 + Svelte 5 Runes + TypeScript | Prisma (PostgreSQL) | Flowbite Svelte (ButtonGroup) | Vitest + Playwright

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

| #   | 方針                                                                                      | 理由                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `WorkBookTab` は `WorkBookType` と同パターンの const オブジェクト                         | tab 値の比較にハードコード文字列を使うと変更に弱い。`WorkBookTab.CURRICULUM` 等の定数を使う                                                       |
| 2   | `CREATED_BY_USER` は URL パラメータ管理（サーバーサイドフィルタリング）                   | ローカル `$state` での管理は URL の再現性がなく、URL 共有・直アクセスができない                                                                   |
| 3   | 非管理者が `?tab=created_by_user` にアクセスした場合は `redirect(FOUND, '/workbooks')`    | 空データを返すより明示的なリダイレクトの方が UX として正しい                                                                                      |
| 4   | `workbooks` / `userCreatedWorkbooks` を統合し単一 `workbooks` に                          | 両方を常に fetch するのはパフォーマンス上の無駄。タブに応じて1回だけ呼ぶ                                                                          |
| 5   | タブ分岐は if/else を維持（strategy pattern / interface は使わない）                      | 3タブに対して strategy pattern は YAGNI                                                                                                           |
| 6   | `buildPlacementQuery()` は `+page.server.ts` 内のプライベートヘルパーとして維持           | 重複なし・1箇所のみ使用。utils への移動は過剰                                                                                                     |
| 7   | `WorkBookList.svelte` Props は discriminated union に変更                                 | optional props + `?? fallback` は型安全でない。Svelte 5 では `let props: Props = $props()` で使い、`{#if}` ブロック内で TypeScript 型ナローイング |
| 8   | `workbookGradeModes` は discriminated union の CURRICULUM ブランチのみに配置              | `SolutionTable` は `workbookGradeModes: _` で破棄している。SOLUTION/CREATED_BY_USER では不要                                                      |
| 9   | `AVAILABLE_CATEGORIES` はサーバーサイドで `getAvailableSolutionCategories()` により判定   | クライアント側は現在選択中のカテゴリの問題集しか持たないため、他カテゴリの存在を知れない                                                          |
| 10  | `partitionWorkbooksAsMainAndReplenished` に改名                                           | `splitWorkbooksByReplenishment` は main の存在が不明。両端（main/replenished）が名前に現れる方が直感的                                            |
| 11  | テスト内の `prisma.workBook.findMany.mockResolvedValue(...)` はヘルパー関数として切り出す | プロジェクト規約。類似パターンの重複を防ぐ                                                                                                        |
| 12  | `mapWithAuthorName()` をプライベート関数として切り出す                                    | `getPublishedWorkbooksByPlacement` / `getWorkBooksCreatedByUsers` で同一の `map()` が重複                                                         |

---

## ファイル構成

### 新規作成

| ファイル                                                             | 役割                                           |
| -------------------------------------------------------------------- | ---------------------------------------------- |
| `src/features/workbooks/utils/workbook_url_params.ts`                | URLパラメータ解析・URL組み立てユーティリティ   |
| `src/features/workbooks/utils/workbook_url_params.test.ts`           | 上記のユニットテスト                           |
| `src/features/workbooks/components/list/SolutionWorkBookList.svelte` | 解法別カテゴリ選択 ButtonGroup + SolutionTable |

### 修正

| ファイル                                                               | 変更内容                                                                                                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/features/workbooks/types/workbook.ts`                             | `WorkBookTab` const オブジェクト追加（`CURRICULUM`/`SOLUTION`/`CREATED_BY_USER`）・`SolutionTableProps` 追加                         |
| `src/routes/(admin)/workbooks/order/_types/kanban.ts`                  | `ActiveTab` を `WorkBookTab` の再エクスポートに変更                                                                                  |
| `src/features/workbooks/utils/workbooks.ts`                            | `partitionWorkbooksAsMainAndReplenished()` 追加                                                                                      |
| `src/features/workbooks/utils/workbooks.test.ts`                       | 上記テスト追加                                                                                                                       |
| `src/features/workbooks/services/workbooks.ts`                         | `PlacementQuery` 型・`getPublishedWorkbooksByPlacement()` / `getWorkBooksCreatedByUsers()` / `getAvailableSolutionCategories()` 追加 |
| `src/features/workbooks/services/workbooks.test.ts`                    | 上記テスト追加                                                                                                                       |
| `src/routes/workbooks/+page.server.ts`                                 | URLパラメータ解析・タブ別サービス呼び出し・`CREATED_BY_USER` の admin ガード追加                                                     |
| `src/features/workbooks/components/list/CurriculumWorkBookList.svelte` | ストア削除・`currentGrade` prop 化・`partitionWorkbooksAsMainAndReplenished` 使用                                                    |
| `src/features/workbooks/components/list/WorkbookTabItem.svelte`        | `workbookType` prop 削除・`onclick` prop 化                                                                                          |
| `src/features/workbooks/components/list/WorkBookList.svelte`           | discriminated union Props・SOLUTION → SolutionWorkBookList ルーティング追加                                                          |
| `src/routes/workbooks/+page.svelte`                                    | URL駆動タブ/フィルタ・CREATED_BY_USER も URL 管理                                                                                    |
| `e2e/workbooks_list.spec.ts`                                           | E2Eテスト更新                                                                                                                        |

### 削除（Phase 9）

| ファイル                                                               | 理由                              |
| ---------------------------------------------------------------------- | --------------------------------- |
| `src/features/workbooks/stores/task_grades_by_workbook_type.ts` + test | URLパラメータに置き換え           |
| `src/features/workbooks/stores/active_workbook_tab.ts` + test          | ローカル状態不要（URL管理に移行） |

---

## Phase 一覧

| Phase | ファイル                     | 内容                                                                               | リスク |
| ----- | ---------------------------- | ---------------------------------------------------------------------------------- | ------ |
| 0     | [phase-0.md](./phase-0.md)   | `WorkBookTab` 型を feature types に追加・統一                                      | 極低   |
| 1     | [phase-1.md](./phase-1.md)   | `partitionWorkbooksAsMainAndReplenished()` ユーティリティ                          | 極低   |
| 2     | [phase-2.md](./phase-2.md)   | `workbook_url_params.ts` 解析・URL組み立て                                         | 極低   |
| 3     | [phase-3.md](./phase-3.md)   | `getPublishedWorkbooksByPlacement()` / `getAvailableSolutionCategories()` サービス | 中     |
| 4     | [phase-4.md](./phase-4.md)   | `+page.server.ts` URLパラメータ対応                                                | 中     |
| 5     | [phase-5.md](./phase-5.md)   | `SolutionWorkBookList.svelte` 新規作成                                             | 低-中  |
| 6     | [phase-6.md](./phase-6.md)   | `CurriculumWorkBookList.svelte` リファクタリング                                   | 中     |
| 7     | [phase-7.md](./phase-7.md)   | `WorkbookTabItem.svelte` 簡素化                                                    | 低     |
| 8     | [phase-8.md](./phase-8.md)   | `WorkBookList.svelte` + `+page.svelte` 改修                                        | 中-高  |
| 9     | [phase-9.md](./phase-9.md)   | 不要ストア削除                                                                     | 低     |
| 10    | [phase-10.md](./phase-10.md) | E2Eテスト更新                                                                      | 低     |
| 11    | [phase-11.md](./phase-11.md) | `/refactor-plan` → `/session-close`                                                | 低     |
| 12    | [phase-12.md](./phase-12.md) | admin非公開閲覧・URLフィルター状態保持・ユーザ作成空状態表示                       | 低〜中 |

---

## 最終検証

- [x] `pnpm test:unit` — 全ユニットテスト通過
- [ ] `pnpm test:e2e -- --grep "workbooks"` — E2Eテスト通過（手動実行要）
- [x] `pnpm check` — 型エラーなし（既存の auth 2件のみ）
- [x] `pnpm lint` — Lintエラーなし（警告のみ）
- [x] `pnpm format` — フォーマット適用済み
- [ ] 手動確認（`pnpm dev`）:
  - `/workbooks` → カリキュラム Q10 が表示
  - グレードボタンクリック → ブラウザリロードなしで URL・コンテンツ更新（`goto()` はクライアントサイドナビゲーション。ただし `+layout.svelte` の `$navigating` によりデータ取得中はページ全体がスピナーに置き換わる）
  - 解法別タブクリック → `?tab=solution&categories=SEARCH_SIMULATION`
  - カテゴリボタンクリック → URL・コンテンツ更新
  - 問題集が存在しないカテゴリのボタンが非表示
  - `/workbooks?tab=solution&categories=GRAPH` 直アクセス → 正しく表示
  - 管理者: `/workbooks?tab=created_by_user` → ユーザ作成タブが表示
  - 一般ユーザ: `/workbooks?tab=created_by_user` → `/workbooks` にリダイレクト
  - 補充教材トグルが引き続き動作する

---

## 影響範囲まとめ

| ファイル                                                           | 変更種別     | 理由                                                             |
| ------------------------------------------------------------------ | ------------ | ---------------------------------------------------------------- |
| `src/routes/sitemap.xml/+server.ts`                                | **変更なし** | `/workbooks/[slug]` 個別 URL を生成するのみ。一覧ページは対象外  |
| `src/routes/workbooks/+page.server.ts` (delete action)             | **変更なし** | フォーム送信後の再ロードも URL パラメータを引き継ぐ              |
| `src/routes/(admin)/workbooks/order/`                              | **変更なし** | 管理者専用の独立ルート（`ActiveTab` 型のみ再エクスポートに変更） |
| `src/features/workbooks/components/list/WorkBookList.svelte`       | **修正**     | discriminated union Props・SOLUTION ルーティング追加             |
| `src/features/workbooks/components/list/CreatedByUserTable.svelte` | **修正**     | 空状態表示（Phase 12-B）                                         |
| `src/routes/workbooks/+page.svelte`                                | **修正**     | sessionStorage URLフィルター状態保持（Phase 12-C）               |

---

## 計画中の教訓・誤解

> 「分類」は発見のきっかけになりやすいカテゴリ。同じ分類でミスが続く場合は該当カテゴリの確認を計画レビューに組み込むこと。

| #   | 分類     | 誤解・ミス                                                                                         | 正しい判断                                                                                                                                                                                                                                                                  |
| --- | -------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 仕様確認 | `CREATED_BY_USER` タブを「完全削除」と計画した                                                     | 「管理者のみ閲覧可能として維持」が正しい仕様。削除前に「既存ユーザー向けに残す機能か」を確認すること                                                                                                                                                                        |
| 2   | 命名     | `workbook_list_params.ts` と命名した                                                               | 何の params か不明。`workbook_url_params.ts` のように対象を明示する                                                                                                                                                                                                         |
| 3   | 実装調査 | ストアが localStorage を使っていると誤解した                                                       | `task_grades_by_workbook_type` と `active_workbook_tab` は in-memory の Svelte `writable()` のみ。localStorage を使うのは `replenishmentWorkBooksStore` だけ                                                                                                                |
| 4   | 仕様確認 | `WorkBookList.svelte` を削除対象に含めた                                                           | ルーティングコンポーネントは既存の責務を持つ。削除前に「他で代替できるか」を確認すること                                                                                                                                                                                    |
| 5   | 型設計   | `WorkBookTab` を新規定義しようとした                                                               | order ページに同一の `ActiveTab = 'solution' \| 'curriculum'` が既存。重複前に `grep` で型の存在を確認すること                                                                                                                                                              |
| 6   | 型設計   | parse 関数の引数を `string \| null` にした                                                         | SvelteKit では `URLSearchParams` を直接渡すパターンが標準（order ページの `parseInitialCategories(params)` が先例）。既存コードのパターンを先に調べること                                                                                                                   |
| 7   | 型設計   | サービス引数をオプショナル `taskGrade?` で設計した                                                 | `tab === 'curriculum'` の条件分岐が呼び出し側に散らばる。discriminated union (`PlacementQuery`) で型レベルに閉じ込める                                                                                                                                                      |
| 8   | テスト   | テストに `it` と日本語テスト名を使った                                                             | このプロジェクトは `test` + 英語テスト名が規約。既存テストのスタイルを先に確認すること                                                                                                                                                                                      |
| 9   | テスト   | テストでハードコード文字列を直書きした                                                             | 定数（`TaskGrade.Q10` など）を使う。文字列が変わってもテストが壊れない                                                                                                                                                                                                      |
| 10  | 実装品質 | URL 組み立てをインライン文字列テンプレートで書いた                                                 | URL 組み立ては純粋関数 `buildWorkbooksUrl()` に集約する。order ページの `buildUpdatedUrl()` が先例                                                                                                                                                                          |
| 11  | 実装品質 | `url.searchParams.get('tab')` を3回繰り返した                                                      | `const params = url.searchParams` で変数に切り出す                                                                                                                                                                                                                          |
| 12  | テスト   | E2E テストのグレード・カテゴリケースが1件のみだった                                                | URL パラメータのバリエーションを `for...of` ループで複数カバーする                                                                                                                                                                                                          |
| 13  | 計画構造 | 計画を単一ファイルに書き続けた（1000行超）                                                         | plan.md は全体俯瞰（goal / 構成 / phase 一覧 / 検証）に留め、詳細タスクは `phase-N.md` に分割する。コンテキスト圧迫を防ぎ、phase 単位での参照・更新が容易になる                                                                                                             |
| 14  | 仕様確認 | `CREATED_BY_USER` をローカル `$state` で管理した                                                   | URL パラメータで管理する方が URL の再現性・直アクセスが可能になる。管理者向けでも URL ドリブンが正しい                                                                                                                                                                      |
| 15  | 実装品質 | `workbooks` / `userCreatedWorkbooks` を両方 fetch した                                             | タブに応じてどちらか一方だけ fetch すれば十分。両方返す設計はパフォーマンス上の無駄                                                                                                                                                                                         |
| 16  | 型設計   | optional props + `?? fallback` で WorkBookList を設計した                                          | discriminated union Props の方が型安全。Svelte 5 では `let props: Props = $props()` + `{#if}` ナローイングで実現可能                                                                                                                                                        |
| 17  | 型設計   | Props を設計する前に使用先コンポーネントのソースを読んでいなかった                                 | `SolutionTable` が `workbookGradeModes: _` で破棄していることを見落とし、不要な prop を Props に含めた。型設計前に必ず使用先の実装を Read/grep で確認すること                                                                                                               |
| 18  | 命名     | バイナリ分割関数の名前が片方の概念しか示していなかった                                             | `splitWorkbooksByReplenishment` は「補充側」しか表現しない。`partitionWorkbooksAsMainAndReplenished` のように **両端の概念を名前に含める**                                                                                                                                  |
| 19  | テスト   | テスト内の `new URLSearchParams('...')` 繰り返しを計画段階で気づかなかった                         | テスト設計時に「同パターンが2回以上現れるか」を確認し、`toParams()` のようなヘルパーを計画に含める                                                                                                                                                                          |
| 20  | テスト   | Prisma mock の `mockResolvedValue(...)` 繰り返しを計画段階で気づかなかった                         | テストケースが2つ以上あり同じモックパターンを使う場合は、`mockWorkbookFindMany()` のようなヘルパーを計画段階から明示すること（プロジェクト規約でもある）                                                                                                                    |
| 21  | 実装品質 | 複数の service 関数に同一の `.map()` 変換処理が現れることを見落とした                              | `mapWithAuthorName()` のような抽出を計画時から意識する。「2つ以上の関数が同じ変換をする」は計画レビューで検出できる                                                                                                                                                         |
| 22  | スコープ | `AVAILABLE_CATEGORIES` のフィルタリングを「スコープ外」と早期に判断した                            | 実装コストが低く（サービス関数1つの追加）、UX 価値が高い機能を安易にスコープ外にしない。「単に filtering するだけ」レベルの機能は同フェーズに含める                                                                                                                         |
| 23  | 型設計   | 新しい列挙型を string literal union で設計した                                                     | `WorkBookType` が const object パターンを使っているにもかかわらず `WorkBookTab` を string literal union で設計した。新しい列挙型を作るときは既存の型定義を先に確認し、プロジェクト内パターンに揃える                                                                        |
| 24  | 実装品質 | 類似した条件ロジックの重複を計画段階で気づかなかった                                               | `parseWorkBookGrade` と `parseWorkBookCategory` で「null チェック + 有効値確認 + PENDING 除外」が重複。計画段階で「同バリデーションロジックが複数現れるか」を確認し、`isValidNonPending<T>()` のような汎用サブ関数を早期に設計する                                          |
| 25  | 型設計   | 型の再エクスポート後、消費側の `Record<T, V>` が新しい値キーを要求するようになることを見落とした   | `export type { WorkBookTab as ActiveTab }` と計画したが、`Record<ActiveTab, TabConfig>` が `created_by_user` を要求してエラー。型エイリアスを再エクスポートする前に「消費側で `Record<T, *>` として使われているか」を確認し、そうであれば `Exclude<T, 未使用値>` で絞り込む |
| 26  | 実装調査 | E2E テストで `$lib` / `$features` パスエイリアスが使えないことを見落とした                         | `e2e/` ディレクトリは SvelteKit のパスエイリアスを解決しない。E2E テスト内では型のインポートを避け、URL 文字列値は `const TAB_CURRICULUM = 'curriculum'` のようにローカル定数として定義する                                                                                 |
| 27  | 実装理解 | `goto()` による遷移を「画面リロードなし」と表現したが、体感的にはリロードに近い                    | `goto()` はブラウザリロードではない（`window.location` は変化しない）が、`+layout.svelte` が `{#if $navigating}` でページ全体をスピナーに置き換えるため、UX 的にはリロードに近い見た目になる。`$navigating` はサーバーから新しいデータが返るまで truthy のまま継続する      |
| 28  | 技術負債 | `+layout.svelte` が deprecated な `$app/stores` の `navigating` を使っている                       | SvelteKit 2.12+ では `$app/state` の `navigating` を使うことが推奨されている（公式ドキュメント確認済み）。`$app/stores` 版は非推奨。本タスクのスコープ外だが、将来的に `import { navigating } from '$app/state'` へ移行すること                                             |
| 29  | 仕様確認 | アクセス制御（タブ表示）とデータ可視性（非公開の見え方）を同一仕様として扱っていた                 | 「タブを admin 専用にする」と「非公開データを admin に見せる」は別の仕様軸。アクセス制御を実装したら「見えるデータの範囲は何か」も明示的に確認すること（Phase 12-A で発覚）                                                                                                 |
| 30  | 仕様確認 | URL パラメータでフィルター状態を実装したが、「別ページへ遷移して戻る」ユースケースを検討しなかった | ブラウザ Back は URL を復元するが、サイト内ナビリンクは `/workbooks`（パラメータなし）に遷移する。URL 駆動の状態管理を実装したら「どこから戻ってくるか」を列挙すること（Phase 12-C で発覚）                                                                                 |
| 31  | 実装品質 | 空状態コンポーネントを一部タブにしか適用しなかった                                                 | `EmptyWorkbookList` を CURRICULUM/SOLUTION に追加したが CREATED_BY_USER を漏らした。UI パターン（空状態・ローディング等）を追加したら全タブ・全テーブルに適用されているか横断確認すること（Phase 12-B で発覚）                                                              |
