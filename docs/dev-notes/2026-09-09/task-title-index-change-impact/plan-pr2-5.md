# PR2.5 — 合宿系と JAG 模擬地区をコンテスト表に出す

前提と共通の決定は [plan.md](./plan.md)。並び順の一覧は [investigation.md](./investigation.md#表示順76-コンテスト)。

**状態**: 未着手。PR2 の後に出す（先に出すと、問題 ID の index と `'2389. …'` の title が表に出る）。PR2.1 とは前後してよい。

## 何を作るか

- 1 つのグループ（グループ名・ボタン名とも「JAG 模擬地区」）に、合宿系 50・模擬地区 16・PR2.1 の 10 の計 76 コンテストを、コンテストごとのテーブルとして並べる（M15）
- 並びはスプレッドシートの行順（新しいものが上）。contest_id からは導けないので、明示的な配列で持つ。例: 2014 は 夏合宿 Day2 → 模擬地区（夏合宿の Day3 として開催）→ 夏合宿 Day4。冬合宿 2010 は 夏合宿 2011 の後
- テーブル名は `getContestNameLabel(contestId)` に括弧書きを付ける（M16）

| 例                                             | 括弧書き                                   |
| ---------------------------------------------- | ------------------------------------------ |
| `JAG 夏合宿 2024 Day2（有志）`                 | `有志`                                     |
| `JAG 春合宿 2015（JAG）`                       | `JAG`                                      |
| `JAG 模擬地区 2016（in JAG 夏合宿 2016 Day3）` | `in JAG 夏合宿 2016 Day3`（2014 も同じ形） |
| `JAG 夏合宿 2015 Day3`                         | なし（in AtCoder・過去問）                 |

- 出典欄は変えない。この配列は #4018 でコンテスト情報を DB に移すときの移行元になる
- 配列には PR2.1 の 10 件も入れる。データが無い間は表示されないので、PR2.1 より先に出してよい（contest_id は PR2.1 の Q3 / Q4 で確定させる）
- Provider の `contestType` は全件 `AOJ_JAG` にする。provider key の名前空間として使うだけで、`getTaskTableHeaderName` での違いは ABC の H/Ex だけなので、in AtCoder の 4 件も同じでよい。`ATCODER_JAG` に依存しないので、PR2.1 と順序を問わない

関係する決定: M15 / M16（[plan.md](./plan.md#決定事項)）。

## タスク

| #     | 内容                                                                                      |
| ----- | ----------------------------------------------------------------------------------------- |
| 2.5-1 | 並び順と括弧書きの配列（76 件）                                                           |
| 2.5-2 | Provider クラス（1 コンテスト = 1 テーブル）                                              |
| 2.5-3 | グループ「JAG 模擬地区」を、`contestTableProviderGroups` の `aojJagPrelim` の後に登録する |
| 2.5-4 | テスト（Provider とグループ）                                                             |

`add-contest-table-provider` skill の Layer 4–5 に当たる（Pattern 4 の変形: コンストラクタの引数がコンテスト 1 つ分）。DB を変えず共有インターフェイスも変えないので、クロスレビューの条件には当たらない。

## 契約

```typescript
// src/features/tasks/utils/contest-table/jag_contest_table_entries.ts
export type JagContestTableEntry = {
  contestId: string;
  // Bracketed note after the contest name: 'JAG', '有志' or 'in JAG 夏合宿 2016 Day3'.
  note?: string;
};

export type JagContestTableEntries = JagContestTableEntry[];

// Newest first, following the maintainer's spreadsheet; contest ids cannot give this order.
export const JAG_CONTEST_TABLE_ENTRIES: Readonly<JagContestTableEntries>;

// src/features/tasks/utils/contest-table/aoj_jag_providers.ts
export class JagContestProvider extends ContestTableProviderBase {
  // section = contestId, so the provider key is e.g. AOJ_JAG::JAGSummer2024-day2.
  constructor(contestType: ContestType, entry: JagContestTableEntry);
  // filter: contest_id === entry.contestId
  // getHeaderIdsForTask: sortAojHeaderIds / getDisplayConfig: buildAojDisplayConfig
  // getMetadata(): { title: name + （note）, abbreviationName: contestId, titleStyle: AOJ_TITLE_STYLE }
}
```

## テスト

- グループの `getSize()` が 76、先頭と末尾のコンテスト
- 2014 の 3 件（夏合宿 Day2 → 模擬地区 → 夏合宿 Day4）の並び
- テーブル名の括弧書き 3 種（`JAG` / `in …` / なし）

## 却下した方針

| 案                                                                                       | 却下理由                                                                                    |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 合宿系と模擬地区を 2 グループに分ける                                                    | 同じ年の中の前後関係（例: 模擬地区 2014 は夏合宿 2014 の Day3 として開催）を表せない        |
| 既存の「JAG 模擬国内」グループに統合する                                                 | 模擬国内は年のループで完成している。統合すると、それも明示的な配列に置き換えることになる    |
| テーブル名をスプレッドシートの名称（春コンテスト / 冬コンテスト / 模擬アジア地区）にする | 出典欄（`JAG_TRANSLATIONS`）と名称が食い違う（[名称の違い](./investigation.md#名称の違い)） |
| 出典欄も PR2.5 でそろえる                                                                | ラベルを使う他の画面（検索・投票・タグなど）と fixture に波及する。#4018 でまとめて行う     |
