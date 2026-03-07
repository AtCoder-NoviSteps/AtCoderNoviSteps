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

## 追加修正: getContestNameLabel で ATC 001 形式を返す

テストが期待する `'ATC 001'`（スペースあり）に合わせ、`getContestNameLabel` に `atc` プレフィックスの処理を追加する。

### `src/lib/utils/contest.ts`

- `regexForAxc` のパターンに `atc` を追加（`/^(abc|arc|agc|atc)(\d{3})/i`）
- これにより `atc001` → `ATC 001` が返るようになる

## 実装後の教訓

- Prettier が `ATCODER_OTHERS` のキー順序をアルファベット順に並べ替えた（`atc001` が先頭付近に移動）。キー順序に意味がある場合はコメントで明示すること。
- `src/test/lib/common/test_helpers.test.ts` の `expects to handle large arrays efficiently` はタイミング依存のフレイキーなテスト（本変更とは無関係）。CI で稀に失敗する場合は無視してよい。
- ラベル表記（`ATC001` vs `ATC 001`）はテストが正の仕様源。実装前にテストで期待値を確認してから実装すること。
- `regexForAxc` に `atc` を追加するだけで `getContestNameLabel` の対応が完了する（既存の `ABC NNN` 形式と同じフォーマット）。
