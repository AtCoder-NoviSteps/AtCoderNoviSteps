# Issue #3862 hotfix: 一覧表ページがログイン済みでも未ログイン表示になる問題

- Issue: https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/3862
- ブランチ: `hotfix/#3862`
- 工程: hotfix(coderabbit review / refactor サイクル / session-close は省略)

## 概要

ログイン済みユーザーが一覧表ページ(`/problems`)にアクセスすると、不定期に未ログイン状態の表示になる。別タブで開き直すと解消されることが多い。

### 根本原因

**`/problems` のレスポンスが「共有キャッシュ可」を宣言しながら、`Vary: Cookie` を宣言していない。**
その結果、匿名ユーザー向けにキャッシュされたレスポンスがログイン済みユーザーにも配信される。

`src/routes/problems/+page.server.ts:38-40` で、未ログインレスポンスに
`Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=600` を設定している。

共有キャッシュのキーは **URL + メソッド + `Vary` が指名したヘッダー**だけで構成される(RFC 9111)。
`Vary: Cookie` を宣言しない限り、Cookie の有無・値ではエントリが分岐しない。
これは Vercel 固有の挙動ではなく標準的な共有キャッシュの仕様であり、**責任はアプリ側にある**。

加えて Vercel は「Cookie 付きリクエストはキャッシュを迂回する」という安全側のヒューリスティクスを
持たない(Phase 1 で実測確認済み)。公式ドキュメント "Cacheable response criteria" の除外条件は
「リクエストに `Authorization` ヘッダーがない」「レスポンスに `set-cookie` がない」等のみで、
**リクエスト側の Cookie の有無は配信判定に使われない**。つまり宣言漏れはそのまま事故になる。

発生シーケンス:

1. `auth_session` を持たない匿名訪問者(bot・未ログイン閲覧者)が `/problems` にアクセス
   → 匿名版の HTML / `__data.json` が CDN に最大 5〜15 分キャッシュされる
2. その間にログイン済みユーザーが同じ URL にアクセス
   → CDN がセッション Cookie を無視してキャッシュ済み匿名版を返す
   → サーバーに到達すらせず、ページ全体(レイアウトの `user` 含む)が未ログイン表示になる

「ログイン済みレスポンスにはヘッダーを付けない」という既存の対策
(`e2e/problems_cache.spec.ts` で検証済み)は**キャッシュへの書き込み側**しか防いでおらず、
**読み取り側**(Cookie 付きリクエストへのキャッシュ配信)が盲点だった。

補足 — 誰がキャッシュを温めるか:

- 有効セッション保持者: `session !== null` でヘッダーが付かない → 温めない
- 期限切れ Cookie を送る訪問者: stale cookie 削除の `Set-Cookie`(`auth.ts:54`)が付くため
  キャッシュ対象外 → 温めない。ただし `expires: idlePeriodExpiresAt` を過ぎるとブラウザが
  Cookie 自体を送らなくなり、以後は匿名訪問者として温める側に回る
- **GA Cookie のみを持つ再訪問者: 温める**。`_ga` はクライアント JS が発行するため
  オリジンは `Set-Cookie` を返さず、`auth_session` も無いので匿名レスポンスがキャッシュされる

### 症状との整合性

| 症状                       | 説明                                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 不定期に発生               | 直近 5〜15 分以内に同一 URL への匿名アクセスがあった場合のみ発生                                                                                    |
| 一部ユーザーのみ           | Vercel CDN キャッシュはリージョン単位で分離されている(公式仕様)                                                                                     |
| ログイン直後にも発生       | ログイン前の本人の匿名アクセスがキャッシュを温めるパターン                                                                                          |
| 別タブで解消することが多い | **推測(未検証)**。HTML と `__data.json` が別エントリであること、`s-maxage=300` の失効、リージョン差などが候補。修正方針に影響しないため深追いしない |

### 時系列

| 日付       | 出来事                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------- |
| 2026-06-21 | PR #3707(サーバー内メモリキャッシュ)、PR #3709(`/votes` に CDN ヘッダー追加)マージ        |
| 2026-07-04 | PR #3801 マージ — `ce00537e` で `/problems` に CDN ヘッダー追加(**一覧表での発生開始点**) |
| 2026-07-15 | Issue #3862 起票                                                                          |

- PR #3707 のインメモリキャッシュ(`Cache<T>`)は共有データのみを保持しており、**本バグとは無関係**。
- 「#3707 以降に発生」という報告は、同日マージの #3709(`/votes` に同じヘッダー追加)や、
  後続の #3801 を含む一連の変更として認識された可能性が高い。
  一覧表(`/problems`)に限れば発生開始点は #3801(7/4)。

## 設計方針

`s-maxage` / `stale-while-revalidate` の CDN ヘッダーを `/problems` から撤去する。

- 読み取り側を制御する手段は `Vary: Cookie` のみ。付ければ正しさは回復する(危険な選択肢ではない)が、
  後述のとおり本サイトでは得られる効果が不確かなわりに仕組みが複雑になる。hotfix では単純さを取る
- DB 負荷対策は PR #3707 のインメモリキャッシュが引き続き担うため、失うのは
  匿名アクセス時の関数実行削減のみ
- 修正範囲は `/problems` のみ(ユーザー決定)。`/votes` の同一パターンは別 Issue で対応

### 撤去しても新たな問題が起きない根拠(運用実績)

`Cache-Control` は `session === null` のときだけ設定されるため、**ログイン済みユーザーへの
レスポンスには現在も `Cache-Control` が一切付いていない**。この「ヘッダーなし」の状態は
`ce00537e`(2026-07-04)以前から全ユーザーに対して継続しており、それに起因する不具合報告はない。

撤去後は全ユーザーがこの既知の安全な状態に戻るだけで、未知の構成にはならない。
また `s-maxage` が無ければ Vercel は関数レスポンスを CDN キャッシュしない
(公式 "How to cache responses" が `s-maxage` を必須としている)ため、
明示的な `private` / `no-store` の追加は不要(YAGNI)。

### インメモリキャッシュとの関係(調査済み・変更なし)

CDN キャッシュとアプリ内のインメモリキャッシュ(`Cache<T>`)は独立しており、本修正の影響を受けない。
`/problems` が読むデータは性質が分かれている:

- 投票統計(`getVoteGradeStatistics()`): インメモリキャッシュ経由。全ユーザー共通の集計値のみ
- ユーザー固有データ(`getTaskResults(userId)` / `getTasksWithTagIds(tagIds, userId)`):
  `src/lib/services/task_results.ts` はキャッシュを一切 import しておらず、毎リクエスト DB を引く

したがって個人データがインメモリキャッシュに載ることはなく、CDN ヘッダー撤去後も
共有データのキャッシュは有効なまま DB 負荷対策として機能し続ける。

補足(バグではない): `getCachedWorkbooksByUser` は固定キー `workbooks_by_user` を使うため
一見ユーザー固有データを共有しているように読めるが、実際の呼び出し元は
`getWorkBooksCreatedByUsers()`(= ユーザー作成タイプの問題集すべて)であり閲覧者ごとの
スコープではない。命名が紛らわしいだけ。

## 却下した代替案

1. **`Vary: Cookie` を付けて匿名キャッシュを維持**
   — **正しさは回復する。危険な選択肢ではない**(ログイン済みは必ず別キーになり、
   そもそも `s-maxage` を付けないのでキャッシュもされない)。却下理由は安全性ではなく費用対効果。

   `Vary` は Cookie ヘッダー**全体の値**をキーにするため、「`auth_session` だけ見て `_ga` は無視」
   といった個別 Cookie 単位の指定はできない。本サイトは Google Analytics
   (`src/lib/components/GoogleAnalytics.svelte`, `G-LFHMP1606H`)を読み込んでおり、
   `_ga` / `_ga_*` は訪問者ごとに一意の値を持つ(gtag.js の標準挙動。本サイトでの実測は未実施)。

   | リクエスト元                 | Cookie ヘッダー         | `Vary: Cookie` 下のキー | 結果                       |
   | ---------------------------- | ----------------------- | ----------------------- | -------------------------- |
   | bot・クローラー(JS 実行なし) | なし                    | 全員共通                | HIT                        |
   | 初回訪問者の最初のリクエスト | なし                    | 全員共通                | HIT                        |
   | 再訪問の匿名ユーザー         | `_ga=GA1.1.123…`        | 訪問者ごとに一意        | MISS                       |
   | ログイン済みユーザー         | `auth_session=…; _ga=…` | 一意                    | MISS(元々キャッシュ対象外) |

   GA Cookie はクライアント JS が発行するため初回リクエストにはまだ付いておらず、
   bot と初回訪問者ぶんの HIT は残る。失うのは**再訪問の匿名ユーザーぶん**で、
   その割合は未測定。Vercel 公式も「`Vary` を増やすとエントリ数が指数的に増える」と警告している。

   効果が不確かなわりに「`Vary` と `s-maxage` の両方が揃って初めて正しい」という
   壊れやすい構成になる(どちらかが失われても静かに退行する)ため、hotfix では採用しない。

2. **Cookie 有無で `setHeaders` を条件分岐するのみ**
   — 書き込み側の制御であり、読み取り側(キャッシュ済みエントリの配信)を防げないため単独では無効。
3. **ISR(adapter-vercel の `isr` 設定)**
   — パス単位の共有キャッシュが前提なので、セッションで内容が変わるページには構造的に不適。

## フェーズ

### Phase 1: 本番での原因実証(手動)

sandbox から外部 curl を実行できないため、ユーザーが手元で実行する。

```bash
# 1〜2 回目: Cookie なしでキャッシュを温める(前処理。結果の確認は不要)
curl -s -o /dev/null -D - https://atcoder-novisteps.vercel.app/problems | grep -iE 'x-vercel-cache|vary|set-cookie|age'
curl -s -o /dev/null -D - https://atcoder-novisteps.vercel.app/problems | grep -iE 'x-vercel-cache|vary|set-cookie|age'

# 3 回目: セッション Cookie 付きで同じ URL にアクセス(ここだけが合否判定の対象)
curl -s -o /dev/null -D - \
  -H 'Cookie: auth_session=dummyinvalidsession1234567890' \
  https://atcoder-novisteps.vercel.app/problems | grep -iE 'x-vercel-cache|vary|set-cookie|age'
```

- [x] **3 回目で `x-vercel-cache: HIT`(または `STALE`)が返る**
      = Cookie 付きリクエストがオリジンに到達せず共有キャッシュから配信された直接証拠
- 注 1: Cookie の中身はダミーでよい(`Vary` 未宣言なので CDN は Cookie の名前も値も見ない、
  というのが検証対象そのもの)。ただしオリジンに到達した場合は無効セッション扱いになるため、
  ログイン済みアクセスと等価なのは CDN 層の視点に限る
- 注 2: Cookie 名は `auth_session`(`src/features/auth/server/session.ts:12`)。
  名前を間違えるとオリジン到達時に `cookies.get()` が空を返し、偽陰性になる
- 注 3: Vercel のキャッシュキーは `Accept` / `Accept-Encoding` を含むため、
  3 リクエストとも curl で実行し同一キーに揃えること(ブラウザと混ぜない)

#### 実測結果(2026-07-19) — 根本原因 **確定**

3 回目(Cookie 付き)のレスポンスヘッダー:

```text
age: 210
cache-control: public, max-age=0
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-sveltekit-page: true
x-vercel-cache: HIT
```

各ヘッダーが示す事実:

| ヘッダー                           | 読み取れること                                                                                                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-vercel-cache: HIT`              | Cookie 付きリクエストが**オリジンに到達せず** CDN から配信された                                                                                                                                                  |
| `set-cookie` **なし**              | オリジン非到達の裏付け。到達していれば無効セッション削除の `Set-Cookie` が付くはず(`auth.ts:54`)                                                                                                                  |
| `vary` **なし**                    | アプリも Vercel も Cookie による分岐を宣言していない。**これが直接の原因**                                                                                                                                        |
| `age: 210`                         | 210 秒前に生成済みのエントリ。上記 3 リクエストより前に検証者が実行した匿名 curl が作ったもので、**匿名リクエストが書き込んだキャッシュが後続の Cookie 付きリクエストに配信される**というライフサイクル全体を示す |
| `cache-control: public, max-age=0` | `s-maxage` / `stale-while-revalidate` はブラウザ送出時に Vercel が除去する(公式仕様どおり)。ブラウザキャッシュは `max-age=0` なので**犯人は CDN 側のみ**と確定                                                    |

測定できたのは「匿名アクセスが作ったキャッシュが Cookie 付きリクエストに配信される」という**機構**まで。
キャッシュを温めたのは検証者自身の匿名 curl であり、本番の実トラフィックがどの程度温めているかは**未測定**。
ただし温める主体が誰であれ匿名リクエストである限り挙動は同じで、Issue #3862 に実ユーザーからの
報告が上がっていること自体が、本番でも匿名アクセスによるキャッシュ生成が起きている傍証になる。

実頻度を測るなら、300 秒以上あけて温め処理を行わずに Cookie 付きリクエストを 1 回だけ投げ、
`HIT` が返れば第三者のアクセスが温めていたと分かる。ただし**修正方針は結果に依存しない**ため、
本 hotfix では実施しない。

#### 対立仮説「アプリが Cookie を受け取れていない」— 否定済み

「Vercel のキャッシュキーの問題ではなく、SvelteKit アプリ側が Cookie を受け取らない設定に
なっているのでは」という仮説は、以下により成立しない。

- 本番でログインが正常に機能している。アプリに Cookie が届かないなら**誰も一度もログインできない**
- `e2e/problems_cache.spec.ts` の「ログイン済みでは `s-maxage` が付かない」ケースが通っている
  = サーバーがセッション Cookie を読めている
- そもそも `x-vercel-cache: HIT` のときアプリは**起動していない**ため、アプリ設定が影響する余地がない

決定的に確かめるなら、キャッシュバスターで確実に MISS させオリジンに到達させ、`set-cookie` の
有無を見る(未実施。上記 3 点で足りるため必須ではない):

```bash
CB="_cb=$(date +%s)"
curl -s -o /dev/null -D - \
  -H 'Cookie: auth_session=dummyinvalidsession1234567890' \
  "https://atcoder-novisteps.vercel.app/problems?$CB" \
  | grep -iE 'x-vercel-cache|set-cookie|vary|cache-control'
```

`MISS` + `set-cookie: auth_session=; ...` が返れば、オリジンは Cookie を受け取っていると確定する
(`_cb` は未知パラメータなので `load` は通常の `/problems` として動作し、`set-cookie` を含む
レスポンスはキャッシュされないため副作用もない)。

#### curl オプションの意味

| オプション                  | 意味                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `-s` (`--silent`)           | 進捗メーター・エラーメッセージを表示しない。パイプ処理時の余計な出力を抑制する                                      |
| `-o /dev/null` (`--output`) | レスポンスの**ボディ**の出力先を指定。`/dev/null` に捨てることで、HTML 本文を表示せずヘッダーだけ見られるようにする |
| `-D -` (`--dump-header`)    | レスポンスの**ヘッダー**の出力先を指定。`-` は標準出力の意味で、ヘッダーをパイプに流す                              |

つまり「**ボディは捨てて、ヘッダーだけを標準出力に出す**」定型で、その出力を
`grep -iE`(`-i` は大文字小文字を無視、`-E` は拡張正規表現)に渡して目的のヘッダー行だけを抽出する。

`curl -I`(HEAD リクエスト)を使わないのは意図的。HEAD は GET と別メソッドとして扱われ
CDN のキャッシュ挙動が GET と異なる可能性があるため、ブラウザと同じ GET を送りつつ
ボディを捨てるこの形で実証する。

### Phase 2: テスト反転(TDD red)

- [x] `src/routes/problems/page_server.test.ts`:
      `describe('load() cache-control behaviour')` を「全ケースで `setHeaders` が呼ばれない」構成に書き換える
  - anonymous / anonymous + tagIds / logged-in / vote stats 失敗(degraded)の 4 ケースとも
    `expect(event.setHeaders).not.toHaveBeenCalled()`
  - テスト名例: `'never sets a shared-cache header — shared caches ignore cookies without Vary (#3862)'`
- [x] `e2e/problems_cache.spec.ts`:
      anonymous / logged-in の両方で `cache-control` に `public` / `s-maxage` が含まれないことを
      検証する内容に書き換える(再導入への回帰ガード。ファイル名は据え置き)
- [x] この時点で `pnpm test:unit` が red になることを確認(匿名 2 ケースが失敗)

### Phase 3: 実装(green)

- [x] `src/routes/problems/+page.server.ts`:
  - `setHeaders` ブロック(L33-40、コメント含む)を削除
  - 未使用になる `voteStatsOk` フラグを削除(try/catch と `console.error` は維持)
  - `load` の引数から `setHeaders` を削除
- [x] `pnpm test:unit` が green になることを確認

### Phase 4: 規約更新

追記先は **`.claude/rules/sveltekit.md`**(`paths: ['src/routes/**', 'src/**/*.svelte']`)。
`## HTTP キャッシュヘッダー(`setHeaders`)` セクションを新設する。

`.claude/rules/server-cache.md` は選ばない。同ファイルの `paths` は
`src/lib/clients/cache.ts` / `src/**/server/cache.ts` に限定されており、
**バグが実際に書き込まれる `src/routes/**/+page.server.ts` では読み込まれない**。
本 plan の「インメモリキャッシュとの関係」節のとおり CDN キャッシュとインメモリキャッシュは
独立した関心事であり、同居させると分類としても破綻する。

- [x] `.claude/rules/sveltekit.md` に以下を追記(`## HTTP Cache Headers (`setHeaders`)`):
  - **判断基準(最優先)**: セッションで内容が変わるルートに `s-maxage` を設定してはならない。
    そもそも導入前に「節約できる関数実行数」を見積もること。本サイト規模
    (アプリ全体の Edge Requests 約 25k)では、旧設定が節約していた関数実行は
    リージョンあたり 1 日 288 回程度・CPU 時間で月数ドル未満にすぎず、
    **CDN キャッシュを入れる判断自体が費用対効果に見合わなかった**
  - 共有キャッシュ(`s-maxage`)のキーは URL + メソッド + **`Vary` が指名したヘッダー**のみ(RFC 9111)。
    `Vary: Cookie` を宣言しない限り Cookie の有無・値でエントリは分岐しない。
    これは Vercel 固有の挙動ではなく標準的な共有キャッシュの仕様であり、**責任はアプリ側にある**
  - Vercel は「Cookie 付きリクエストはキャッシュを迂回する」安全側のヒューリスティクスを持たない
    (2026-07-19 の実測で確認済み)。宣言漏れはそのまま事故になる
  - 「ログイン時にヘッダーを付けない」は書き込み側の制御であり、読み取り側
    (キャッシュ済みエントリの配信)は防げない
  - `Vary: Cookie` は Cookie ヘッダー全体を見る(個別 Cookie 単位の指定は不可)。
    GA 等の訪問者一意 Cookie があるとキャッシュが断片化し、再訪問ユーザーぶんの HIT を失う
  - `s-maxage` が無ければ Vercel は関数レスポンスを CDN キャッシュしないため、
    **`private` / `no-store` の明示的な追加は不要**(YAGNI。「念のため」で足さないこと)

## 検証

- [x] `pnpm test:unit`(2806 passed / 85 files)/ `pnpm check`(0 errors)/ `pnpm lint`(No issues found)
- [x] `pnpm test:e2e`(`problems_cache.spec.ts` の 2 ケースとも green)
- [ ] デプロイ後、curl で `/problems` の `cache-control` に `s-maxage` が含まれず、
      `x-vercel-cache` が `HIT` にならないことを確認。
      Vercel の CDN キャッシュはデプロイ単位で分離されるため手動パージは不要だが、
      想定外に `HIT` が続く場合はダッシュボードから手動パージする
- [ ] Issue #3862 の再発報告がないことを 1〜2 週間監視

### デプロイ後の負荷観測(Vercel Observability)

**増えるのは通信量ではなく関数実行回数**。キャッシュ HIT でも関数実行でもクライアントに送る
バイト数は同じなので Fast Data Transfer はほぼ変わらない。公式ドキュメント "Tracked events" が
「キャッシュ済みなら 1 Edge Request イベント、そうでなければ Edge Request + Function Invocation」
と明記しているとおり、撤去で増えるのは Function Invocation と CPU 時間。

増加幅は「5 分間に匿名 `/problems` リクエストが何件あるか」でほぼ決まる
(旧設定ではリージョンごと 5 分に 1 回しかオリジンに来なかったため)。
ログイン済みリクエストは元から毎回関数を実行しているので変化なし。
またこの構成は `ce00537e`(2026-07-04)以前の状態そのものであり、未知の負荷ではない。

#### 実測ベースライン(2026-07-19)

- アプリ全体の Edge Requests: **約 25k**
- うち検証済み bot: **約 1k(4%)**

この規模では撤去による関数実行増は誤差の範囲。Edge Requests は静的アセットも 1 件ずつ数えるため
(公式 "Tracked events": "1 edge request event if it's a static asset")、
25k のうち `/problems` の HTML / `__data.json` が占めるのはさらにその一部。
一方、旧設定でオリジンに到達していたのはリージョンあたり 5 分に 1 回(1 日 288 回程度)。

**逆に言えば、元の `s-maxage` が節約していた関数実行も 1 日あたり数百〜千件台にすぎなかった。**
CPU 時間に直せば月数ドルに届かない規模であり、その節約と引き換えに本番のログイン表示が
壊れるバグを 2 週間抱えたことになる。

> **教訓**: この規模のトラフィックでは、セッションで内容が変わるページに CDN キャッシュを
> 入れる判断自体が費用対効果に見合わない。導入前に「節約できる関数実行数」を見積もること。

注意: 「bot 確定 1k」は**下限**であり実際の自動化トラフィック比率ではない。
Vercel が確定と判定できるのは、自己申告の身元を IP レンジ・逆引き DNS・暗号署名で
検証できた bot だけで、ブラウザの User-Agent を騙るスクレイパーはここに含まれない
(Vercel 自身は「bot はインターネット全体の約半分」としている)。
真の比率を知るには Bot protection ruleset の `log` モードが必要だが、
上記のとおりコスト影響が誤差である以上、実施する実益は薄い。

観測手順:

- [ ] **Observability > Edge Requests タブ**(全プランで利用可)で `/problems` を選び、
      関数実行回数の推移と bot の内訳を確認する。
      公式ドキュメント: "provides detailed breakdowns for individual bots and bot categories,
      including AI crawlers and search engines"
- [ ] AI クローラーが目立つ場合は **AI bots managed ruleset を `log` モードで有効化**して実態を測る。
      デフォルトは無効(ダッシュボード表記は "Allow")。ブロックせず計測だけできるので
      まず log から入り、必要になってから `deny` を検討する
- [ ] Observability Plus(Paid Pro / Enterprise)を使える場合は、
      bot カテゴリでの絞り込み・個別 bot のメトリクス・クエリビルダーでの集計が追加で使える

注意: **Bot protection managed ruleset**(非ブラウザ的クライアントに JS チャレンジを出す方)は
`challenge` モードにすると Phase 1 の curl 検証や Playwright の E2E が弾かれる可能性がある
(公式ドキュメントが "prevents requests that falsely claim to be from a browser such as a `curl`
request identifying as Chrome" と明記)。こちらもデフォルト無効("Off")。

参考:

- https://vercel.com/docs/observability/insights
- https://vercel.com/docs/bot-management

## 残タスク(別 Issue 推奨)

- [ ] `/votes` の同一パターン(`src/routes/votes/+page.server.ts:20-22`)の修正 — 同じバグが潜在。
      `setHeaders` を使うルートは `/problems` と `/votes` の 2 つのみ(grep 確認済み)
- [ ] `Vary: Cookie` による匿名 CDN キャッシュ再導入 — **実質的に見送り**(2026-07-19 の実測を受けて降格)。
      アプリ全体で Edge Requests 25k・検証済み bot 4% という規模では、
      Vary を入れて救えるトラフィック(Cookie を持たない層)がごくわずかで、複雑さに見合わない。
      以下は当時の技術的評価として残す。
      正しさは担保されるが、GA Cookie による断片化で再訪問の匿名ユーザーぶんの HIT を失う
      (bot・初回訪問者ぶんは残る)。着手するなら先に「匿名トラフィックのうち
      Cookie を持たないリクエストの割合」を計測し、割に合うか判断すること。
      計測手段は「デプロイ後の負荷観測」の Edge Requests タブがそのまま使える
      — bot はまさに Cookie を持たない層なので、その内訳が
      「`Vary: Cookie` を入れても HIT が残る割合」の近似になる。
      現時点では関数実行コストが問題になっていないため YAGNI
