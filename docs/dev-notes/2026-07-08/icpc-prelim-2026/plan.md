# ICPC 国内予選 2026 データ追加・表示

## Context

ICPC 国内予選（ICPC Domestic Preliminary）は PR #3635 で **Pattern 4（コンストラクタパラメータ型）** として実装済み。`AojIcpcPrelimProvider` を年度ごとに 1 回インスタンス化し、1998–2025 の 28 年分を降順（新しい年が上）でテーブル表示している。

今回は **2026 年分（10 問、A–J）を追加して表示** できるようにする。コアロジック（Provider クラス・ラベル生成・分類・優先度・ContestType enum）は年度非依存に作られているため、変更は最小限。

受領済みデータ（`ICPCPrelim2026`、id/problem_index 1690–1699、連番のため judge gap なし → `ICPC_LABEL_OVERRIDES` 登録不要）:

| id / problem_index | title (= name) | 表示ラベル |
| --- | --- | --- |
| 1690 | Find the Strongest Card | A |
| 1691 | Vending Machines | B |
| 1692 | Water Remaining | C |
| 1693 | Frequency Sequence | D |
| 1694 | Shopping Master | E |
| 1695 | Optimizing a Map Application | F |
| 1696 | Avoid Collision | G |
| 1697 | Sorting Swim Rings | H |
| 1698 | Speed Limit | I |
| 1699 | Maximum Scaling | J |

## 変更しないもの（確認済み）

- `aoj_icpc_providers.ts` / `aoj_icpc_labels.ts` — 年度非依存。ラベルは numeric sort → A,B,C… を自動付与
- `src/lib/types/contest.ts` の `AOJ_ICPC` enum、`classifyContest`（regex `/^ICPC(Prelim|Regional)\d*$/` が `\d*` で任意年にマッチ）、`contestTypePriorities`（`[AOJ_ICPC, 23]` 単一）
- `contest_name_labels.ts` の name-label テスト（全年を列挙していない）

## 変更内容

### 1. データ投入 — `prisma/tasks.ts`

`ICPCPrelim2025` の最終行（id 1689、L10155）と `ICPCRegional1998` ブロック（id 1200、L10156）の**間**に、受領した 10 行（`ICPCPrelim2026`、id 1690–1699）を挿入する。既存行と同一の shape（`id` / `contest_id` / `problem_index` / `name` / `title`）。

### 2. 最新年定数の更新 — `src/features/tasks/utils/contest-table/contest_table_provider_groups.ts`

- L39: `export const ICPC_PRELIM_LATEST_YEAR = 2025;` → `2026`
  - L238–249 の降順ループが自動的に `AojIcpcPrelimProvider(AOJ_ICPC, 2026)` を最上段に登録する（他の変更不要）

### 3. Provider テスト — `src/features/tasks/utils/contest-table/aoj_icpc_providers.test.ts`（TDD、先に RED を確認）

- `tasks2025` fixture（L87–127）に倣い `tasks2026` fixture を追加（10 問、id 1690–1699、A–J）
- `describe('year boundary behavior')`（L323–370）の **latest 側を 2025 → 2026 に付け替え**:
  - `provider2025` → `provider2026 = createProvider(2026)`
  - metadata: `title` → `'ICPC 国内予選 2026'`、`abbreviationName` → `'icpcPrelim2026'`
  - raw title: 先頭 `table['ICPCPrelim2026']['1690'].title === 'Find the Strongest Card'`、末尾 `['1699'] === 'Maximum Scaling'`
  - filter isolation: 長さ `10`、全件 `contest_id === 'ICPCPrelim2026'`
  - describe 見出し/テスト名の「2025 / 9 problems, A–I」→「2026 / 10 problems, A–J」

### 4. Group テストのコメント修正 — `contest_table_provider_groups.test.ts`

- L311: `getSize()` アサーションは定数から算出されるため**自動追従**（コード変更不要）。ステイルな `// 28` コメントを `// 29` に更新（1998→2026 = 29 年分）

### （任意・スキップ可）ドキュメント

`docs/guides/how-to-add-contest-table-provider.md` L211 の例示コード `ICPC_PRELIM_LATEST_YEAR = 2025` は説明用のため必須ではない。整合させたい場合のみ 2026 に更新。

## Verification

```bash
# 該当テスト（付け替え後 GREEN を確認）
pnpm test:unit src/features/tasks/utils/contest-table/aoj_icpc_providers.test.ts
pnpm test:unit src/features/tasks/utils/contest-table/contest_table_provider_groups.test.ts
pnpm test:unit src/features/tasks/utils/contest-table/   # ラベル含む一式

# 全体
pnpm test:unit
pnpm check
pnpm lint
pnpm format   # commit 前
```

エンドツーエンド目視確認（任意）:

```bash
pnpm db:seed          # ICPCPrelim2026 を DB に反映
pnpm dev              # ICPC 国内予選グループで 2026 が最上段・A–J 表示を確認
```

## コミット方針

小規模な年度追加のため、データ投入＋登録＋テストを 1 論理コミットにまとめる（`staging` から作業ブランチを切る）。
