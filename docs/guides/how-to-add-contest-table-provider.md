# ContestTableProvider 実装・テストガイド

タスク一覧をコンテスト別テーブルとして描画するための `ContestTableProvider`（フィルタ条件 + メタデータ + レイアウト定義）を新規に追加するときのリファレンス。基底クラスは `ContestTableProviderBase`。TDD・コーディング規約は `AGENTS.md`、配置規約は `docs/guides/architecture.md` を参照。

---

## 事前確認

- [ ] `ContestType`（`src/lib/contests/types/contest.ts`）— 既存で対応できるか？複数 contest_id を統一表示するなら複合型
- [ ] `classifyContest()`（`src/lib/contests/utils/classification.ts`）— 新 contest_id に正しい ContestType を返すか。`prefixes.ts` の `ABC_LIKE` / `ARC_LIKE` / `ATCODER_JAG` / `ATCODER_MAIN_OFFICIAL_ONSITE` は完全一致、他グループは前方一致なので、続編（例: `diverta2019-2`）は完全一致グループでは個別にキーを追加する
- [ ] `prisma/tasks.ts` にデータが存在するか（複合型は `prisma/contest_task_pairs.ts` も）
- [ ] 実装パターン判定（後述4パターン）
- [ ] JOI: 2026 年より `joi{YYYY}ho` → `joi{YYYY}sf`。regex は `(ho|sf)` 対応済み

---

## 実装パターン

### パターン1: 範囲フィルタ型（ABC / ARC / AGC / AWC）

`contest_id` の数値部分で範囲フィルタ。ラウンド名・ヘッダー表示、問題 id 非表示。

**AWC** は config-driven な `AWCRangeProvider` を使い、`minRound`/`maxRound` 等を config で渡してインスタンス化する（具象クラスの追加不要）。

```typescript
// AWC: config-driven（新規追加時はインスタンス化のみ）
new AWCRangeProvider(ContestType.AWC, {
  section: '0001To0099',
  minRound: 1,
  maxRound: 99,
  title: 'AtCoder Weekday Contest 0001 〜 0099',
  abbreviationName: 'awc0001To0099',
});

// ABC 等: 具象クラスで実装（従来パターン）
protected setFilterCondition(): (taskResult: TaskResult) => boolean {
  return (taskResult: TaskResult) => {
    if (classifyContest(taskResult.contest_id) !== this.contestType) return false;
    const contestRound = parseContestRound(taskResult.contest_id, 'abc');
    return contestRound >= 1 && contestRound <= 41;
  };
}
```

### パターン2: 単一ソース型（EDPC / TDPC / AWC0100 / AWC0150）

単一 `contest_id` のみフィルタ。問題 id 表示、ラウンド名・ヘッダー非表示。

**AWC 特殊回** は config-driven な `AWCSpecialContestProvider` を使い、`contestId` 等を config で渡してインスタンス化する（具象クラスの追加不要）。

```typescript
// AWC 特殊回: config-driven（新規追加時はインスタンス化のみ）
new AWCSpecialContestProvider(ContestType.AWC, {
  section: '0100',
  contestId: 'awc0100',
  title: 'AtCoder Weekday Contest 0100',
  abbreviationName: 'awc0100',
});

// EDPC 等: 具象クラスで実装（従来パターン）
protected setFilterCondition(): (taskResult: TaskResult) => boolean {
  return (taskResult: TaskResult) => {
    if (classifyContest(taskResult.contest_id) !== this.contestType) return false;
    return taskResult.contest_id === 'dp'; // ← contest_id だけ変更
  };
}
```

### パターン3: 複合ソース型（ABS / TESSOKU_BOOK / MATH_AND_ALGORITHM）

複数の異なる contest/task_id を1つのテーブルに表示。`classifyContest()` のみでフィルタ。セクション分割が必要な場合は `task_table_index` の先頭文字でサブフィルタ（Tessoku Book 参照）。

`getMergedTasksMap()` が複数コンテスト由来の task_id を自動統合。テストデータは [prisma/contest_task_pairs.ts](../../prisma/contest_task_pairs.ts) 参照。ペアの追加手順と本番環境への投入は [how-to-add-contest-task-pairs.md](./how-to-add-contest-task-pairs.md) を参照。

### パターン4: コンストラクタパラメータ型（ICPC / JAG / JOI / PAST）

年度などのパラメータを受け取る1クラスを N 回インスタンス化。

- `super(contestType, String(year))` で provider key を一意化（例: `AOJ_ICPC::2025`）
- 年度範囲定数（`OLDEST_YEAR` / `LATEST_YEAR`）を `export` してテストでも参照
- グループ登録は最新年→古い年の降順（`addProvider` 順 = 表示順、先 = 上）

AOJ/JAG 固有の詳細（`titleStyle`、同一年2回開催の `suffix` 分割など）は `aoj_icpc_providers.ts` / `aoj_jag_providers.ts` を参照。

**変形: 明示的な配列で並べる（JAG 夏合宿・模擬地区など）** — 並びを contest_id から導けないとき（例: 模擬地区 2014 は夏合宿 2014 の Day2 と Day4 の間）は、コンテストごとのエントリの配列（`aoj_jag_regional_entries.ts`）を持ち、1 エントリ = 1 Provider でインスタンス化する。provider key の section は contest_id（例: `AOJ_JAG::JAGSummer2024-day2`）。新しい回は seed（`prisma/tasks.ts`）と配列の両方に足す。配列の書き漏れは seed との整合テスト（`aoj_jag_regional_entries.test.ts`）で落ちる。

#### 注意: 「JAG 夏合宿・模擬地区など」は AOJ と AtCoder が混在する

配列には AOJ のコンテスト（`AOJ_JAG`）と AtCoder 上の 4 コンテスト（`ATCODER_JAG`）が並ぶ。新しい回を足すときは次を確かめる。

- **分類**: AOJ は `regexForJag` に一致する contest_id、AtCoder は `prefixes.ts` の `ATCODER_JAG` の完全一致で決まる。AOJ の contest_id がこの regex に合わないと、ラベルが崩れ、リンクも AtCoder に飛ぶ。AtCoder 側を前方一致にしない（AtCoder Problems の `JAG2013Spring` / `JAG2014Spring` は AOJ の `JAGSpring2013` / `2014` と同じコンテストで、問題が二重になる）
- **contestType**: Provider には `classifyContest` の結果を渡す（例: `ATCODER_JAG::jag2018summer-day2`）。効くのは provider key だけで、表示は変わらない
- **title**: AtCoder は `A. ` 付き、AOJ は素。セル（`buildTitleWithTaskIndex`）がどちらにも記号を付け直すので、Provider で title を加工しない
- **データ**: AOJ の合宿系は管理画面から取り込めないので、seed と Supabase の CSV で記号付きで入れる。AtCoder 側は管理画面から取り込む
- **記号**: AOJ は問題 ID の昇順で A, B, C… と振るが、問題が AOJ に無いコンテストではずれる。新しい回はメンテナのスプレッドシートと照合する
- **AOJ に無い問題**: `NoJudge-{contest_id}_{小文字の記号}` の task_id でダミーを足し、`no_judge.ts` にリンク先（jag-icpc.org のページ）を登録し、コンテストを `LETTERS_OF_SHIFTED_CONTESTS` に入れる。出典欄は `（No Judge）` になる

### 補足: 固定セクションによる同一 ContestType 内の共存

同一 `ContestType` で異なるプロバイダを共存させる場合、config の `section` フィールドで provider key を一意化する（例: `AWC::0100`）。AWC は `AWCRangeProvider`（通常回）と `AWCSpecialContestProvider`（特殊回）の2クラスを config で使い分けており、すべて同じ `ContestType.AWC` グループに登録される。新しい AWC 回の追加は `contest_table_provider_groups.ts` で `new AWCRangeProvider(...)` または `new AWCSpecialContestProvider(...)` をインスタンス化するだけでよい。

---

## コンテスト種別リファレンス

### 範囲フィルタ型

| コンテスト    | 範囲       | セクション | 備考          |
| ------------- | ---------- | ---------- | ------------- |
| ABC 001-041   | 001～041   | A～D       | 旧形式        |
| ABC 042-125   | 042～125   | A～D       | 共有問題(ARC) |
| ABC 126-211   | 126～211   | A～F       | 6問制         |
| ABC 212-318   | 212～318   | A～Ex/H    | 8問制         |
| ABC 319-      | 319～      | A～G       | 標準形式      |
| ARC 001-057   | 001～057   | A～D       | 旧形式        |
| ARC 058-103   | 058～103   | C～F       | 共有問題(ABC) |
| ARC 104-      | 104～      | 4～6問     | -             |
| AGC 001-      | 001～      | 4～7問     | -             |
| AWC 0001-0099 | 0001～0099 | A～E       | -             |
| AWC 0101-0149 | 0101～0149 | A～E       | -             |
| AWC 0151-     | 0151～     | A～E       | -             |

### 単一ソース型

| コンテスト                  | contest_id              | 問題数 | フォーマット |
| --------------------------- | ----------------------- | ------ | ------------ |
| EDPC                        | `'dp'`                  | 26問   | A～Z         |
| TDPC                        | `'tdpc'`                | 26問   | A～Z         |
| NDPC                        | `'ndpc'`                | 20問   | A～T         |
| FPS_24                      | `'fps-24'`              | 24問   | A～X         |
| GAME_24‡                    | `'game-24'`             | 24問   | A～X         |
| AALC                        | `'aalc001'`             | 24問   | A～X         |
| ACL_PRACTICE                | `'practice2'`           | 12問   | A～L         |
| ACL_BEGINNER / ACL_CONTEST1 | `'abl'`/`'acl1'`        | 6問    | A～F         |
| AWC0100 / AWC0150†          | `'awc0100'`/`'awc0150'` | 15問   | A～O         |

†注: ContestType.AWC を再利用し、section（`'0100'`, `'0150'`, `'0151Onwards'`）で provider key を一意化。ACL 系は `Acl` グループ、DP 系と x 24 題系（FPS_24 / GAME_24 / AALC）は `dps` グループで統一管理。

‡注: task_id は `game_a`〜`game_x` で、contest_id の数字を含まない（`fps-24` は `fps_24_a`）。

### コンストラクタパラメータ型 / regex フィルタ型

| コンテスト               | フィルタ方式    | 備考                                                                            |
| ------------------------ | --------------- | ------------------------------------------------------------------------------- |
| ICPC 国内予選            | 年度パラメータ  | `AojIcpcPrelimProvider(type, year)`                                             |
| ICPC アジア地区          | 年度パラメータ  | `AojIcpcRegionalProvider(type, year)`                                           |
| JAG 模擬国内             | 年度パラメータ  | 同一年2回開催は suffix 分割                                                     |
| JAG 夏合宿・模擬地区など | 明示的な配列    | 合宿系・模擬地区・AtCoder 上の JAG の 76 件。`JagRegionalProvider(type, entry)` |
| JOI 一次予選             | regex           | `joi{YYYY}yo1{a\|b\|c}`                                                         |
| JOI 二次予選             | regex + section | 2020 以降 / 2006-2019 で Provider 分離                                          |
| JOI 本選                 | regex           | 2026 年より `ho` → `sf` サフィックス                                            |
| PAST                     | 回数パラメータ  | `PastProvider(type, round)`。回数 → contest_id は `getPastContestId`            |

### 複合ソース型

| コンテスト         | 問題数 | セクション   | 備考                              |
| ------------------ | ------ | ------------ | --------------------------------- |
| ABS                | 11問   | A～K         | 11個の contest_id                 |
| ABC-Like           | 2～8問 | A～H         | 14コンテスト、ABL は ACL と同区分 |
| TESSOKU_BOOK       | 166問  | A(01-77)/B/C | セクション分割あり                |
| MATH_AND_ALGORITHM | 104問  | 001～104     | -                                 |

---

## よくあるミス

1. **ABC042-125 の共有問題** — `task_id` が `arc58_a` なのに `contest_id` は `abc042` のケースがある。テストに混合パターンを含めること
2. **数値ソートと辞書順の混在** — `indices.sort()` のデフォルト（辞書順）に頼らない。数字は `parseInt` 比較
3. **contestTypePriorities の JSDoc カテゴリ名** — 4カテゴリ名（`Educational` / `Contests for genius` / `Special contests` / `External platforms`）は変更不可。括弧内の数値範囲のみ変更可
4. **addProvider の順序** — 呼び出し順 = 表示順（先 = 上）。新しい回が上に来るように
5. **分類 regex の拡張** — 新形状の contest_id を追加するとき、regex を広げると `getContestNameLabel`・`AojGenerator.canHandle` にも波及する
6. **データの無い Provider** — `TaskTable.svelte` は、データの無い Provider でも見出しと空の枠を描画する（`prepareContestTable` が `null` を返して消えるのは行だけ）。データを入れる前に Provider を出すと、空の枠が並ぶ

---

## 実装完了後

このガイドのリファレンステーブルに新 Provider の行を追加し、最終更新日を更新すること

---

## 参考資料

- [Provider 実装・テスト・フィクスチャ](../../src/features/tasks/utils/contest-table/)
- 各 Provider の実装経緯: `git log --oneline --all --grep='#NNNN'`（issue 番号で検索）

---

**最終更新**: 2026-10-31
