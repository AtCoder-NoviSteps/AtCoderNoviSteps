# Phase 3：problems 匿名レスポンスの CDN キャッシュ

## Context（背景・目的）

Vercel の Function Duration / Fast Origin Transfer が増加（親plan [docs/dev-notes/2026-06-13/sveltekit-caching/plan.md](../../2026-06-13/sveltekit-caching/plan.md) 参照）。
`/problems` 一覧は **匿名アクセス時はレスポンスが全員同一**（個人の解答状態を含まない）なので、CDN（Vercel Edge）にキャッシュさせれば bot/クローラー/未ログイン閲覧で**関数自体が起動しなくなり** Duration と Transfer を同時に削減できる。

ログイン時は解答状況がユーザー個別 → **絶対にキャッシュさせない**（漏洩リスク）。本 Phase は「匿名時のみ `Cache-Control` を付与」する1ファイル変更。

対象: [src/routes/problems/+page.server.ts](../../../../src/routes/problems/+page.server.ts)

## Cache-Control ディレクティブの意味（MDN準拠）

設定値: `public, max-age=0, s-maxage=300, stale-while-revalidate=600`

| ディレクティブ               | 対象         | 単位 | 意味                                                                                |
| ---------------------------- | ------------ | ---- | ----------------------------------------------------------------------------------- |
| `public`                     | 共有(CDN)    | —    | 共有キャッシュへの保存を明示許可。無いと CDN は個人向け扱いでキャッシュしない       |
| `max-age=0`                  | ブラウザ     | 秒   | ブラウザは毎回再検証（=ログイン後に匿名HTMLを再利用させない）。CDN は s-maxage 使用 |
| `s-maxage=300`               | **共有のみ** | 秒   | CDN 上で 300秒(5分) fresh。`max-age` を共有キャッシュで上書き                       |
| `stale-while-revalidate=600` | 共有(CDN)    | 秒   | s-maxage 失効後さらに 600秒(10分) は stale を即返ししつつ裏で再取得・更新           |

タイムライン: 0–300s=CDN即返し(関数ゼロ) / 300–900s=stale即返し＋裏で1回更新 / 900s以降=通常再取得。
→ 実効鮮度は最大15分弱。`max-age=0` を明示する根拠は下記「Vercel 公式挙動」参照。

出典: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control

### Vercel 公式挙動（確認済み 2026-06-14）

1. **swr の動作**: s-maxage 失効後、CDN は stale をエッジから即返ししつつ非同期でバックグラウンドに関数を呼び再検証する。最初の1回のみ同期、以降はキャッシュ即返し＋裏で再検証。swr 最大値は1年。
2. **🔴 重要: クライアントへのヘッダー削除**: `CDN-Cache-Control` を併用せず `Cache-Control` のみ設定した場合、Vercel は **`s-maxage` と `stale-while-revalidate` をエッジで消費し、ブラウザへ送るヘッダーから削除**する。よってブラウザの devtools には `public, max-age=0` しか見えない（本番/プレビュー）。キャッシュ動作の確認は **`x-vercel-cache`** で行う。ローカル `pnpm dev` は Vercel プロキシを通らないため、設定値がそのまま見える。
3. **`max-age=0` 明示の根拠**: 「全訪問者で同一のサーバーレンダリングページ」に対する Vercel 公式推奨は `max-age=0, s-maxage=N`。`max-age` 省略時のブラウザ・ヒューリスティックキャッシュ余地を排除し、CDN のみキャッシュ＋ブラウザは毎回再検証を確定させる。
4. **デフォルト値**: ヘッダー未設定時は `public, max-age=0, must-revalidate`（CDN・ブラウザともキャッシュしない）→ ログイン時は何も付けなければ自動的に非キャッシュ。

出典: https://vercel.com/docs/caching/cache-control-headers, https://vercel.com/docs/edge-network/caching

## 実装

### 変更1: `load` シグネチャに `setHeaders` を追加し、匿名時のみ付与

`load({ locals, url })` を `load({ locals, url, setHeaders })` に変更。
`session === null`（=匿名）かつ **vote stats の取得が成功した場合のみ** 付与する（degraded 応答をキャッシュ汚染させないため。下記「設計判断」参照）。

```typescript
export async function load({ locals, url, setHeaders }) {
  const session = await locals.auth.validate();
  // ...既存の params / isAdmin / isLoggedIn ...

  let voteResults = new Map();
  let voteStatsOk = true;
  try {
    voteResults = await getVoteGradeStatistics();
  } catch (error) {
    voteStatsOk = false;
    console.error('Failed to load vote statistics:', error);
  }

  // Anonymous responses are identical for all users and contain no per-user
  // answer state, so they are safe to cache at the CDN. Logged-in responses
  // are personalized and must never be shared-cached.
  // Skip caching a degraded response (vote stats failed) to avoid pinning a
  // broken page at the edge for the full TTL.
  if (session === null && voteStatsOk) {
    setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' });
  }

  // ...既存の return（tagIds 分岐含む）...
}
```

`setHeaders` は **return より前**・分岐の外で1回だけ呼ぶ。これにより `tagIds` あり/なし両方の匿名レスポンスがキャッシュ対象になる（どちらも匿名ではユーザー非依存）。

## 設計判断（レビュー指摘事項）

1. **degraded 応答はキャッシュしない**: 既存の try/catch は vote stats 失敗時に空 Map で描画継続する。これを匿名でキャッシュすると**一時障害の劣化ページが最大15分 CDN に貼り付く**。`voteStatsOk` フラグで成功時のみ付与。
2. **`tagIds` 分岐も対象**: フィルタ済みビューも匿名ではユーザー非依存なのでキャッシュ可。Vercel はクエリ文字列込みの URL 単位でキャッシュするため、tag の組合せごとにキー分裂しヒット率は下がるが安全性に問題なし。分岐の外で付与するだけで両対応。
3. **`max-age=0` 明示**: Vercel 公式推奨（同一ページは `max-age=0, s-maxage=N`）。ブラウザは毎回再検証＝CDN のみキャッシュ。「Vercel 公式挙動」参照。
4. **ヘッダー重複なし**: `setHeaders` は同一ヘッダー2回設定でエラーになるが、`+layout.server.ts` は session のみ返し cache-control を設定しないため衝突しない。
5. **POST action 非対象**: `setHeaders` は SSR(GET) の load でのみ有効。`update` / `voteAbsoluteGrade` action には影響しない。

## テスト

検証対象を「分岐ロジック（関数の挙動）」と「キャッシュ適格性（ワイヤー上の実契約）」に分離する。
前者はユニット（コロケーション）、後者は HTTP レスポンスを見る必要があるため E2E（`e2e/`）に置く。
ユニットは `setHeaders` が実際にヘッダーに乗るか（= SvelteKit 本体の挙動）や `set-cookie` 不在を**検証できない**点に注意。

### ① ユニット — 分岐ロジック（`src/routes/problems/+page.server.test.ts`）

`load()` を直接呼び、依存をモックして分岐を検証する。**価値の中心は負のケース**（ログイン時に共有キャッシュさせない＝個人情報漏洩防止のセキュリティ不変条件）。
正のケースは値調整で割れない緩いアサーションにする（完全一致は避ける）。

**注意: 本コードベースに route-load のユニットテスト・`setHeaders` 使用例ともに前例なし**（新パターンを敷く）。

モック対象:

- `$features/votes/services/vote_statistics` の `getVoteGradeStatistics`（成功=Map / throw の両系統）
- `$lib/services/task_results`（`getTaskResults` / `getTasksWithTagIds`）
- `locals.auth.validate`（null=匿名 / session オブジェクト=ログイン）
- `url`（`searchParams.get` が tagIds を返す/返さない）／`setHeaders` は `vi.fn()` スパイ

テスト名と検証ケース:

- `does not set cache-control for logged-in users` → ログイン時 `setHeaders` が**呼ばれない**（最重要・セキュリティ）
- `does not cache a degraded response when vote stats fail` → 匿名 + vote stats throw → `setHeaders` が**呼ばれない**
- `sets a public shared-cache header for anonymous users` → 匿名 + 成功 → `setHeaders` が1回、引数の `cache-control` が `public` と `s-maxage=300` を**含む**こと（緩いアサーション＝完全一致しない）

### ② E2E — キャッシュ適格性（`e2e/` に1本）

匿名で dev server に GET し、**ユニットでは見えない実契約**を確認する。

テスト名: `anonymous /problems response is cache-eligible (cache-control set, no set-cookie)`

- レスポンスに `cache-control` が付く（ローカルは Vercel 非経由のため `s-maxage` まで見える）
- **`set-cookie` ヘッダーが無い**（キャッシュ適格の本当の条件。ユニットでは auth モックにより検証不能）
- （任意）ログイン状態の同ページでは `cache-control` が**付かない**ことも併せて確認

## 検証（手動・デプロイ後）

1. `pnpm test:unit` でテスト通過。
2. **ローカル（`pnpm dev`、Vercel プロキシ非経由）**で匿名リクエストのヘッダーを確認:
   - `cache-control: public, max-age=0, s-maxage=300, stale-while-revalidate=600` がそのまま出る
   - **`set-cookie` が出ない**（出ると Vercel はキャッシュしない。クリーンな匿名リクエストで確認。古い無効 session cookie 保持時のみ Lucia がクリア用 Set-Cookie を出す稀な edge は許容＝その1リクエストだけ非キャッシュ）
3. ログイン状態で同ページを開き、`cache-control` が**付かない**（＝デフォルトの非キャッシュ）ことを確認。
4. **本番/プレビュー（Vercel 経由）**では `s-maxage`・`stale-while-revalidate` はエッジで削除されブラウザに見えない（公式挙動2）。キャッシュ動作は **`x-vercel-cache`**（`MISS`→`HIT`→失効後 `STALE`）で確認。`pragma: no-cache` 付きで同期再検証＝`REVALIDATED` も確認可。Vercel ダッシュボードで Duration / Fast Origin Transfer を 1〜2週間観測。

## 完了後

親 plan [docs/dev-notes/2026-06-13/sveltekit-caching/plan.md](../../2026-06-13/sveltekit-caching/plan.md) の Phase 3 セクションに完了マークと、判明した novel lesson（degraded 応答のキャッシュ回避、route-load テストの新規ハーネス）を反映する。
