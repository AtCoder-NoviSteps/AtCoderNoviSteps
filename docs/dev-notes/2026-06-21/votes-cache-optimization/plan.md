# votes 一覧のキャッシュ最適化

## 概要

`/votes` の load は毎回 **全タスク（本番≈9000件）+ 全 stats + 全 counters** を 3 テーブルから取得・結合して SSR に載せている。UI 上は初期表示 0 件、検索しても最大 20 件のみ表示。データは全員共有（個人の解答状態・投票を含まない）。

**方針 B**（`docs/dev-notes/2026-06-13/sveltekit-caching/plan.md` で定義）を採用:

- サーバー側キャッシュ: `getAllTasksWithVoteInfo()` の結果を丸ごとキャッシュ
- CDN キャッシュ: 匿名時のみ `s-maxage` を付与し、bot/匿名アクセスで関数起動を省略

クライアント側の即時検索 UX は維持。全件転送（≈9000 件）は毎回発生し続けるが、DB クエリの Duration はキャッシュで削減。匿名時は CDN キャッシュで関数起動自体を省略。

## 設計根拠

### 方針 A（サーバー検索エンドポイント化）を採用しない理由

方針 A は Duration と Transfer 両方を最大削減できるが、検索のたびにサーバーリクエストが発生し、現在のクライアント側即時検索の UX が損なわれる。ユーザー判断により UX 維持を優先。

### アプローチ選択: 単一キャッシュ vs 構成要素別キャッシュ

- **単一キャッシュ（採用）**: `getAllTasksWithVoteInfo()` の結果（`TaskWithVoteInfo[]`）を丸ごとキャッシュ。シンプルで、plan の影響範囲表と整合。
- **構成要素別キャッシュ（却下）**: 既存の tasks/stats キャッシュを再利用し counters のみ新規追加。`getAllTasksWithVoteInfo` は 7 カラムの projection + 結合ロジックなので、全カラムの既存キャッシュとは型が合わず不自然。

### キャッシュ対象データの安全性

`TaskWithVoteInfo` は以下の共有データのみ含む（個人データなし）:

- `task_id`, `contest_id`, `title`, `grade`, `task_table_index` — タスクの基本情報
- `estimatedGrade` — 全ユーザーの投票から算出された中央値
- `voteTotal` — 投票の合計数

個人の回答状況（`taskAnswer`）や個人の投票（`voteGrade`）は一切含まれない。キャッシュしても他ユーザーの個人データが漏洩するリスクはゼロ。

### ログイン/匿名の表示差異

現在 votes 一覧はログイン/匿名で同一表示だが、将来ログイン時に差分表示（投票ボタン等）を追加する可能性がある。CDN キャッシュは匿名時のみに限定する。

## Phase 1: サーバーキャッシュ

### 変更ファイル

| ファイル                                              | 変更内容                                                                                                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/votes/server/cache.ts`                  | `Cache<TaskWithVoteInfo[]>` インスタンス追加。`getCachedAllTasksWithVoteInfo()` ラッパー。`invalidateVoteCaches()` / `disposeVoteCaches()` 拡張 |
| `src/features/votes/services/vote_statistics.ts`      | `getAllTasksWithVoteInfo()` を `getCachedAllTasksWithVoteInfo()` でラップ                                                                       |
| `src/lib/services/tasks.ts`                           | `createTask()` / `updateTask()` に `invalidateVoteCaches()` 追加                                                                                |
| `src/features/votes/server/cache.test.ts`             | 新キャッシュのワイヤリング・invalidation テスト追加                                                                                             |
| `src/features/votes/services/vote_statistics.test.ts` | mock 更新                                                                                                                                       |

### キャッシュ仕様

- TTL: 10 分（既存の vote stats キャッシュと同じ。投票データの更新頻度に合わせる）
- キー: 固定文字列（全タスク対象で引数なし）
- Stampede 防止: `Cache<T>.getOrFetch()` の in-flight 共有で自動対応

### Invalidation 経路

| 書き込み操作                | invalidation                                                                |
| --------------------------- | --------------------------------------------------------------------------- |
| `upsertVoteGradeTables()`   | 既存の `invalidateVoteCaches()` が拡張されるので自動的にカバー              |
| `updateTask()` (grade 変更) | `invalidateVoteCaches()` を追加                                             |
| `createTask()`              | `invalidateVoteCaches()` を追加（新規タスクが検索にヒットしない状態を防止） |

### テスト

- `cache.test.ts`: ワイヤリング（`getCachedAllTasksWithVoteInfo` が fetchFn を委譲し、2 回目はキャッシュヒット）、invalidation グルーピング（`invalidateVoteCaches()` で新キャッシュもクリアされる）
- `vote_statistics.test.ts`: mock 更新（`getCachedAllTasksWithVoteInfo` を passthrough mock）

## Phase 2: CDN キャッシュ（匿名時）

### 変更ファイル

| ファイル                               | 変更内容                                               |
| -------------------------------------- | ------------------------------------------------------ |
| `src/routes/votes/+page.server.ts`     | 匿名時に `setHeaders({ 'cache-control': '...' })` 追加 |
| `src/routes/votes/page_server.test.ts` | 新規。load の匿名/ログイン時のヘッダー検証             |

### CDN キャッシュ仕様

- 匿名時（`session === null`）のみ: `public, max-age=0, s-maxage=300, stale-while-revalidate=600`
- ログイン時: `setHeaders` を呼ばない（将来のログイン時差分表示に備える）
- degraded フラグは不要（votes の load に try/catch がなく、例外は SvelteKit のエラーハンドリングに委ねる）

### テスト

Phase 3（`/problems`）で確立したパターンに倣う:

1. 匿名時に cache-control ヘッダーが設定される
2. ログイン時に cache-control ヘッダーが設定されない
3. 正しいデータ（tasks, isLoggedIn）を返す

## 検証

- `pnpm test:unit` で各テストが通ること
- ローカルで匿名/ログインのレスポンスヘッダー確認
- デプロイ後、Vercel ダッシュボードで Duration / Fast Origin Transfer を観測
