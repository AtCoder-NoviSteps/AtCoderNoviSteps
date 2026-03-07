# atc001 (AtCoder Typical Contest 001) の追加 (Issue #3239)

[Issue #3239](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3239) で、`atc001` の DFS 問題を追加。`ATCODER_OTHERS` にプレフィックス `atc001` を1件追記するだけで、Prismaスキーマ変更・コンテストテーブルプロバイダー追加は不要。

## 変更内容

### `src/lib/utils/contest.ts`
- `ATCODER_OTHERS` に `atc001: 'AtCoder Typical Contest 001'` を追加

### `src/test/lib/utils/test_cases/contest_type.ts`
- `atCoderOthers` 配列に `atc001` → `ContestType.OTHERS` のテストケースを追加

### `src/test/lib/utils/test_cases/contest_name_labels.ts`
- `atCoderOthers` 配列に `atc001` → `'ATC001'` のテストケースを追加
  - `getContestNameLabel` は `atc` 用の特殊処理がないため、デフォルトの `contestId.toUpperCase()` で `ATC001` を返す

## 注意事項

- プレフィックスは `atc` ではなく `atc001` を使用（`atc` だと将来的に意図しないIDにマッチする可能性があるため）
- `startsWith('atc001')` は `atc001` のみにマッチし、`atc002` などには別途エントリが必要
- `getContestNameLabel` への追加は不要（`ATC001` のデフォルト表示で問題ない場合）
