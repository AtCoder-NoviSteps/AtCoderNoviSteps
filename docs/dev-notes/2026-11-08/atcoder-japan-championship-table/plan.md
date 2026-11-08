# AtCoder 日本大会のコンテスト別テーブル（#4315）

## 概要

「旧 ARC」と「競プロ典型 90 問」の間に「AtCoder 日本大会」ボタンを足し、次の 10 コンテストをコンテストごとのテーブル（ICPC 国内予選と同じレイアウト）で上から順に並べる。

| #   | contest_id         | 見出し                                               | ContestType（現在 → 変更後）           | seed           |
| --- | ------------------ | ---------------------------------------------------- | -------------------------------------- | -------------- |
| 1   | arc232             | 第三回 AtCoder Japan Open -予選-（ARC 232）          | ARC（変更なし）                        | 無し → 5 問    |
| 2   | ajo2025-final-open | 第二回 AtCoder Japan Open -決勝-                     | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE  | 無し → 5 問    |
| 3   | arc207             | 第二回 AtCoder Japan Open -予選-（ARC 207）          | ARC（変更なし）                        | 無し → 5 問    |
| 4   | ajo2024-final      | 第一回 AtCoder Japan Open -決勝-                     | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE  | 無し → 6 問    |
| 5   | arc186             | AtCoder Japan Open -予選-（ARC 186）                 | ARC（変更なし）                        | 無し → 5 問    |
| 6   | nikkei2019-2-final | 第二回全国統一プログラミング王決定戦本戦             | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE  | 無し → 8 問    |
| 7   | nikkei2019-2-qual  | 第二回全国統一プログラミング王決定戦予選（ARC-like） | ARC_LIKE（変更なし）                   | 6 問（一致）   |
| 8   | nikkei2019-ex      | 全国統一プログラミング王決定戦 エキシビジョン        | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE  | 無し → 8 問    |
| 9   | nikkei2019-final   | 全国統一プログラミング王決定戦本戦                   | OTHERS → ATCODER_MAIN_OFFICIAL_ONSITE  | 無し → 8 問    |
| 10  | nikkei2019-qual    | 全国統一プログラミング王決定戦予選（ARC-like）       | ARC_LIKE（変更なし）                   | 6 問（一致）   |

- 問題データはメンテナが貼った AtCoder Problems の行を [tasks.json](./tasks.json) に保存した（62 行、ID 重複なし、`title` = `{problem_index}. {name}`、seed にある 12 行と一致）。seed に足すのは 50 行。
- nikkei2019-ex では task_id の末尾と記号が食い違う（`nikkei2019ex_e` が F のコラッツ問題、`nikkei2019ex_f` が E のスーパーFizzBuzz）。AtCoder 側の問題 URL と記号の対応がそうなっているためで（AtCoder Problems の title も `F. コラッツ問題`）、スプレッドシートの記号・問題名とは一致する。そのまま使う。リンクは task_id から作るので正しい問題に飛び、テーブルは `task_table_index` 順なので E → F と並ぶ。`-ex` はエキシビジョンの略で、ABC 212〜318 の記号「Ex」とは関係ない。
- 8 問のコンテスト（nikkei2019-final / nikkei2019-2-final / nikkei2019-ex）の 8 問目の記号は「H」（「Ex」ではない）なので、列は A〜H と並ぶ。
- 未分類の 4 件（決勝 2 件、nikkei2019-2-final、nikkei2019-ex）は、管理画面の取り込みで `classifyContest` が `null` を返して skip されるため（`src/lib/services/tasks.ts:178`）、本番にも無いはず。デプロイ後に管理画面から取り込む。

## 設計判断

- **明示的な配列 + 専用 Provider**（「JAG 夏合宿・模擬地区など」と同じ形）。予選（ARC）と決勝が交互に並び、contest_id から並び順を導けない。
- **エントリは `{ contestId, contestType, title }`**。見出しは `getContestNameLabel` から作れない（arc232 は `ARC 232`、ARC_LIKE にはラベル生成が無く大文字の ID になる）ので、スプレッドシートの見出しを `title` にそのまま書く。`contestType` は provider key（`ARC::arc232`）にだけ効く。
- **ContestType は追加しない**。schema の enum、`contestTypePriorities` のずれ、`task.test.ts` の優先度差は変わらない（スキルの Layer 1–2 を skip）。
- **分類**: `ATCODER_MAIN_OFFICIAL_ONSITE`（完全一致）に 5 件を足し、`ATCODER_OTHERS`（前方一致）から `nikkei2019-final` を消す。onsite の規則は OTHERS より前に評価されるので消さなくても分類は変わるが、使われない OTHERS ラベルを残さない。
- **既存行の再分類は Prisma のデータ migration で行う**（`update_aoj_task_table_index` と同じ方式）。DB の `contest_type` はいまアプリから読まれていないので表示は壊れないが、分類と DB の値がずれたままにしない。新しい enum 値ではないので、旧版へロールバックしても旧 Prisma Client が読める（ATCODER_JAG のときのような復旧手順は要らない）。
- **重複表示**: arc186 / 207 / 232 は「ARC 104 〜」、nikkei の 2 予選は「ARC-Like」にも残す（メンテナ確認済み）。

## 却下した案

- **JagRegionalProvider を汎用化して共用**: JAG 側の 76 件の配列とテストにも手が入る。レイアウトは `per_contest_table_layout.ts` を共用するので、重複は 30 行ほどの配線だけで、ICPC 国内予選とアジア地区の関係と同じ程度（メンテナ確認済み）。
- **見出しを `getContestNameLabel` + 注記で作る**（JAG 方式）: ARC と ARC_LIKE では使えない。
- **preset で `classifyContest` から contestType を決める**（JAG 方式）: 戻り値が `null` を含み、3 種類の分岐になる。エントリに書けば `null` の処理が要らない。
- **本番の Supabase で手動 SQL を流す**: 環境ごとの適用漏れが起きうる。migration ならデプロイで全環境に入る。
- **ARC-Like から nikkei の 2 予選を外す**（acl1 と同じ扱い）: メンテナが両方への表示を選んだ。
- **命名**: コード上の名前は「AtCoder 日本大会」を `AtCoderJapanChampionship` と訳した（公式に王者を決める主要大会の意味が残る）。`JapanOpen` は実在の大会名と重なり nikkei を含まないように読める。`Onsite` は予選（ARC など）がオンライン開催なので中身より狭い。`Tournament` / `Cup` は公式・主要の意味合いが弱い。`Meet` は競プロではほぼ使われない。

## 主要な型と関数

```typescript
// src/features/tasks/utils/contest-table/atcoder_japan_championship_entries.ts
export type AtCoderJapanChampionshipEntry = {
  contestId: string;
  // Only used for the provider key, e.g. ARC::arc232.
  contestType: ContestType;
  title: string;
};
export type AtCoderJapanChampionshipEntries = AtCoderJapanChampionshipEntry[];
export const ATCODER_JAPAN_CHAMPIONSHIP_ENTRIES: Readonly<AtCoderJapanChampionshipEntries>; // spreadsheet order, 10 entries

// src/features/tasks/utils/contest-table/atcoder_japan_championship_provider.ts
export class AtCoderJapanChampionshipProvider extends ContestTableProviderBase {
  constructor(entry: AtCoderJapanChampionshipEntry); // super(entry.contestType, entry.contestId)
  protected setFilterCondition(): (taskResult: TaskResult) => boolean; // contest_id === entry.contestId
  override getHeaderIdsForTask(filtered: TaskResults): string[]; // sortHeaderIdsByTaskTableIndex
  getMetadata(): ContestTableMetaData; // { title, abbreviationName: contestId, titleStyle: PER_CONTEST_TITLE_STYLE }
  getDisplayConfig(): ContestTableDisplayConfig; // buildPerContestDisplayConfig()
  getContestRoundLabel(_contestId: string): string; // title
}

// src/features/tasks/utils/contest-table/contest_table_provider_groups.ts
AtCoderJapanChampionship: () => ContestTableProviderGroup; // 'AtCoder 日本大会' / ariaLabel 'Filter AtCoder Japan Championship'
contestTableProviderGroups.atcoderJapanChampionship; // between fromArc001ToArc057 and typical90
```

コンポーネントの props / events は変えない。

## フェーズ（低リスク → 高リスク）

### Phase 1: 分類とラベル（`src/lib/contests/`）

- テスト先行: `fixtures/contest_type.ts` の `nikkei2019-final` を `atCoderOthers` から `atCoderMainOfficialOnsite` へ移し、残り 4 件を足す。`fixtures/contest_name_labels.ts` の `atCoderMainOfficialOnsite` に 5 件を足す。既存の describe（`when contest_id means AtCoder official onsite finals ...`）がそのまま拾う。
- 実装: `utils/prefixes.ts` の 2 つの辞書を編集する。
- `pnpm test:unit src/lib/contests/` で RED → GREEN を確かめてコミットする。

### Phase 2: seed（`prisma/tasks.ts`）

- tasks.json からスクリプトで 50 行を生成し、ARC ブロック（arc232 は arc209 の前、arc207 は arc208 と arc188 の間、arc186 は arc188 と arc120 の間）とオンサイト決勝ブロック（awtf / codequeen / wtf の並び）に年の降順で入れる。問題は記号（`problem_index`）の F → A の降順で並べ、ID 順にしない（nikkei2019-ex は H, G, F（`_e`）, E（`_f`）, D, …）。
- `grep -c` で件数を確かめ、tasks.json を消してコミットする。

### Phase 3: エントリと Provider（Layer 4）

- テスト先行:
  - `atcoder_japan_championship_entries.test.ts`: `lists every ajo and nikkei2019 contest in the seed exactly once` / `has tasks in the seed for every entry`（ARC の ID の書き誤りを拾う）
  - `atcoder_japan_championship_provider.test.ts`: `filters only the tasks of its own contest`（arc232 / arc207 / nikkei2019-qual を混ぜる）、`sorts header ids by task_table_index`（nikkei2019ex の E/F 入れ替わりを含む）、`returns the entry title as metadata and round label`、`uses the per-contest display config`、`builds the provider key from the entry contest type`
- 実装 → GREEN。

### Phase 4: グループ登録（Layer 5）

- テスト先行（`contest_table_provider_groups.test.ts` の `explicit-order presets` と `contestTableProviderGroups`）: `AtCoderJapanChampionship registers one provider per contest in the spreadsheet order`（10 個の provider key をリテラルで列挙）、`places the AtCoder 日本大会 button right after 旧 ARC and before 競プロ典型 90 問`
- 実装 → `pnpm test:unit src/features/tasks/utils/contest-table/` で GREEN。Phase 3 と合わせてコミットする。

### Phase 5: データ migration（最もリスクが高い）

- `pnpm exec prisma migrate dev --create-only --name reclassify_nikkei2019_final_as_onsite` で空の migration を作り、次の SQL を書く。

```sql
-- nikkei2019-final moves from OTHERS to ATCODER_MAIN_OFFICIAL_ONSITE (#4315).
UPDATE "task"
SET "contest_type" = 'ATCODER_MAIN_OFFICIAL_ONSITE'
WHERE "contest_id" = 'nikkei2019-final'
  AND "contest_type" = 'OTHERS';
```

- ローカルでは seed 後に該当 8 行を `OTHERS` に戻して本番を再現し、`migrate dev` を流して 8 行が変わることを確かめる。

### Phase 6: ドキュメント

- `docs/guides/how-to-add-contest-table-provider.md` の「コンストラクタパラメータ型」表に行を足し、最終更新日を変える。

## 検証とレビュー

- `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit` / `git diff --check`
- migration（データ変換）を含むので、Codex のクロスレビューが要る。

## 本番で行うこと（メンテナ）

1. デプロイ前に Supabase で対象行を確かめる（どれを取り込むかが分かる）。

```sql
SELECT "contest_id", "contest_type", count(*) FROM "task"
WHERE "contest_id" IN ('arc232', 'ajo2025-final-open', 'arc207', 'ajo2024-final', 'arc186',
  'nikkei2019-2-final', 'nikkei2019-2-qual', 'nikkei2019-ex', 'nikkei2019-final', 'nikkei2019-qual')
GROUP BY "contest_id", "contest_type"
ORDER BY "contest_id";
```

2. デプロイで migration が流れる。
3. 管理画面から ajo2025-final-open / ajo2024-final / nikkei2019-2-final / nikkei2019-ex（と、手順 1 で欠けていたもの）を取り込む。データの無い Provider は空の枠を描くので、デプロイの直後に取り込む。
