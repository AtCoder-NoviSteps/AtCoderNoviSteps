# ContestTableProvider 実装・テストガイド

タスク一覧をコンテスト別テーブルとして描画するための `ContestTableProvider`（フィルタ条件 + メタデータ + レイアウト定義）を新規に追加するときのリファレンス。基底クラスは `ContestTableProviderBase`。TDD フロー・テスト規約は AGENTS.md、コーディングスタイルは `.claude/rules/` を参照。

---

## 事前確認

- [ ] `ContestType`（`src/lib/types/contest.ts`）— 既存で対応できるか？複数 contest_id を統一表示するなら複合型
- [ ] `classifyContest()`（`src/lib/utils/contest.ts`）— 新 contest_id に正しい ContestType を返すか
- [ ] `prisma/tasks.ts` にデータが存在するか（複合型は `prisma/contest_task_pairs.ts` も）
- [ ] 実装パターン判定（後述4パターン）
- [ ] JOI: 2026 年より `joi{YYYY}ho` → `joi{YYYY}sf`。regex は `(ho|sf)` 対応済み

---

## 実装パターン

### パターン1: 範囲フィルタ型（ABC / ARC / AGC / AWC）

`contest_id` の数値部分で範囲フィルタ。ラウンド名・ヘッダー表示、問題 id 非表示。

```typescript
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

```typescript
protected setFilterCondition(): (taskResult: TaskResult) => boolean {
  return (taskResult: TaskResult) => {
    if (classifyContest(taskResult.contest_id) !== this.contestType) return false;
    return taskResult.contest_id === 'dp'; // ← contest_id だけ変更
  };
}
```

### パターン3: 複合ソース型（ABS / TESSOKU_BOOK / MATH_AND_ALGORITHM）

複数の異なる contest/task_id を1つのテーブルに表示。`classifyContest()` のみでフィルタ。セクション分割が必要な場合は `task_table_index` の先頭文字でサブフィルタ（Tessoku Book 参照）。

`getMergedTasksMap()` が複数コンテスト由来の task_id を自動統合。テストデータは [prisma/contest_task_pairs.ts](../../prisma/contest_task_pairs.ts) 参照。

### パターン4: コンストラクタパラメータ型（ICPC / JAG / JOI）

年度などのパラメータを受け取る1クラスを N 回インスタンス化。

- `super(contestType, String(year))` で provider key を一意化（例: `AOJ_ICPC::2025`）
- 年度範囲定数（`OLDEST_YEAR` / `LATEST_YEAR`）を `export` してテストでも参照
- グループ登録は最新年→古い年の降順（`addProvider` 順 = 表示順、先 = 上）

AOJ/JAG 固有の詳細（`AOJ_LABEL_OVERRIDES`、`titleStyle`、同一年2回開催の `suffix` 分割など）は `aoj_icpc_providers.ts` / `aoj_jag_providers.ts` を参照。

### 補足: 固定セクションによる同一 ContestType 内の共存

同一 `ContestType` で異なるクラスを共存させる場合、`super(contestType, '0100')` のように固定文字列で provider key を一意化する（例: `AWC::0100`）。AWC0100 / AWC0150 はパターン2だが、範囲フィルタ型の AWC0001-0099 等と同じ `ContestType.AWC` グループに登録されている。

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

### 単一ソース型

| コンテスト                  | contest_id              | 問題数 | フォーマット |
| --------------------------- | ----------------------- | ------ | ------------ |
| EDPC                        | `'dp'`                  | 26問   | A～Z         |
| TDPC                        | `'tdpc'`                | 26問   | A～Z         |
| NDPC                        | `'ndpc'`                | 20問   | A～T         |
| FPS_24                      | `'fps-24'`              | 24問   | A～X         |
| ACL_PRACTICE                | `'practice2'`           | 12問   | A～L         |
| ACL_BEGINNER / ACL_CONTEST1 | `'abl'`/`'acl1'`        | 6問    | A～F         |
| AWC0100 / AWC0150†          | `'awc0100'`/`'awc0150'` | 15問   | A～O         |

†注: ContestType.AWC を再利用し、section（`'0100'`, `'0150'`）で provider key を一意化。ACL 系は `Acl` グループ、DP 系は `dps` グループで統一管理。

### コンストラクタパラメータ型 / regex フィルタ型

| コンテスト      | フィルタ方式    | 備考                                   |
| --------------- | --------------- | -------------------------------------- |
| ICPC 国内予選   | 年度パラメータ  | `AojIcpcPrelimProvider(type, year)`    |
| ICPC アジア地区 | 年度パラメータ  | `AojIcpcRegionalProvider(type, year)`  |
| JAG 模擬国内    | 年度パラメータ  | 同一年2回開催は suffix 分割            |
| JOI 一次予選    | regex           | `joi{YYYY}yo1{a\|b\|c}`               |
| JOI 二次予選    | regex + section | 2020 以降 / 2006-2019 で Provider 分離 |
| JOI 本選        | regex           | 2026 年より `ho` → `sf` サフィックス   |

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

---

## 実装完了後

このガイドのリファレンステーブルに新 Provider の行を追加し、最終更新日を更新すること

---

## 参考資料

- [Provider 実装・テスト・フィクスチャ](../src/features/tasks/utils/contest-table/)
- 各 Provider の実装経緯: `git log --oneline --all --grep='#NNNN'`（issue 番号で検索）

---

**最終更新**: 2026-09-03
