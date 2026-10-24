# PR1.5 — AOJ API の移転に追従する（#4028）

前提は [plan.md](./plan.md)。

**状態**: 未着手。新しい API の応答は 2026-10-24 にメンテナがブラウザで確かめ、形は変わっていなかった（[結果](#15-0-の結果2026-10-24)）。変更はベース URL とテストだけで済む。PR2 の前に出す（PR2 の前に staging で JAG 模擬地区を取り込む必要があり、それには AOJ の取り込みが動いている必要がある）。

## 何が変わったか

- AOJ Developers（`developers.u-aizu.ac.jp`）の告知: 「Updated 2026/09/07: The Main API has migrated from https://judgeapi.u-aizu.ac.jp/ to https://onlinejudge.u-aizu.ac.jp/api/」
- 旧ホストは **HTTP 410 Gone** を返す（2026-10-24 に `challenges/cl/JAG/REGIONAL` などで確認）。リダイレクトはされない
- 変わったのはベース URL だけ。エンドポイントのパスはそのままで、応答の形も同じだった（[結果](#15-0-の結果2026-10-24)）

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

| #     | 内容                                                                                                        | 補足                                                                                                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.5-0 | 新しい API のエンドポイントと応答の形を確かめる（メンテナ）                                                 | **済**（[結果](#15-0-の結果2026-10-24)）                                                                                                                                   |
| 1.5-1 | `AOJ_API_BASE_URL` を `https://onlinejudge.u-aizu.ac.jp/api/` にする                                        | パスは変わっていないので、エンドポイントは触らない                                                                                                                         |
| 1.5-2 | テスト: `clients.test.ts` の client を `AOJ_API_BASE_URL` から作り、nock は新しいホストの `/api/…` で受ける | ベース URL の末尾の `/` が抜けると落ちることを `verify-test-strength` で確かめる                                                                                           |
| 1.5-3 | fixture は差し替えない                                                                                      | 応答の形が同じため。取り直すと統計値やコンテストの増減で差分が出て、fixture に依存するテストの期待値まで変わる                                                             |
| 1.5-4 | 動作確認                                                                                                    | ローカルの管理画面で、AOJ の全種別（Courses / PCK / JAG / ICPC）の取り込み一覧が表示されること。staging へ入れた後、PR2 の前提の JAG REGIONAL の取り込みが実地の確認になる |

DB も共有インターフェイスも変えないので、クロスレビューの条件には当たらない。

### 1.5-0 の結果（2026-10-24）

メンテナが新しいベース URL でブラウザから開き、応答を既存の fixture（2026-05 に旧ホストで記録）と突き合わせた。

| エンドポイント                | 確かめたこと                                                                                                                                                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `courses`                     | 最上位のキー（`filter` / `courses`）と、course のキー 12 個が同じ。先頭の ITP1 / ALDS1 / ITP2 の id / serial / name も同じ                                                                                                   |
| `problems?size=10000`         | 問題のキー 16 個が同じ（fixture は無作為に選んだ 100 問なので、並びの違いは記録の仕方によるもの）                                                                                                                            |
| `challenges/cl/JAG/REGIONAL`  | 最上位（`largeCl` / `contests`）、コンテスト・日・問題のキーがすべて同じ。2021 / 2022 は問題 ID・名前・`available`・メモリ制限・`day.id` まで一致し、違うのは `solvedUser` などの統計値だけ。3355 の名前末尾のタブもそのまま |
| `challenges/cl/ICPC/REGIONAL` | キーがすべて同じ。2024 は `day.id`（325）・題名・問題数（12）・先頭 3 問の ID と名前まで一致                                                                                                                                 |
| `challenges/cl/ICPC/PRELIM`   | キーがすべて同じ。2026 は fixture の記録（2026-05）より後の回なので fixture には無いが、問題 1690〜1693 の名前は seed の A〜D と一致                                                                                         |
| `challenges/cl/JAG/PRELIM`    | キーがすべて同じ。2026 は fixture に無い回だが、問題 3452〜3456 の名前は seed の A〜E と一致                                                                                                                                 |
| `challenges/cl/PCK/PRELIM`    | キーがすべて同じ。先頭の 2026（4084〜）は fixture に無い回（seed にも PCK は無い）                                                                                                                                           |
| `challenges/cl/PCK/FINAL`     | キーがすべて同じ。2025 は `day.id`（337）・題名・問題数（13）・先頭 3 問の ID と名前まで一致                                                                                                                                 |

管理画面の取り込みが使う 8 つのエンドポイント（`courses`、`problems`、`challenges` の 6 種別）をすべて確かめた。

値の違いは 1 つだけ: 最上位の `largeCl.id` が小文字になった（`"JAG"` → `"jag"`、`"ICPC"` → `"icpc"`、`"PCK"` → `"pck"`）。コンテストの `largeCl` / `middleCl`（`"JAG"` / `"Regional"` など）と `abbr` は変わっていない。コードは最上位の `largeCl` を読まない（型は `Record<string, unknown>`）ので影響しない。

fixture に無い回（ICPC 国内予選 2026、JAG 模擬国内 2026、PCK 予選 2026 など）は、記録の後に AOJ に追加されたもので、形式の違いではない。

問題ページへのリンク `https://onlinejudge.u-aizu.ac.jp/problems/{id}`（`AOJ_TASKS_URL`）も、今のまま開ける（2026-10-24 にメンテナが確認）。`challenges/search/titles/{id}` は同じ問題を別の経路で開くページで、リンクを変える必要は無い。

## 参考

- [AOJ Developers](http://developers.u-aizu.ac.jp/)（移転の告知、API リファレンス）
- [API Usage Guides](http://developers.u-aizu.ac.jp/guides/)（例は旧ホストのまま）
