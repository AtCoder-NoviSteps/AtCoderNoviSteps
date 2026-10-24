# PR1.5 — AOJ API の移転に追従する（#4028）

前提は [plan.md](./plan.md)。

**状態**: 未着手。PR2 の前に出す。PR2 の前に staging で JAG 模擬地区を取り込む必要があり、それには AOJ の取り込みが動いている必要がある。

## 何が変わったか

- AOJ Developers（`developers.u-aizu.ac.jp`）の告知: 「Updated 2026/09/07: The Main API has migrated from https://judgeapi.u-aizu.ac.jp/ to https://onlinejudge.u-aizu.ac.jp/api/」
- 旧ホストは **HTTP 410 Gone** を返す（2026-10-24 に `challenges/cl/JAG/REGIONAL` などで確認）。リダイレクトはされない
- 告知で確かなのはベース URL の移転だけ。エンドポイントのパスと応答の形が変わったかは未確認（この環境からは AOJ に接続できない）。ドキュメント上の Main API は v1.0.1（更新 2025-06-19、移転より前）で、開発者向けページの使い方の例も旧ホストのまま

## 影響

今は**管理画面からの AOJ の取り込み（Courses / PCK / JAG / ICPC）がすべて失敗する**。

| 箇所                                                | 内容                                                                                                                                    |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `AOJ_API_BASE_URL`（`src/lib/constants/urls.ts`）   | `https://judgeapi.u-aizu.ac.jp/`（旧ホスト）                                                                                            |
| `src/lib/clients/index.ts`                          | 上の定数で `AojCoursesApiClient` / `AojChallengesApiClient` を作る                                                                      |
| `src/lib/clients/fixtures/record_requests.ts`       | fixture の取り直しも上の定数を使う                                                                                                      |
| `src/lib/clients/aizu_online_judge/clients.test.ts` | テストは自前の `https://judgeapi.u-aizu.ac.jp` で client を作り、nock している。定数を変えても通るので、ベース URL の誤りを検出できない |

使っているエンドポイントは 3 種類: `courses`、`problems?size=10000`、`challenges/cl/{PCK|JAG|ICPC}/{PRELIM|FINAL|REGIONAL}`。

影響しないもの: 問題ページへのリンク（`AOJ_BASE_URL` = `https://onlinejudge.u-aizu.ac.jp` の `/problems/{id}`）は API ではない。AtCoder Problems の取り込みも関係ない。

## 落とし穴: ベース URL の `/`

`HttpRequestClient` は `new URL(endpoint, baseApiUrl)` で URL を組み立てる。新しいベースは `/api/` というパスを含むので、ベースの末尾に `/` が無いか、エンドポイントの先頭に `/` があると、`/api` が落ちる（2026-10-24 に Node で確認）。

| endpoint   | base                                    | 結果                                           |
| ---------- | --------------------------------------- | ---------------------------------------------- |
| `courses`  | `https://onlinejudge.u-aizu.ac.jp/api/` | `https://onlinejudge.u-aizu.ac.jp/api/courses` |
| `courses`  | `https://onlinejudge.u-aizu.ac.jp/api`  | `https://onlinejudge.u-aizu.ac.jp/courses`     |
| `/courses` | `https://onlinejudge.u-aizu.ac.jp/api/` | `https://onlinejudge.u-aizu.ac.jp/courses`     |

今のエンドポイントは先頭に `/` を付けていない（`buildEndpoint` も付けない）ので、ベースを `…/api/` にするだけでよい。旧ホストはパスが無かったので、この落とし穴は表に出ていなかった。

## タスク

| #     | 内容                                                                                                        | 補足                                                                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.5-0 | 新しい API のエンドポイントと応答の形を確かめる（メンテナ。ネットワークが要る）                             | [下記](#15-0-の確かめ方)                                                                                                                     |
| 1.5-1 | `AOJ_API_BASE_URL` を `https://onlinejudge.u-aizu.ac.jp/api/` にする                                        | 1.5-0 でパスが変わっていれば、エンドポイントも直す                                                                                           |
| 1.5-2 | テスト: `clients.test.ts` の client を `AOJ_API_BASE_URL` から作り、nock は新しいホストの `/api/…` で受ける | ベース URL の末尾の `/` が抜けると落ちることを `verify-test-strength` で確かめる                                                             |
| 1.5-3 | fixture は、応答の形が変わったときだけ取り直したものに差し替える                                            | 形が同じなら差し替えない。データの増減（新しいコンテスト）で、fixture に依存するテストの期待値まで変わるのを避ける                           |
| 1.5-4 | 動作確認                                                                                                    | ローカルの管理画面で、AOJ の各種別の取り込み一覧が表示されること。staging へ入れた後、PR2 の前提の JAG REGIONAL の取り込みが実地の確認になる |

DB も共有インターフェイスも変えないので、クロスレビューの条件には当たらない。

### 1.5-0 の確かめ方

ローカルで `AOJ_API_BASE_URL` を新しい値に変えてから、fixture を取り直して差分を見る。

```bash
pnpm dlx vite-node ./src/lib/clients/fixtures/record_requests.ts
git diff --stat src/lib/clients/fixtures/aizu_online_judge
git diff src/lib/clients/fixtures/aizu_online_judge/challenges/jag_regional/contests.json | head -100
```

- `record_requests.ts` は AtCoder Problems の fixture も取り直す。そちらの差分は捨てる
- 見るのはキーの増減と型の変化。`solvedUser` / `submissions` / `successRate` などの統計値と、コンテストの追加による差分は無視してよい
- JAG REGIONAL は 16 コンテスト / 158 問のままか（今の fixture は 2026-05 の記録で、本番と一致する）
- エンドポイントが 404 などで失敗したら、パスが変わっている。開発者向けページの Main API のリファレンスで新しいパスを探す

問題ページへのリンクも、念のため確かめる（メンテナのスクリーンショットでは `challenges/search/titles/3643` という別のパスで開いていた）。

```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://onlinejudge.u-aizu.ac.jp/problems/3643
```

## 参考

- [AOJ Developers](http://developers.u-aizu.ac.jp/)（移転の告知、API リファレンス）
- [API Usage Guides](http://developers.u-aizu.ac.jp/guides/)（例は旧ホストのまま）
