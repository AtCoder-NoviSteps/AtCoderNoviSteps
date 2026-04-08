# PR #3316 マージ後修正 実装計画

> Task 1-9（Phases 1-4）は git commits を参照。すべてのルール追加（Phase 7）は既に `.claude/rules/` に反映済み。
> Phase 5 Task 10: Steps 1-3（セレクタ修正）・`navigateToFirstVoteDetailPage` 早期 return 骨格は実装済み。以下は残課題（revised）。

---

## CodeRabbit Findings

> `coderabbit review --base staging --plain` を 2 回実行（3 回目はレートリミットで実施不可）。
> 両回で共通して出た指摘、および片方の実行で出た `potential_issue` 以上を記載。

### potential_issue（中）

| #   | ファイル                                                                          | 行                           | 内容                                                                                                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/routes/(admin)/vote_management/+page.server.ts`                              | L3, L55-63                   | Prisma 固有エラー型 (`PrismaClientKnownRequestError`, `P2025`) をルート層で直接参照。サービス層でドメイン例外 (`TaskNotFoundError` 等) にラップして再 throw し、ルートから Prisma 依存を除去するべき。                                            |
| 2   | `prisma/migrations/20260406112057_add_vote_grade_check_constraints/migration.sql` | L2-15                        | CHECK 制約追加前に既存データが制約を満たすか検証していない。`count < 0` の行や `grade = 'PENDING'` の行が存在する場合マイグレーション失敗→デプロイブロック。事前クエリまたは `NOT VALID` オプションでの段階適用を検討。                           |
| 3   | `src/lib/types/flowbite-svelte-wrapper.ts`                                        | L4-5                         | エクスポート型 `ButtonColor` に TSDoc が未記載。コーディングガイドライン「Add TSDoc to every exported type」に違反。                                                                                                                              |
| 4   | `src/features/votes/internal_clients/vote_grade.ts`                               | L79-85                       | `getBaseUrl` の `http://localhost` フォールバックはポート未指定かつ SSR 環境 (`globalThis.location` が undefined) で意図しないエンドポイントへリクエストを送る可能性。環境変数または `$app/environment` からベース URL を取得する設計が望ましい。 |
| 5   | `src/features/votes/internal_clients/vote_grade.ts`                               | L21-22                       | `data.grade as TaskGrade` はコンパイル時のみの型アサーション。API が予期しない値を返した場合に下流で不具合が発生する。ランタイム型ガード (`isValidTaskGrade`) でバリデーション後に返すべき。                                                      |
| 7   | `src/features/votes/actions/vote_actions.ts`                                      | L55                          | `upsertVoteGradeTables` の戻り値をそのままクライアントに返しており、Prisma モデルや内部データが漏洩するリスク。戻り値を使わないか、安全な DTO に変換してから返すべき。                                                                            |
| 8   | `prisma/schema.prisma`                                                            | L258-259, L273-277, L290-291 | migration.sql に手動追加した CHECK 制約 (`grade != 'PENDING'`, `count >= 0`) が `prisma/ERD.md` に記載されていない。コーディングガイドライン「CHECK constraints added manually to migration.sql must be documented in prisma/ERD.md」に違反。     |
| 9   | `src/features/votes/components/VotableGrade.svelte`                               | L74-76, L97-98               | `voteAbortController?.abort()` 由来の `AbortError` が catch されずにエラーメッセージとして表示される。`error.name === 'AbortError'` を確認して静かに無視するべき。                                                                                |
| 10  | `src/features/votes/components/VotableGrade.svelte`                               | L109-113                     | `fetchMedianVote` に abort signal が渡されておらず、連続クリック時に古いレスポンスが後から返り表示が不整合になる可能性がある（低確率）。                                                                                                          |

---

### 動作確認チェックリスト

- [ ] `AtCoderVerificationForm`: 文字列生成ボタン押下中に Spinner が表示され、二重送信不可
- [ ] `AtCoderVerificationForm`: クリップボードアイコンクリック後にチェックマークアニメーション表示
- [ ] `AtCoderVerificationForm`: 「本人確認」と「リセット」ボタン間に適切な隙間
- [ ] `VotableGrade`: グレードを連打しても最後のリクエストのみ処理される
- [ ] `votes/[slug]`: 投票閾値ツールチップが定数参照（`MIN_VOTES_FOR_STATISTICS`）に基づいて表示
- [ ] vote_management: 存在しない taskId で `setTaskGrade` を呼んでも 500 ではなく `{ success: false }` が返る
- [ ] DB: `VotedGradeCounter.count` に負の値を INSERT しようとすると CHECK 制約違反エラー
