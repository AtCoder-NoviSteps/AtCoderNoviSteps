# 組合せゲーム 24 題（game-24）のインポートと xDPC グループへの追加

## 概要

[組合せゲーム 24 題](https://atcoder.jp/contests/game-24) を、新しい ContestType `GAME_24` としてインポートできるようにし、問題一覧の xDPC グループに表示する。

- contest_id は `game-24`、問題は A〜X の 24 問。
- task_id は `game_a`〜`game_x` で、contest_id の `24` を含まない（`fps-24` の `fps_24_a` とは形式が異なる）。
- `GAME_24` は enum・priority ともに `FPS_24` の直後に置く。
- テーブルは xDPC グループの「FPS 24 題」の後に追加し、グループ名を「xDPC・x 24 題」に改名する。
- 本番 DB には、main への反映後に管理画面 `/tasks` からインポートする。マイグレーションは CI の本番ジョブ（`.github/workflows/ci.yml`）がデプロイ前に `prisma migrate deploy` で適用する。インポート時に `classifyContest('game-24')` が `GAME_24` を返すことが前提になる。

参考: `.agents/skills/add-contest-table-provider/`、FPS 24 追加時の #2796（インポート）と #2797（テーブル）、ラベルを種別ごとに分割した #4021。

## 決定事項

| 項目                           | 値                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------- |
| 実装パターン                   | Pattern 2（単一 contest_id）                                                 |
| enum コメント                  | `// 24 Problems on Combinatorial Games`                                      |
| コンテスト名ラベル・表タイトル | `組合せゲーム 24 題`                                                         |
| `abbreviationName`             | `game-24`                                                                    |
| グループ名・`buttonLabel`      | `xDPC・x 24 題`                                                              |
| `ariaLabel`                    | `xDPC and x 24 contests`                                                     |
| プリセットキー                 | `dps` のまま（画面に表示されないため）                                       |
| 表示設定                       | FPS 24 と同じ                                                                |
| seed                           | `prisma/tasks.ts` に 24 行を追加し、grade は付けない（問題名はユーザー提供） |
| PR                             | 1 PR・3 コミット（plan / Layer 1–3 と seed / Layer 4–5 と E2E）              |
| レビュー                       | DB スキーマとマイグレーションを含むため、Codex でクロスレビューする          |

## 設計判断

- **分類:** contest_id の完全一致で判定できるので、`CONTEST_TYPES_BY_ID` に `['game-24', ContestType.GAME_24]` を追加する。`CLASSIFICATION_RULES` には手を入れない。
- **priority:** `GAME_24` を 20 にし、それ以降を 1 つずつずらす（`ATCODER_MAIN_OFFICIAL_ONSITE` 21、`OTHERS` 22、AOJ 系 23〜27）。JSDoc の範囲表記も `0 = Highest, 27 = Lowest`、Special contests `18-22`、External platforms `23-27` に直す。`src/test/lib/utils/task.test.ts` の差分期待値は NDPC・PAST・JOI など 19 以前の種別だけを使っているので、変更は要らない見込み（Phase 1 で実行して確認する）。
- **task_id の形式:** AtCoder の問題 URL は `getTaskUrl` が contestId と taskId を連結して作るだけで（`src/lib/utils/task.ts:23`）、task_id を分解して contest_id を求める処理は AOJ クライアント以外にない。そのため `game_a` 形式でも動作に影響しない。テストのフィクスチャには実際の `game_a` を使い、この非対称を明示する。
- **Provider:** EDPC / TDPC / NDPC / FPS24 と同じく、クラスを複製して `game24_provider.ts` を新しく作る。
- **enum の物理順序:** PostgreSQL の `ALTER TYPE ... ADD VALUE` は末尾に追加するので、DB 上の enum の並びは schema と一致しない。ただし過去の追加分も同じ状態で、表示順は `contestTypePriorities` で管理しているため問題ない。

### 提案シグネチャ

```typescript
// src/features/tasks/utils/contest-table/game24_provider.ts
export class Game24Provider extends ContestTableProviderBase {
  protected setFilterCondition(): (taskResult: TaskResult) => boolean; // contest_id === 'game-24'
  getMetadata(): ContestTableMetaData; // { title: '組合せゲーム 24 題', abbreviationName: 'game-24' }
  getDisplayConfig(): ContestTableDisplayConfig; // FPS24Provider と同値
  getContestRoundLabel(_contestId: string): string; // ''
}
```

```typescript
// contest_table_provider_groups.ts（変更後）
dps: () =>
  new ContestTableProviderGroup(`xDPC・x 24 題`, {
    buttonLabel: 'xDPC・x 24 題',
    ariaLabel: 'xDPC and x 24 contests',
  }).addProviders(
    new EDPCProvider(ContestType.EDPC),
    new TDPCProvider(ContestType.TDPC),
    new NDPCProvider(ContestType.NDPC),
    new FPS24Provider(ContestType.FPS_24),
    new Game24Provider(ContestType.GAME_24),
  ),
```

## 見送り案

- **`x24_providers.ts` に統合する:** `dp_providers.ts` と同じ構成になるが、`fps24_provider.ts` のリネームで差分が膨らむ。必要になった時点で行えばよい。
- **単一 contest_id 用の共通基底クラスを抽出する:** DP 系 3 クラスにも波及し、本タスクの範囲を超える。
- **2 PR に分割する:** FPS 24 のときと同じ分け方だが、変更規模が小さく、1 PR 内でコミットを分ければレビューに支障はない。
- **プリセットキー `dps` を改名する:** 画面に表示されず、activeContestType の保存値が変わると既存ユーザーの選択状態が失われるおそれがある。
- **ボタンに `aria-pressed` を付ける:** E2E で選択状態を検証しやすくなるが、UI の変更になるため別タスクにする。
- **seed に grade を付ける:** fps-24 と同様に PENDING とし、本番では投票または管理画面で設定する。

## フェーズ

### Phase 0: seed データの準備（データのみ）

- 問題名の一覧をユーザーから受け取る（取得元の AtCoder ページと problems.json は、エージェント環境から取得できなかった）。
- `prisma/tasks.ts` の `fps_24_x` ブロックの直前に、fps-24 と同じく `game_x` → `game_a` の降順で 24 行を追加する（`id: 'game_a'`、`contest_id: 'game-24'`、`problem_index: 'A'`、`name`、`title: 'A. <name>'`）。
- 確認: `grep -c "contest_id: 'game-24'" prisma/tasks.ts` が 24 になること。

### Phase 1: ContestType の追加（Layer 1–3、コミット 2）

レイヤー: DB schema / Domain types / Utilities（`src/lib/contests/`）。

1. `prisma/schema.prisma` の `FPS_24` の直後に `GAME_24 // 24 Problems on Combinatorial Games` を追加する。続けて `pnpm exec prisma migrate dev --name add_game_24_to_contest_type` と `pnpm exec prisma generate` を実行する。
2. `src/lib/contests/types/contest.ts` の `FPS_24` の直後に `GAME_24` を追加する。
3. テストを先に書く（RED）。
   - `src/lib/contests/fixtures/contest_type.ts` に `game24`（`createTestCaseForContestType('Game 24')`、`'game-24'` → `ContestType.GAME_24`）を追加する。
   - `src/lib/contests/fixtures/contest_name_labels.ts` に `game24`（`'game-24'` → `'組合せゲーム 24 題'`）を追加する。
   - `classification.test.ts` に `describe('when contest_id is game-24')` を追加する。
   - `labels/index.test.ts` に `describe('when contest_id is game-24')` を追加する。
   - `priority.test.ts` に `test('ranks GAME_24 directly below FPS_24')` を追加する。既存の `assigns a priority to every contest type` も、enum の追加によって RED になる。
4. 実装する（GREEN）。`CONTEST_TYPES_BY_ID`、`contestTypePriorities` と JSDoc、`LABEL_GENERATORS` に `[ContestType.GAME_24, () => '組合せゲーム 24 題']` を追加する。
5. `pnpm test:unit src/lib/contests/ src/test/lib/utils/task.test.ts` を実行する。

### Phase 2: Provider とグループ登録（Layer 4–5、コミット 3）

レイヤー: Utilities（`src/features/tasks/utils/contest-table/`）と Test data。

1. テストを先に書く（RED）。
   - `src/features/tasks/fixtures/contest-table/contest_table_provider.ts` に `taskResultsForGame24Provider` を追加する（`game_a`、`game_b`、`game_m`、`game_x` の 4 問。ステータスは FPS 24 と同じ組み合わせにする）。
   - `game24_provider.test.ts` を `fps24_provider.test.ts` に倣って作る。テスト名は `expects to get correct metadata`、`expects to get correct display configuration`、`expects to format contest round label correctly`、`expects to filter tasks to include only game-24 contest`、`expects to generate correct table structure` など。フィルタのテストでは `fps-24` を混ぜ、除外されることを確認する。
   - `contest_table_provider_groups.test.ts` のテスト名を `dps registers EDPC, TDPC, NDPC, FPS 24, and Game 24 providers` に変え、グループ名・`buttonLabel`・`ariaLabel`・`getSize() === 5`・`getProvider(ContestType.GAME_24)` を検証する。
2. 実装する（GREEN）。`game24_provider.ts` を作成し、`contest_table_provider_groups.ts` で import と `addProviders` の末尾への追加、JSDoc（`DP group (EDPC, TDPC, NDPC, FPS 24, and Game 24)`）の更新を行う。
3. `pnpm test:unit src/features/tasks/utils/contest-table/` を実行する。

### Phase 3: E2E とドキュメント（コミット 3 に含める）

1. `e2e/problems_contest_table.spec.ts` を新しく作る。未ログインで `/problems` を開き、`getByRole('button', { name: 'xDPC and x 24 contests' })` をクリックして、見出しが EDPC → TDPC → NDPC → `FPS 24 題` → `組合せゲーム 24 題` の順に並ぶことを確認する。テスト名は `shows Game 24 table right after FPS 24 in the xDPC group`。見出しは tasks の有無に関係なく描画されるので、seed には依存しない。
2. `docs/guides/how-to-add-contest-table-provider.md` の単一ソース型の表に `| GAME_24 | 'game-24' | 24問 | A～X |` を追加する。task_id が `game_a` 形式であることも脚注で補足する。
3. `pnpm test:e2e e2e/problems_contest_table.spec.ts` を実行する。

### Phase 4: 検証とレビュー

1. `pnpm format`、`pnpm lint`、`pnpm check`、`pnpm test:unit`、`git diff --check` を実行する。
2. 残存参照を確認する: `rg -n "xDPC・FPS 24|xDPC and FPS 24" -g '*.ts' -g '*.svelte' -g '*.md'` が `docs/dev-notes/` 以外で 0 件になること。
3. Codex でクロスレビューする。指摘の修正は、ユーザーが選択した後に行う。

### リリース後の作業（人手）

マイグレーションは、main への push 時に CI の本番ジョブが自動で適用するので、手動の操作は要らない。

1. CI の本番ジョブが成功したことを確認する。
2. 管理画面 `/tasks` で AtCoder ソースから取得し、`game-24` の 24 問をインポートする（AtCoder Problems に反映されていなければ、反映を待つ）。
3. `/problems` の「xDPC・x 24 題」で、テーブルが表示されることを確認する。
