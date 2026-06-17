# テーブル「ICPC 地区予選」追加 (issue #3680)

## 概要

コンテストテーブル一覧に「ICPC 地区予選」(ICPC Asia Regional) を追加する。
PR #3635 で追加済みの「ICPC 国内予選」(`AojIcpcPrelimProvider`, Pattern 4 = 年ごとに N インスタンス化) と
ほぼ同一の仕様（テーブル inner ラベル A,B,C…・タイトル文言・prefix）で、対象データだけが `ICPCRegional{year}` に変わる。

- ボタンラベル: `ICPC 地区予選`
- 順序: `ICPC 国内予選` の直後（画面上では右側）

## 設計の根拠（スコープ削減）

`classifyContest` / `contestTypePriorities` / `getContestNameLabel` は **既に `ICPCRegional*` を
`ContestType.AOJ_ICPC` として扱える**。

- [contest.ts:103](../../../../src/lib/utils/contest.ts) の正規表現 `^ICPC(Prelim|Regional)\d*$` が一致
- `ICPC_TRANSLATIONS` に `Regional: ' 地区予選 '` が存在（[contest.ts:735](../../../../src/lib/utils/contest.ts)）

よって **スキル `add-contest-table-provider` の Layer 1（schema）・Layer 2（ContestType 定数）・Layer 3（utils）は不要**。
ContestType は `AOJ_ICPC` を Prelim と共用する（provider key は `AOJ_ICPC::{year}` だが Prelim/Regional は
別グループ＝別 Map のため衝突しない）。

実作業は **Layer 4（provider）＋ Layer 5（グループ登録）＋ シードデータ取込** に集約される。

### 順序の担保

[TaskTable.svelte:197](../../../../src/features/tasks/components/contest-table/TaskTable.svelte) は
`{#each Object.entries(contestTableProviderGroups) ...}` でボタンを描画する。
登録オブジェクトの `aojIcpcPrelim` 直後に `aojIcpcRegional` を追加すれば挿入順で国内予選の右側になる。

## ユーザー決定事項

| 項目                | 決定                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| シードデータ        | `prisma/tasks.ts` に `ICPCRegional*` 行は未登録。行データはユーザーが提供 → 本作業で取り込む                                                                 |
| 実装方針            | 独立クラス `AojIcpcRegionalProvider` を作成しつつ、Prelim と意味的に重複するロジックは**共有関数/定数として切り出す**（Prelim 側もそれを使うようリファクタ） |
| columnWrapThreshold | Prelim と同じ `6`（地区予選は最大 12 問だが 6×2 行で折返し、レイアウト一貫性を優先）                                                                         |
| 年範囲              | 1998–2024（AOJ fixture 実績、連続 27 年）                                                                                                                    |

## 却下した代替案

- **共有抽象基底クラス `AojIcpcProviderBase` を導入**: より DRY だが、稼働中の Prelim クラスの継承構造に手を入れリスクが上がる。
  ユーザー方針「独立クラス＋関数切り出し」に従い不採用。
- **Regional 用に新規 `ContestType.AOJ_ICPC_REGIONAL` を追加**: schema/enum/utils の 3 層改修が発生する。
  既存の `AOJ_ICPC` が Regional を完全に扱えるため YAGNI として不採用。

## フェーズ（TDD・低リスク→高リスク順）

> コミットは「共有関数リファクタ＋Regional provider」「グループ登録」「シード取込」を分ける。

### Phase 1: 共有ロジックの関数/定数化（既存 Prelim のリファクタ）

差分が無いメソッドを切り出し、Prelim/Regional 双方から使う。挙動不変のリファクタ。

- `src/features/tasks/utils/contest-table/aoj_icpc_labels.ts`
  - `ICPC_PRELIM_LABEL_OVERRIDES` → **`ICPC_LABEL_OVERRIDES`** に改名
    （full contest_id をキーにするため Prelim/Regional を 1 map で共用可。現状は空 `{}` でデータ移行不要）
  - `buildAojIcpcLetterMap` / `formatAojIcpcTitle` はそのまま流用
  - 共有の表示系を追加（または新規 `aoj_icpc_shared.ts` に集約）
    - `sortAojIcpcHeaderIds(filtered: TaskResults): string[]`（数値昇順、現 `getHeaderIdsForTask` 本体）
    - `AOJ_ICPC_TITLE_STYLE`（`getMetadata().titleStyle` 共有定数）
    - `buildAojIcpcDisplayConfig(): ContestTableDisplayConfig`（`columnWrapThreshold: 6` 等、共有）
- `aoj_icpc_providers.ts` の `AojIcpcPrelimProvider` を上記共有関数/定数を呼ぶ薄いラッパへ修正
- 既存テストの参照名更新: `aoj_icpc_providers.test.ts` / `aoj_icpc_labels.test.ts` の
  `ICPC_PRELIM_LABEL_OVERRIDES` → `ICPC_LABEL_OVERRIDES`
- 検証: `pnpm test:unit src/features/tasks/utils/contest-table/` GREEN

### Phase 2: AojIcpcRegionalProvider（Layer 4・TDD）

- テスト先行: `aoj_icpc_providers.test.ts` に `describe('AojIcpcRegionalProvider')` を追加。
  代表年の inline fixture（例: 1998=8問, 2024=最多問, 年フィルタ用に別年1件＋非ICPC1件の mixed）。
  Prelim のテスト構成（filter / generateTable 冪等＆非破壊 / getMetadata / getDisplayConfig=6 /
  getContestRoundLabel / getHeaderIdsForTask / getTaskLabels A,B,C… / override map path）をミラー。**RED 確認**
- 実装: `aoj_icpc_providers.ts` に `AojIcpcRegionalProvider extends ContestTableProviderBase` を Prelim の隣に追加。差分のみ:
  - `contestId = `ICPCRegional${year}``
  - `getMetadata().title` / `getContestRoundLabel` = `ICPC 地区予選 ${year}`、`abbreviationName = `icpcRegional${year}``
  - `getTaskLabels` は `buildAojIcpcLetterMap(this.contestId, …)` を流用（共有 overrides map 経由）
  - `getHeaderIdsForTask` / `getDisplayConfig` / `titleStyle` は Phase 1 の共有関数/定数を使用
- 検証: `pnpm test:unit <providers.test.ts>` GREEN

### Phase 3: グループ登録（Layer 5・TDD）

- `contest_table_provider_groups.ts`
  - `ICPC_REGIONAL_OLDEST_YEAR = 1998` / `ICPC_REGIONAL_LATEST_YEAR = 2024` を export（テストが getSize 参照）
  - `AojIcpcPrelim` プリセットに倣い `AojIcpcRegional` プリセットを追加
    （latest→oldest で `addProvider`、buttonLabel/ariaLabel = `ICPC 地区予選` / `Filter ICPC Asia Regional`、
    groupName = `ICPC 地区予選`）
  - `contestTableProviderGroups` オブジェクトの **`aojIcpcPrelim` の直後**に
    `aojIcpcRegional: presets.AojIcpcRegional()` を追加（描画順＝右側）
- `contest_table_provider_groups.test.ts`: import 追加、`AojIcpcRegional` プリセットの
  groupName/metadata/getSize(=LATEST−OLDEST+1=27)/`getProvider(ContestType.AOJ_ICPC, '2024') instanceof AojIcpcRegionalProvider`
  を追加。`presets are functions` 一覧にも追加
- 検証: `pnpm test:unit src/features/tasks/utils/contest-table/` GREEN

### Phase 4: シードデータ取込

- ユーザー提供の `ICPCRegional{1998..2024}` タスク行を `prisma/tasks.ts` に追記
  （`ICPCPrelim*` 群の直後など。`id`/`contest_id`/`problem_index`/`name`/`title`/`grade` 形式に整合）
- 取込後 `pnpm db:seed` でローカル DB に反映
- 注: AOJ admin 取込フロー（`src/routes/(admin)/tasks/`）は `classifyContest` が既に
  `ICPCRegional*` を認識するため別途改修不要

## 主要変更ファイル

- `src/features/tasks/utils/contest-table/aoj_icpc_labels.ts`（共有関数化・overrides 改名）
- `src/features/tasks/utils/contest-table/aoj_icpc_providers.ts`（Regional provider 追加・Prelim 薄化）
- `src/features/tasks/utils/contest-table/aoj_icpc_providers.test.ts`（Regional テスト・参照名更新）
- `src/features/tasks/utils/contest-table/aoj_icpc_labels.test.ts`（参照名更新）
- `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts`（定数＋プリセット＋登録）
- `src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts`（グループテスト）
- `prisma/tasks.ts`（ICPCRegional シード行・ユーザー提供）

## 再利用する既存実装

- `buildAojIcpcLetterMap` / `formatAojIcpcTitle` — `aoj_icpc_labels.ts`
- `ContestTableProviderBase`（`generateTable` / `createProviderKey` / `getProviderKey`）— `contest_table_provider_base.ts`
- `classifyContest` / `getContestNameLabel` / `ICPC_TRANSLATIONS` — `src/lib/utils/contest.ts`（改修不要・既に Regional 対応）
- `ContestTableProviderGroup` — `contest_table_provider_group.ts`

## 検証

1. `pnpm test:unit src/features/tasks/utils/contest-table/`（Phase 1–3 各 RED→GREEN）
2. `pnpm test:unit`（全体回帰。Prelim リファクタの非破壊確認）
3. `pnpm check` / `pnpm lint`
4. シード取込後 `pnpm db:seed` → `pnpm dev` でタスクテーブル画面を開き、
   - 「ICPC 地区予選」ボタンが「ICPC 国内予選」の右に出る
   - 押下で年別テーブル（最新年が上）が表示され、各行に A,B,C… のラベルと正しいタイトルが並ぶ
   - 1998（8問）/ 2024（最多問）が空でなく描画される
5. 全フェーズ完了後、AGENTS.md 規約に従い `coderabbit review --plain` と `/session-close` を実施
