# 問題集一覧 URLパラメータフィルタリング 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/workbooks` ページで `WorkBookPlacement.priority` 順に問題集を表示し、URLパラメータ（`?tab=curriculum&grades=Q10` / `?tab=solution&categories=GRAPH`）でサーバーサイドフィルタリングを行う

**Architecture:** `+page.server.ts` でURLパラメータを解析し、`getPublishedWorkbooksByPlacement(query)` が `WorkBookPlacement` レコードで絞り込み・`priority ASC` ソートして返す。クライアントサイドのグレードフィルタリングを削除し、`goto()` + `buildWorkbooksUrl()` による SvelteKit クライアントサイドナビゲーションに置き換える。`CREATED_BY_USER` タブは管理者専用として維持し、URL 変更なしのローカル状態で管理する。

**Tech Stack:** SvelteKit 2 + Svelte 5 Runes + TypeScript | Prisma (PostgreSQL) | Flowbite Svelte (ButtonGroup) | Vitest + Playwright

---

## 背景・経緯

- PR #3252 で `WorkBookPlacement` モデルを使った管理者向け並び替え機能を実装済み
- PR #3281 で関連する機能について事前にリファクタリング
- 本タスクは管理者が設定した並び順を `/workbooks` 公開ページに反映させる

**決定済みの仕様:**

- placement レコードがない問題集は表示しない（Prisma のネスト where フィルタが IS NOT NULL を暗黙的に含む）
- `isReplenished` トグルはクライアントサイドのままで維持
- `CREATED_BY_USER` タブは管理者のみ閲覧可能（URL パラメータ管理外・ローカル `$state` で isOpen 管理）
- グレード/カテゴリ ボタンクリック → `buildWorkbooksUrl()` で URL 組み立て → `goto()` で SvelteKit クライアントナビゲーション
- URLパラメータなし時のデフォルト: カリキュラム Q10 / 解法別 SEARCH_SIMULATION

---

## ファイル構成

### 新規作成

| ファイル                                                             | 役割                                           |
| -------------------------------------------------------------------- | ---------------------------------------------- |
| `src/features/workbooks/utils/workbook_url_params.ts`                | URLパラメータ解析・組み立てユーティリティ      |
| `src/features/workbooks/utils/workbook_url_params.test.ts`           | 上記のユニットテスト                           |
| `src/features/workbooks/components/list/SolutionWorkBookList.svelte` | 解法別カテゴリ選択 ButtonGroup + SolutionTable |

### 修正

| ファイル                                                               | 変更内容                                                                                        |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/features/workbooks/types/workbook.ts`                             | `WorkBookTab` 型・定数追加                                                                      |
| `src/routes/(admin)/workbooks/order/_types/kanban.ts`                  | `ActiveTab` を `WorkBookTab` の再エクスポートに変更                                             |
| `src/features/workbooks/utils/workbooks.ts`                            | `splitWorkbooksByReplenishment()` 追加                                                          |
| `src/features/workbooks/utils/workbooks.test.ts`                       | 上記テスト追加                                                                                  |
| `src/features/workbooks/services/workbooks.ts`                         | `PlacementQuery` 型・`getPublishedWorkbooksByPlacement()` / `getWorkBooksCreatedByUsers()` 追加 |
| `src/features/workbooks/services/workbooks.test.ts`                    | 上記テスト追加                                                                                  |
| `src/routes/workbooks/+page.server.ts`                                 | URLパラメータ解析・新サービス呼び出し                                                           |
| `src/features/workbooks/components/list/CurriculumWorkBookList.svelte` | ストア削除・`currentGrade` prop 化・`splitWorkbooksByReplenishment` 使用                        |
| `src/features/workbooks/components/list/WorkbookTabItem.svelte`        | `workbookType` prop 削除・`onclick` prop 化                                                     |
| `src/features/workbooks/components/list/WorkBookList.svelte`           | SOLUTION → SolutionWorkBookList ルーティング追加                                                |
| `src/routes/workbooks/+page.svelte`                                    | URL駆動タブ/フィルタ・CREATED_BY_USER 管理者のみ表示                                            |
| `e2e/workbooks_list.spec.ts`                                           | E2Eテスト更新                                                                                   |

### 削除（Phase 9）

| ファイル                                                               | 理由                         |
| ---------------------------------------------------------------------- | ---------------------------- |
| `src/features/workbooks/stores/task_grades_by_workbook_type.ts` + test | URLパラメータに置き換え      |
| `src/features/workbooks/stores/active_workbook_tab.ts` + test          | ローカル `$state` に置き換え |

---

## Phase 一覧

| Phase | ファイル                     | 内容                                             | リスク |
| ----- | ---------------------------- | ------------------------------------------------ | ------ |
| 0     | [phase-0.md](./phase-0.md)   | `WorkBookTab` 型を feature types に追加・統一    | 極低   |
| 1     | [phase-1.md](./phase-1.md)   | `splitWorkbooksByReplenishment()` ユーティリティ | 極低   |
| 2     | [phase-2.md](./phase-2.md)   | `workbook_url_params.ts` 解析・URL組み立て       | 極低   |
| 3     | [phase-3.md](./phase-3.md)   | `getPublishedWorkbooksByPlacement()` サービス    | 中     |
| 4     | [phase-4.md](./phase-4.md)   | `+page.server.ts` URLパラメータ対応              | 中     |
| 5     | [phase-5.md](./phase-5.md)   | `SolutionWorkBookList.svelte` 新規作成           | 低-中  |
| 6     | [phase-6.md](./phase-6.md)   | `CurriculumWorkBookList.svelte` リファクタリング | 中     |
| 7     | [phase-7.md](./phase-7.md)   | `WorkbookTabItem.svelte` 簡素化                  | 低     |
| 8     | [phase-8.md](./phase-8.md)   | `WorkBookList.svelte` + `+page.svelte` 改修      | 中-高  |
| 9     | [phase-9.md](./phase-9.md)   | 不要ストア削除                                   | 低     |
| 10    | [phase-10.md](./phase-10.md) | E2Eテスト更新                                    | 低     |

---

## 最終検証

- [ ] `pnpm test:unit` — 全ユニットテスト通過
- [ ] `pnpm test:e2e -- --grep "workbooks"` — E2Eテスト通過
- [ ] `pnpm check` — 型エラーなし
- [ ] `pnpm lint` — Lintエラーなし
- [ ] `pnpm format` — フォーマット適用済み
- [ ] 手動確認（`pnpm dev`）:
  - `/workbooks` → カリキュラム Q10 が表示
  - グレードボタンクリック → 画面リロードなしで URL・コンテンツ更新
  - 解法別タブクリック → `?tab=solution&categories=SEARCH_SIMULATION`
  - カテゴリボタンクリック → URL・コンテンツ更新
  - `/workbooks?tab=solution&categories=GRAPH` 直アクセス → 正しく表示
  - 管理者: ユーザ作成タブが表示される（URL 変更なし）
  - 一般ユーザ: ユーザ作成タブが非表示
  - 補充教材トグルが引き続き動作する

---

## 影響範囲まとめ

| ファイル                                                           | 変更種別     | 理由                                                             |
| ------------------------------------------------------------------ | ------------ | ---------------------------------------------------------------- |
| `src/routes/sitemap.xml/+server.ts`                                | **変更なし** | `/workbooks/[slug]` 個別 URL を生成するのみ。一覧ページは対象外  |
| `src/routes/workbooks/+page.server.ts` (delete action)             | **変更なし** | フォーム送信後の再ロードも URL パラメータを引き継ぐ              |
| `src/routes/(admin)/workbooks/order/`                              | **変更なし** | 管理者専用の独立ルート（`ActiveTab` 型のみ再エクスポートに変更） |
| `src/features/workbooks/components/list/WorkBookList.svelte`       | **修正**     | SOLUTION → SolutionWorkBookList ルーティング追加のみ             |
| `src/features/workbooks/components/list/CreatedByUserTable.svelte` | **変更なし** | CREATED_BY_USER タブは管理者向けに維持                           |

---

## 計画中の教訓・誤解

| #   | 誤解・ミス                                          | 正しい判断                                                                                                                                                      |
| --- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `CREATED_BY_USER` タブを「完全削除」と計画した      | 「管理者のみ閲覧可能として維持」が正しい仕様。削除前に「既存ユーザー向けに残す機能か」を確認すること                                                            |
| 2   | `workbook_list_params.ts` と命名した                | 何の params か不明。`workbook_url_params.ts` のように対象を明示する                                                                                             |
| 3   | ストアが localStorage を使っていると誤解した        | `task_grades_by_workbook_type` と `active_workbook_tab` は in-memory の Svelte `writable()` のみ。localStorage を使うのは `replenishmentWorkBooksStore` だけ    |
| 4   | `WorkBookList.svelte` を削除対象に含めた            | ルーティングコンポーネントは既存の責務を持つ。削除前に「他で代替できるか」を確認すること                                                                        |
| 5   | `WorkBookTab` を新規定義しようとした                | order ページに同一の `ActiveTab = 'solution' \| 'curriculum'` が既存。重複前に `grep` で型の存在を確認すること                                                  |
| 6   | parse 関数の引数を `string \| null` にした          | SvelteKit では `URLSearchParams` を直接渡すパターンが標準（order ページの `parseInitialCategories(params)` が先例）。既存コードのパターンを先に調べること       |
| 7   | サービス引数をオプショナル `taskGrade?` で設計した  | `tab === 'curriculum'` の条件分岐が呼び出し側に散らばる。discriminated union (`PlacementQuery`) で型レベルに閉じ込める                                          |
| 8   | テストに `it` と日本語テスト名を使った              | このプロジェクトは `test` + 英語テスト名が規約。既存テストのスタイルを先に確認すること                                                                          |
| 9   | テストでハードコード文字列を直書きした              | 定数（`TaskGrade.Q10` など）を使う。文字列が変わってもテストが壊れない                                                                                          |
| 10  | URL 組み立てをインライン文字列テンプレートで書いた  | URL 組み立ては純粋関数 `buildWorkbooksUrl()` に集約する。order ページの `buildUpdatedUrl()` が先例                                                              |
| 11  | `url.searchParams.get('tab')` を3回繰り返した       | `const params = url.searchParams` で変数に切り出す                                                                                                              |
| 12  | E2E テストのグレード・カテゴリケースが1件のみだった | URL パラメータのバリエーションを `for...of` ループで複数カバーする                                                                                              |
| 13  | 計画を単一ファイルに書き続けた（1000行超）          | plan.md は全体俯瞰（goal / 構成 / phase 一覧 / 検証）に留め、詳細タスクは `phase-N.md` に分割する。コンテキスト圧迫を防ぎ、phase 単位での参照・更新が容易になる |
