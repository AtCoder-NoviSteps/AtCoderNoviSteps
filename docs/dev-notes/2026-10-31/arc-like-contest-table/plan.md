# ARC-Like コンテストの表を追加する（#4259）

## 概要

問題一覧のコンテスト別の表に「ARC-Like」ボタンと表を追加する。ボタンは「ABC-Like」の直後に置く。

表の形式は ABC-Like と同じにする。ヘッダーは A〜F、行ラベルは contest_id の大文字、行の並びは contest_id の降順（基底クラスの既定）。

対象はメンテナのスプレッドシートにある 21 コンテスト。keyence2021, tokiomarine2020, nomura2020, hitachi2020, keyence2020, dwacon6th-prelims, ddcc2020-qual, nikkei2019-2-qual, jsc2019-qual, diverta2019-2, m-solutions2019, diverta2019, tenka1-2019, exawizards2019, yahoo-procon2019-qual, nikkei2019-qual, keyence2019, caddi2018, dwacon5th-prelims, tenka1-2018, tenka1-2017。

dwacon5th-prelims / dwacon6th-prelims は A〜E の 5 問なので F 列が空く。tenka1-2017/2018/2019 と caddi2018 は C〜F なので A・B 列が空く。

## 現状（調査結果）

- `ContestType.ARC_LIKE` は既にある（schema・`contestTypePriorities`・ラベル）。ラベルは大文字の contest_id に落ちるので、`contest_name_labels.ts` は不要。新しい ContestType とマイグレーションは要らない
- `ARC_LIKE`（`src/lib/contests/utils/prefixes.ts`、完全一致）には 16 コンテストと acl1 がある。m-solutions2019, exawizards2019, tokiomarine2020, nomura2020, hitachi2020 の 5 件が無く、`classifyContest` は `null` を返す
- 分類が `null` のコンテストは管理画面の取り込み（`filterUnregisteredTasks`）でも `createTask` でも飛ばされる。この 5 件を本番に入れるには、分類のデプロイが先になる
- seed（`prisma/tasks.ts`）にあるのは 21 件中 8 件（ddcc2020-qual, nikkei2019-2-qual, diverta2019-2, tenka1-2019, yahoo-procon2019-qual, caddi2018, tenka1-2018, tenka1-2017）。残る 13 件（76 問）の行は、メンテナが用意した `tasks.json` にある。スプレッドシートと問題名まで照合し、欠落・重複が無く、seed の既存行とも重ならないことを確かめた
- tenka1-2017/2018/2019 の C・D は、本来のコンテストが tenka1-201x で、`-beginner` へのペアが既にある。そのため ARC-Like の行には C〜F が出る
- caddi2018 の C・D（`caddi2018_a` / `caddi2018_b`）は、本来のコンテストが caddi2018b で、caddi2018 へのペアが無い。`contest_task_pair.json` の 2 件を足すと、caddi2018 の行も C〜F になる
- acl1 は `ARC_LIKE` に分類されるが、ACL グループ（`ACLProvider`）で表示している
- タスクの `contest_type` 列は書き込むだけで、実行時の表示には使われない（表示は `classifyContest` で決まる）

## 設計

`ARCLikeProvider` を `src/features/tasks/utils/contest-table/axc_like_provider.ts` に `ABCLikeProvider` と並べて追加する（パターン3: 複合ソース型）。

```typescript
export class ARCLikeProvider extends ContestTableProviderBase {
  // classifyContest(contest_id) === ARC_LIKE && contest_id !== 'acl1'
  protected setFilterCondition(): (taskResult: TaskResult) => boolean;
  // { title: 'ARC-Like Contest', abbreviationName: 'arcLike' }
  getMetadata(): ContestTableMetaData;
  // ABCLikeProvider と同じ値（roundLabelWidth: 'xl:w-28' など）
  getDisplayConfig(): ContestTableDisplayConfig;
  // contestId.toUpperCase()
  getContestRoundLabel(contestId: string): string;
}
```

グループは `contest_table_provider_groups.ts` に追加する。ボタンの並びは `contestTableProviderGroups` のキー順（`TaskTable.svelte` が `Object.entries` で回す）なので、`arcLike` を `abcLike` の直後に置く。

```typescript
ARCLike: () =>
  new ContestTableProviderGroup('ARC-Like', {
    buttonLabel: 'ARC-Like',
    ariaLabel: 'Filter contests from ARC-Like',
  }).addProvider(new ARCLikeProvider(ContestType.ARC_LIKE)),

// contestTableProviderGroups
abcLike: presets.ABCLike(),
arcLike: presets.ARCLike(),
```

`ARC_LIKE` に足す 5 件の値（公式名。表示には使われない）:

| contest_id        | 名前                                                       |
| ----------------- | ---------------------------------------------------------- |
| `m-solutions2019` | M-SOLUTIONS プロコンオープン                               |
| `exawizards2019`  | エクサウィザーズ 2019                                      |
| `tokiomarine2020` | 東京海上日動 プログラミングコンテスト2020                  |
| `nomura2020`      | NOMURA プログラミングコンテスト 2020                       |
| `hitachi2020`     | 日立製作所 社会システム事業部 プログラミングコンテスト2020 |

## 決定と不採用の案

- **行の並びは contest_id の降順**: ABC-Like と同じ規則で、追加のコードが要らない。開催日順（スプレッドシートの並び）は、Provider に contest_id の配列を持たせて `getContestRoundIds` を上書きする必要があり、新しいコンテストのたびに配列も直すことになるので採らない（ユーザー判断）
- **共有問題は ARC-Like の行にも出す**: ABC042–125 / ARC058–103 と同じく、共有問題は両方の表に出す。スプレッドシートで tenka1・caddi2018 が E・F だけなのは、C・D を ABC-Like 側に載せているためと解釈した。caddi2018 のペアはこのために足す
- **acl1 は除く**: ACL グループで表示済み。ABC-Like が abl を除くのと揃える
- **seed に 13 件すべて足す**: ローカルの表を本番と揃える（ユーザー判断）。本番に無いと分かっていた 4 件だけだと、ローカルの表は 21 件中 12 件になる
- **ABCLikeProvider との共通基底クラスは作らない**: 既存の Provider はクラスごとに設定を持つ慣習で、差分は除外する contest_id と metadata だけ。抽象化の利得が小さい
- **`ARC_LIKE` を前方一致にしない**: `diverta2019` / `diverta2019-2` のように続編がある。完全一致の規則（`prefixes.ts` のコメント）を守る
- **新しい ContestType は作らない**: 既存の `ARC_LIKE` で足りる

## フェーズ

### フェーズ 1: 分類（Layer 3）

- 層: `src/lib/contests/utils/`（分類）と `src/lib/contests/fixtures/`。既存の `ARC_LIKE` に 5 件を足すだけで、新しい関数は作らない
- テスト: `contest_type.ts` の `arcLike` に 5 件（`M-SOLUTIONS 2019` / `エクサウィザーズ 2019` / `Tokio Marine 2020` / `NOMURA 2020` / `HITACHI 2020`、いずれも `expected: ContestType.ARC_LIKE`）を足す。`classification.test.ts` が `arcLike` を回すので、テスト本体は変えない
- `pnpm test:unit src/lib/contests/` で RED → `prefixes.ts` の `ARC_LIKE` に 5 件を足す → GREEN
- コミット: `feat(contests): classify five more contests as ARC-Like (#4259)`

### フェーズ 2: seed

- 分類を先に入れておく。seed は `classifyContest` が `null` だと `contest_type` を既定の `ABC` にするため
- `prisma/tasks.ts`: `tasks.json` の 13 件（76 問）を ARC-Like のブロック（acl1〜tenka1-2017）に、開催日の新しい順で差し込む。コンテスト内は F → A。スクリプトで生成し、`grep -c` で件数を確かめる
- `prisma/contest_task_pairs.ts`: caddi2018 ↔ `caddi2018_a`（C）・`caddi2018_b`（D）の 2 件を足す
- `pnpm db:seed` が通ること
- `tasks.json` / `contest_task_pair.json` はこのコミットで消す
- データだけでテストは書かない
- コミット: `chore(seed): add ARC-Like tasks and caddi2018 pairs (#4259)`

### フェーズ 3: Provider とグループ（Layer 4–5）

- 層: `src/features/tasks/utils/contest-table/` と `src/features/tasks/fixtures/contest-table/`
- フィクスチャ: `taskResultsForARCLikeProvider` を足す。tenka1-2017 の C（既存の `tenka1_2017_c` を使う）・E・F、caddi2018 の C（`taskId: 'caddi2018_a'`）・F（`caddi2018_d`）、keyence2021 の A・F、dwacon5th-prelims の A・E、m-solutions2019 の A
- テスト（`axc_like_provider.test.ts` に `describe('ARCLikeProvider')`）:
  - `expects to filter tasks to include only ARC-Like contests`（残る contest_id の集合をリテラルで比べる）
  - `expects to exclude ACL Contest 1 because the ACL provider shows it`
  - `expects to keep shared problems C and D in the ARC-Like row (tenka1-2017, caddi2018)`
  - `expects to filter out non-ARC-Like contests`（abc / arc / agc と `tenka1-2017-beginner`）
  - `expects to get correct metadata`
  - `expects to get correct display configuration`
  - `expects to format contest ID as round label`
  - `expects to handle empty task results`
- テスト（`contest_table_provider_groups.test.ts`）:
  - `describe.each` に `ARCLike` を足す（`$name creates group with correct metadata and provider`）
  - `places the ARC-Like button right after ABC-Like`
- RED → `ARCLikeProvider`・preset・`arcLike` キーを足す → GREEN
- コミット: `feat(contest-table): add ARC-Like table (#4259)`

### フェーズ 4: ガイドと最終確認

- `docs/guides/how-to-add-contest-table-provider.md` の複合ソース型の表に ARC-Like の行（4〜6 問、A〜F、21 コンテスト、ACL1 は ACL と同区分）を足し、最終更新日を直す
- `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit` / `git diff --check`
- `pnpm db:seed` のあと `pnpm dev` で、ARC-Like ボタンが ABC-Like の直後にあり、21 行・A〜F の表が出ることを目で確かめる
- コミット: `docs: add ARC-Like to the contest table provider guide (#4259)`

クロスレビューは不要（手で直すファイルは 10 前後、認証・スキーマ・公開インターフェースの変更なし）。

## 本番への反映（マージ後、ユーザーが行う）

1. デプロイ前に、本番の登録状況を確かめる

```sql
SELECT contest_id, COUNT(*) AS task_count
FROM task
WHERE contest_id IN (
  'keyence2021', 'tokiomarine2020', 'nomura2020', 'hitachi2020', 'keyence2020',
  'dwacon6th-prelims', 'ddcc2020-qual', 'nikkei2019-2-qual', 'jsc2019-qual', 'diverta2019-2',
  'm-solutions2019', 'diverta2019', 'tenka1-2019', 'exawizards2019', 'yahoo-procon2019-qual',
  'nikkei2019-qual', 'keyence2019', 'caddi2018', 'dwacon5th-prelims', 'tenka1-2018', 'tenka1-2017'
)
GROUP BY contest_id
ORDER BY contest_id;
```

2. デプロイ後、1 で行の無かったコンテスト（少なくとも tokiomarine2020 / nomura2020 / hitachi2020 / exawizards2019）を管理画面から取り込む。今回分類に足す 5 件（m-solutions2019 を含む）は、デプロイ前だと取り込みで飛ばされる
3. `contesttaskpair` に caddi2018 の 2 件を Supabase の CSV で入れる（`id`・`createdAt`・`updatedAt` を含める。手順は `docs/guides/how-to-add-contest-task-pairs.md`）。キャッシュ（TTL 1 時間）が切れるまで表示に出ないことがある
4. 本番で、ARC-Like の表に 21 行が出ること、caddi2018 の行が C〜F になること、acl1 が出ないことを確かめる
