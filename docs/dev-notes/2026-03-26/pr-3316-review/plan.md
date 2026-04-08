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

## 精査結果：対応方針

| #   | 方針           | 理由                                                                                                                                                                        |
| --- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **対応する**   | ルート層に Prisma 依存があるのは層違反。`updateTask` を `null` 返却に変更して分離。                                                                                         |
| 2   | **対応不要**   | 対象テーブル（VoteGrade / VotedGradeCounter / VotedGradeStatistics）は今回新規追加。適用前データが存在しないため制約違反は起きない。                                        |
| 3   | **対応する**   | TSDoc 1 行追加のみ。コーディングガイドライン準拠。                                                                                                                          |
| 4   | **対応する**   | `browser` ガードを追加し SSR 文脈で呼ばれた場合に明示的に警告。                                                                                                             |
| 5   | **対応する**   | `isValidTaskGrade` 型ガードを `src/lib/utils/` に追加し、`as TaskGrade` を排除。                                                                                            |
| 7   | **対応する**   | `upsertVoteGradeTables` の戻り型は実際には `Promise<{ success: true }>` でありリスクなしだが、`return await` をやめて明示 `return { success: true }` に変更し意図を明確化。 |
| 8   | **ルール修正** | `prisma-erd-generator` が ERD.md を毎回上書きするため追記は即消える。`coding-style.md` の「ERD.md に記載せよ」ルールを「schema.prisma インラインコメントで代替」に修正。    |
| 9   | **対応する**   | `submitVote` が AbortError を内部で catch して `false` 返却するため `.catch()` には AbortError が届かない。正しい修正は `.then()` 内で `signal?.aborted` チェックを挿入。   |
| 10  | **対応する**   | #9 と同ファイル。`fetchMedianVote` に `signal` パラメータを追加し連続クリック時の古いレスポンス上書きを防ぐ。                                                               |

---

## 実装フェーズ

### Phase 1: Doc / Rules（最低リスク）

**Task 1 — #3: ButtonColor に TSDoc を追加**

- `src/lib/types/flowbite-svelte-wrapper.ts` に 1 行 TSDoc

**Task 2 — #8: coding-style.md の ERD.md ルールを修正**

- (英語でルールを更新) `.claude/rules/coding-style.md` の「`prisma/ERD.md` に記載せよ」を「`schema.prisma` のインラインコメントで文書化せよ（ERD.md は prisma-erd-generator が上書きするため不可）」に変更

---

### Phase 2: Internal Client 修正（`vote_grade.ts`）

**Task 3 — #5: isValidTaskGrade 型ガードを追加（TDD）**

- テスト先行: `src/test/utils/task_grade.test.ts`
- 実装: `src/lib/utils/task_grade.ts` に `isValidTaskGrade(value: unknown): value is TaskGrade`
- `vote_grade.ts` の `data.grade as TaskGrade` を 2 箇所置き換え（fetchMyVote, fetchMedianVote）

**Task 4 — #4: getBaseUrl SSR 安全化**

- `$app/environment` の `browser` をインポートし、SSR 呼び出し時は `console.warn` + `''` 返却
- **背景**: `browser === false` はサーバー側実行を示す。SSR フェーズでブラウザ API (`window.location` 等) を呼ぶとクラッシュするため、ガードで安全に失敗させる

**Task 5 — #10: fetchMedianVote に signal パラメータを追加**

- `fetchMedianVote(taskId: string, signal?: AbortSignal)` にシグネチャ拡張し fetch に渡す
- **背景**: signal は「キャンセル機能を実装するための仕組み」。abort() されると AbortError が throw されるため、連続クリック時に古いレスポンスの上書きを防ぐ

---

### Phase 3: Component 修正（`VotableGrade.svelte`）

**Task 6 — #9 + #10: AbortError UX バグ修正 + signal 伝搬**

- `.then()` 内で `signal?.aborted` チェックを挿入し abort 時はエラートーストを出さずに early return

  ```typescript
  .then(async (succeeded) => {
    if (signal?.aborted) {
      return; // Intentional abort — user selected a different grade
    }

    if (!succeeded) { throw new Error('Failed to vote'); }
    ...
  })
  ```

- `fetchMedianVote(taskId, signal)` に signal を渡す

---

### Phase 4: Service / Action 層

**Task 7 — #1: P2025 処理をサービス層に移動（TDD）**

- テスト先行: `updateTask` が P2025 で `null` を返すケースを追加
- `src/lib/services/tasks.ts`: P2025 を catch して `null` 返却に変更（他の呼び出し元を事前に確認）
- `src/routes/(admin)/vote_management/+page.server.ts`: `Prisma` インポート削除、`null` チェックでエラーレスポンスを返す

**Task 8 — #7: vote_actions.ts の明示 return**

- `return await upsertVoteGradeTables(...)` → `await upsertVoteGradeTables(...); return { success: true as const };`
- **背景**: `as const` は `true` をリテラル型に固定し、TypeScript が「success === true の時は成功メッセージ必須」を型チェックで強制。Rust の `Result<T, E>` enum に近い安全性を実現

---

## 対象ファイル一覧

| ファイル                                             | Phase |
| ---------------------------------------------------- | ----- |
| `src/lib/types/flowbite-svelte-wrapper.ts`           | 1     |
| `.claude/rules/coding-style.md`                      | 1     |
| `src/lib/utils/task_grade.ts` (新規)                 | 2     |
| `src/test/utils/task_grade.test.ts` (新規)           | 2     |
| `src/features/votes/internal_clients/vote_grade.ts`  | 2     |
| `src/features/votes/components/VotableGrade.svelte`  | 3     |
| `src/lib/services/tasks.ts`                          | 4     |
| `src/routes/(admin)/vote_management/+page.server.ts` | 4     |
| `src/features/votes/actions/vote_actions.ts`         | 4     |

---

## 動作確認チェックリスト

- [ ] `AtCoderVerificationForm`: 文字列生成ボタン押下中に Spinner が表示され、二重送信不可
- [ ] `AtCoderVerificationForm`: クリップボードアイコンクリック後にチェックマークアニメーション表示
- [ ] `AtCoderVerificationForm`: 「本人確認」と「リセット」ボタン間に適切な隙間
- [ ] `VotableGrade`: グレードを連打しても「投票状況の更新に失敗しました」が**表示されない**こと
- [ ] `votes/[slug]`: 投票閾値ツールチップが定数参照（`MIN_VOTES_FOR_STATISTICS`）に基づいて表示
- [ ] vote_management: 存在しない taskId で `setTaskGrade` を呼んでも 500 ではなく `{ success: false }` が返る
- [ ] DB: `VotedGradeCounter.count` に負の値を INSERT しようとすると CHECK 制約違反エラー
