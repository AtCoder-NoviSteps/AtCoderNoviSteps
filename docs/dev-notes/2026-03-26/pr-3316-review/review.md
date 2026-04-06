# マージ後の修正タスク一覧

## 優先度：高（機能に直結）

### Svelte: VotableGrade コンポーネント

| #   | 内容                                                                                                                        | 難度 |
| --- | --------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1   | fetch 3 呼び出しに `credentials: 'same-origin'` を追加（getMyVote・POST・getMedianVote）                                    | ⭐   |
| 2   | `onTriggerClick`（getMyVote）と `handleSubmit`（投票送信＋getMedianVote）を `src/features/votes/utils/` に抽出 + 単体テスト | ⭐⭐ |
| 3   | `selectedVoteGrade` 連打対策：`AbortController` または seq number で古い応答を無視                                          | ⭐⭐ |

### Service: vote_actions.ts

| #   | 内容                                                      | 難度 |
| --- | --------------------------------------------------------- | ---- |
| 4   | `upsertVoteGradeTables` 成功時に `{ success: true }` 返す | ⭐   |

### Routes: votes 関連

| #   | 内容                                                                                                             | 難度 |
| --- | ---------------------------------------------------------------------------------------------------------------- | ---- |
| 5   | `vote_grade.ts` から `MIN_VOTES_FOR_STATISTICS` export、`/votes/[slug]/+page.svelte` で参照（現在 hardcode "3"） | ⭐   |
| 6   | `votes/[slug]/+page.svelte` の `Pct` → `percentage`                                                              | ⭐   |

### Routes: vote_management

| #   | 内容                                                                                                                    | 難度 |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ---- |
| 7   | `(admin)/vote_management/+page.server.ts` の `updateTask` で 404 エラー処理（try/catch で RecordNotFound or pre-check） | ⭐   |

### UI/UX: Submitting State & Server Load Mitigation

| #   | 内容                                                                                                                 | 難度 |
| --- | -------------------------------------------------------------------------------------------------------------------- | ---- |
| 8a  | `SubmissionButton.svelte`: Flowbite `loading` prop を活用（Spinner + disabled 自動）                                 | ⭐   |
| 8b  | `AtCoderVerificationForm.svelte`: submitting 状態を検出、ボタン無効化（generated & validate ステップで二重送信防止） | ⭐⭐ |

#### 実装方針：FormWrapper コンテキスト経由で loading 状態を提供

**背景**: AuthForm.svelte の `isSubmitting` 手動管理 + superforms 依存は改修対象外だが、新規実装では最小限＆標準的に。

**方法**: FormWrapper を拡張 → `use:enhance` コールバックで loading 状態を追跡 → Svelte context 経由で子に提供

**実装手順**:

1. `FormWrapper.svelte`:
   - `let isSubmitting = $state(false)` 追加
   - `use:enhance` コールバックで状態管理（submit時 true, 完了時 false）
   - `setContext('form', { get isSubmitting() })` で子に提供

2. `SubmissionButton.svelte`:
   - `loading?: boolean` prop を追加
   - `<Button type="submit" ... {loading}>` で Flowbite の loading 機能を活用
   - Spinner + disabled が自動で適用される

3. `AtCoderVerificationForm.svelte`:
   - `getContext('form')` で isSubmitting を取得
   - `<SubmissionButton ... loading={isSubmitting} />`

| #   | 内容                                                                                                                    | 難度 |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ---- |
| 8c  | `AtCoderVerificationForm.svelte`: 「本人確認」ボタンと「リセット」ボタン間に隙間を追加                                  | ⭐   |
| 8d  | `AtCoderVerificationForm.svelte`: Flowbite Clipboard コンポーネント導入（カスタム関数削除 + copy 成功時アニメーション） | ⭐   |

**メリット**:

- Flowbite 標準機能（loading + Spinner + disabled 自動）
- FormWrapper 拡張は他の form でも再利用可能
- SvelteKit 公式パターン（use:enhance コールバック）
- 最小限の変更で効果最大

---

## 優先度：中（データ整合性）

### Database: Prisma Schema & Migration

| #   | 内容                                                                                                                         | 難度 |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ---- |
| 12  | `VotedGradeCounter.count >= 0` CHECK 制約追加（migration）                                                                   | ⭐   |
| 13  | `VoteGrade.grade`, `VotedGradeCounter.grade`, `VotedGradeStatistics.grade` に `CHECK (grade != 'PENDING')` 追加（migration） | ⭐   |

---

## 優先度：中（テスト）

| #   | ファイル                                                     | 内容                                                                             | 難度 |
| --- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- | ---- |
| 9   | `e2e/votes.spec.ts`                                          | セレクタ不一致修正（heading '投票'、columnheader '問題名'/'出典'）+ 初期状態対応 | ⭐⭐ |
| 10  | `src/lib/services/users.ts`                                  | `getUser`, `getUserById`, `deleteUser` の単体テスト追加                          | ⭐⭐ |
| 11  | `src/features/account/services/atcoder_verification.test.ts` | manual `process.env` → `vi.stubEnv()` + `vi.unstubAllEnvs()` パターンに変更      | ⭐   |

---

## 優先度：低（並行処理対策・将来）

| #   | ファイル        | 内容                                                                                                              | 難度   |
| --- | --------------- | ----------------------------------------------------------------------------------------------------------------- | ------ |
| 14  | `vote_grade.ts` | 並行投票対策：`SELECT FOR UPDATE` または `SERIALIZABLE` 分離レベル（UI `isOpening` フラグで実用上ほぼ発生しない） | ⭐⭐⭐ |

---

## 汎用的・新規性の高い教訓：rules / skills への追加候補

### Svelte Components Rules

| 規約             | 内容                                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSR 安全性       | SSR で実行されるコンポーネント初期化コードに `crypto.randomUUID()` や `Math.random()` を使わない。ID が必要な場合は props の値から決定的に導出する |
| `{#each}` キー式 | `{#each}` には必ずキー式 `(item.id)` を付ける                                                                                                      |

### Prisma DB Rules

| 規約                | 内容                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| FK 制約と @relation | 他モデルの ID を参照するフィールドには必ず `@relation` を定義する（FK 制約の自動生成のため）         |
| DB 層での値域制約   | `count` フィールド（≥0）や enum フィールド（特定値の除外）には CHECK 制約を追加する（DB 層での検証） |

### Coding Style Rules

| 規約                                     | 内容                                                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `+page.server.ts` の load 関数           | サービス関数を呼ぶ際は try-catch で囲み、失敗時は安全なデフォルト値を返す（ページ全体のクラッシュを防ぐ）                                                                                  |
| Auth: アクション監査                     | `+page.server.ts` で 1 つのアクションに auth チェックを追加したら、同ファイルの他すべてのアクションも監査する。非対称なガード（delete 保護、generate/validate/reset 未保護）は再発パターン |
| Auth: success フラグ と message の一貫性 | `+page.server.ts` アクションが `success: false` を返すとき、`message` と `message_type` も失敗を反映する。成功フラグと矛盾するメッセージは静かなバグ                                       |
| Dead Code 削除の基準                     | 関数削除前に全プロジェクトを grep して呼び出し元を確認。(1) 呼び出し元がゼロ、(2) 代替実装が存在、(3) 書き込み対象フィールドも削除される、の 3 つ揃って初めて安全                          |

### Testing Rules

| 規約           | 内容                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 環境変数スタブ | `process.env` を手動で設定・削除せず、`vi.stubEnv()` + `vi.unstubAllEnvs()` を使う。`import.meta.env` も同期され、元の値を正確に復元できる |
