# 全方位木DPの問題追加 (Issue #3264)

[Issue #3264](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3264) で、s8pc-4 (square869120Contest #4) の問題 D を追加する。PR #3243 (atc001 追加) と同じパターン。

## 変更対象

### 1. `src/lib/utils/contest.ts`

**`ATCODER_OTHERS` に追加**:

```ts
's8pc-4': 'square869120Contest #4',
```

**`getContestNameLabel` を汎用化**:

`ATCODER_OTHERS` の辞書を完全一致でルックアップし、登録済みならその名前を返す。既存の `chokudai_S` はプレフィックス一致（`chokudai_S001` のような ID）のため辞書には存在せず、この汎用処理と競合しない。`chokudai_S` の専用分岐はそのまま残す。

追加箇所は `regexForAtCoderUniversity` の直後、`chokudai_S` の直前:

```ts
const othersLabel = ATCODER_OTHERS[contestId as keyof typeof ATCODER_OTHERS];
if (othersLabel) {
  return othersLabel;
}
```

これにより `atc001` など既存の ATCODER_OTHERS 登録コンテストも自動でラベルが返るようになる（現状はフォールバックの `toUpperCase()` に落ちていたものを正式に対応）。

### 2. テストケース

**`src/test/lib/utils/test_cases/contest_type.ts`** の `atCoderOthers` 配列に追加:

```ts
createTestCaseForContestType('square869120Contest #4')({
  contestId: 's8pc-4',
  expected: ContestType.OTHERS,
}),
```

**`src/test/lib/utils/test_cases/contest_name_labels.ts`** の `atCoderOthers` 配列に追加:

```ts
createTestCaseForContestNameLabel('square869120Contest #4')({
  contestId: 's8pc-4',
  expected: 'square869120Contest #4',
}),
```

### 3. `prisma/tasks.ts`

末尾に追加:

```ts
{
  id: 's8pc_4_d',
  contest_id: 's8pc-4',
  problem_index: 'D',
  name: 'Driving on a Tree',
  title: 'D. Driving on a Tree',
},
```

`grade` はなし（`PENDING` のまま）。

## 変更しないもの

- `prisma/schema.prisma` — `ContestType.OTHERS` を使うため変更不要
- `contest_task_pairs.ts` — 共有問題なし
- コンテストテーブル表示用コンポーネント — OTHERS として既存の表示に乗る

## 作業順序

1. `contest.ts` の `ATCODER_OTHERS` に `'s8pc-4'` を追加
2. `getContestNameLabel` を汎用化（辞書ルックアップ追加）
3. テストケースを追加
4. `prisma/tasks.ts` にタスクを追加
5. `pnpm test:unit` でテスト通過を確認
6. `pnpm format` を実行
