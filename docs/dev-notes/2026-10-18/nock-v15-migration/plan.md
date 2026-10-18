# nock v15 移行（#4128）

## 概要

[#4128](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/4128)（nock 14.0.17 → 15.0.2）のUnit test失敗は、テスト1件の未処理rejectが原因だった。nock v15の告知済み破壊的変更とは無関係。
`vote_grade.test.ts` の `returns false when request is aborted` をfetchのspyへ変更して解消した（2026-10-18、本番コード変更なし）。残りはstagingへの反映と#4128のrebase・CI確認（人手）。

## 判断の根拠（コード外の事実）

- **15.0.2の差分:** 新たな破壊的変更なし。修正は `content-encoding: gzip` の空request bodyの解凍失敗のみで（[#3042](https://github.com/nock/nock/pull/3042)）、本プロジェクトは該当しない。[移行ガイド](https://github.com/nock/nock/blob/v15.0.2/migration_guides/migrating_to_15.md)の破壊的変更9項目は不変で、削除・変更APIの利用箇所はない。
- **失敗の原因:** CIのannotationsはexit code 1のみだった。ローカル（Node 24.21.0）の再現では全件成功し、Vitestがundiciの `ERR_INVALID_STATE`（`ReadableStream is already closed`）を未処理rejectとして検出していた。
- **発生条件:** 中断済みsignal + FormData bodyのPOSTで起きる。nockなしの素のNodeは常に発生、nock14はfetchを置き換えるので発生しない、nock15はフィールド2個以上で発生する。根本はundiciの不具合で、nock15がそれを隠さなくなっただけ。上流issueは未発見。
- **10-08に高リスクとした未一致時の501応答:** 現行テストは未一致に依存せず影響なし。
- **本番への到達なし:** `submitVote` は本番ではブラウザーのネイティブfetchで動く。

## 決定

- テストの契約は「abortでrejectしたら `false`」と「signalをfetchへ渡す」の2点に限り、undiciの中断処理はテスト対象外とする。そのためfetchをspyし、undiciのbody処理を通さない。
- nock14でも成立する変更なので、#4128とは別にstagingへ先に入れる。
- 振る舞いは同じなのでテスト名は維持する。

検証結果（`submitVote` への変異。旧テストはPR headのnock15で確認）:

| 変異                    | 旧テスト                                | 新テスト |
| ----------------------- | --------------------------------------- | -------- |
| fetchへsignalを渡さない | 見逃す（未一致でも `false` になるため） | 検出     |
| catchで再throw          | 検出                                    | 検出     |
| catchで `true` を返す   | 検出                                    | 検出     |

新テストは nock14（全2720件）・nock15（PR headに適用、全2709件）とも成功、未処理エラー0件。

## 却下した案

| 案                                                                             | 理由                                                               |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| formDataを1フィールドにする                                                    | undici内部のタイミングに依存し、clientの契約と無関係な回避になる。 |
| Vitestの `dangerouslyIgnoreUnhandledErrors` / `onUnhandledError` で除外        | 全テストの未処理エラー検出を弱める。                               |
| `submitVote` で `signal.aborted` を事前判定、またはbodyをURLSearchParamsへ変更 | テスト環境の不具合のためにproduction codeを変える。                |
| nockの `delay` で送信中に中断                                                  | 時間依存で不安定。v15で `delay` の意味も変わった。                 |
| 上流修正を待つ                                                                 | nockなしでも再現するundiciの不具合で、修正時期が不明。             |
| 10-08案の回帰テスト（未一致・interceptor残留）の追加                           | 原因が別と判明し、現行テストで問題がないため不要。                 |

## 残作業（人手）

1. 本修正をstagingから切ったブランチでPRにし、反映する。
2. #4128をrebaseしてCIを再実行する。lockfileはRenovateの生成物を使う。完了条件はCI成功（未処理エラー0件）。
3. マージ後、[upstream-pr-review](../../2026-06-28/upstream-pr-review/plan.md) の「2026-10-18 レビュー（#4128更新）」節を[台帳](../../2026-06-28/upstream-pr-review/ledger.md)へ1行で移す。

## 確認限界

- `gh` が未認証でCIログ本文は未確認。CIのNode 24のminor版はローカル（24.21.0）と異なる可能性がある。
