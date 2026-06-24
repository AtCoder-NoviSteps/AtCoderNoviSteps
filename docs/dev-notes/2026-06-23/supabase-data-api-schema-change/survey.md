# Supabase セキュリティ調査メモ

## 1. Supabase Data API × public スキーマ変更（2026年）

### 変更内容

Supabase が 2026年5月30日より、新規プロジェクトにおいて `public` スキーマのテーブルを Data API に自動公開しない挙動をデフォルトとした。

```
2026-05-30 : 新規プロジェクトのデフォルト変更
2026-10-30 : 既存プロジェクトにも適用
```

従来は `public` スキーマにテーブルを作成すると `anon` / `authenticated` / `service_role` に対して SELECT/INSERT/UPDATE/DELETE が自動 GRANT された。
変更後は明示的な GRANT なしでは PostgREST / GraphQL / supabase-js からアクセス不可（`42501` エラー）。

影響を受けるのは Data API（`/rest/v1/`、`/graphql/v1/`）経由のアクセスのみ。

### このプロジェクトへの影響

**影響なし。対応不要。**

- `package.json` に `@supabase/supabase-js` の依存なし
- `src/` 内に supabase-js / `/rest/v1/` / `/graphql/v1/` の呼び出し箇所なし（grep 確認済み）
- Prisma のみ使用（`DATABASE_URL` / `DIRECT_URL` による直接 PostgreSQL 接続）

---

## 2. アーキテクチャ：アクセス経路の整理

Supabase への接続経路は 2 つあり、全く別の回路。

```
インターネット
    │
    ├─ HTTP (port 443) ──→ PostgREST (Data API) ──→ PostgreSQL
    │                       /rest/v1/  /graphql/v1/
    │                       認証: anon キー（公開情報）
    │
    └─ TCP  (port 5432) ──────────────────────────→ PostgreSQL
                            直接接続
                            認証: ユーザー名 + パスワード（DATABASE_URL）
```

### TCP とは

TCP（Transmission Control Protocol）はデータをネットワーク上でやり取りするための通信プロトコル（ルール）の一種。HTTP もその上に乗っている低レイヤーの仕組み。「直接 TCP 接続」とは HTTP（Data API）を経由せず PostgreSQL と直接通信する経路を指す。TCP 自体はセキュリティの仕組みではなく、その先の PostgreSQL がパスワード認証でアクセスを制御する。

### このプロジェクトの接続構造

```
ブラウザ ──HTTP──→ SvelteKit サーバー ──Prisma──→ PostgreSQL
                   (+page.server.ts 等)    TCP接続    (DATABASE_URL)
```

- Prisma は完全にサーバーサイドで動く（ブラウザには出ない）
- PostgREST を一切経由しない
- `DATABASE_URL` / `DIRECT_URL` の変更・クエリパラメータ追加は不要

---

## 3. セキュリティ：デフォルト設定のリスクと本プロジェクトへの影響

### 「public スキーマは誰でも見られる」は事実か？

**条件付きで事実。リスクは実在する。**

Supabase プロジェクトには Data API エンドポイント（`https://<project>.supabase.co/rest/v1/`）が**デフォルトで起動・公開**される。`anon` キーはフロントエンドに埋め込む前提の公開情報（秘密ではない）。

既存プロジェクトでは `anon` ロールに public スキーマの全テーブルへの SELECT/INSERT/UPDATE/DELETE が自動 GRANT されている。RLS が無効（Table Editor の "unrestricted" 表示）の場合、anon キーさえあれば誰でも全データを読み書きできる。

```bash
# anon キーは公開情報なので、このコマンドは誰でも試せる
curl 'https://<project>.supabase.co/rest/v1/task' \
  -H 'apikey: <anon_key>'
```

### `schema: public` という名前はセキュリティと無関係

`public` はただの PostgreSQL のネームスペース名（歴史的なデフォルト）。「インターネット公開」を意味しない。`private` に変えてもセキュリティ上の効果はない。問題はスキーマ名ではなくアクセス経路。

### DATABASE_URL の秘匿化で直接 TCP 接続は防げる

`DATABASE_URL` にはホスト・ポート・ユーザー名・**パスワード**が含まれる。ポート 5432 はインターネットに公開されているが（誰でもドアをノックできる）、接続には有効な認証情報が必要。SvelteKit ではサーバーサイド環境変数として管理されブラウザに送られないため、DATABASE_URL が漏れない限り外部からの直接 TCP 接続は不可能。

### リスクマップ

| 攻撃経路                    | 現状                              | 対策後（Data API 無効化） |
| --------------------------- | --------------------------------- | ------------------------- |
| Data API (HTTP)             | リスクあり ⚠️                     | 消滅 ✅                   |
| 直接 TCP                    | DATABASE_URL 秘匿 → 実質不可能 ✅ | 変化なし ✅               |
| `schema: public` という名前 | 無関係                            | 無関係                    |

### 推奨対策：Data API を無効化する

公式ドキュメントが明言している: _"If you plan to solely use Prisma instead of the Supabase Data API (PostgREST), turn it off"_

**Supabase Dashboard → Project Settings → API → Data API を OFF**

| 項目                  | 影響                     |
| --------------------- | ------------------------ |
| ダウンタイム          | なし                     |
| Prisma / DATABASE_URL | 無影響                   |
| 再デプロイ            | 不要                     |
| 効果                  | 攻撃面ごと消える（最強） |

### 注意：DATABASE_URL 秘匿 ≠ アプリ全体が安全

「DATABASE_URL が安全 = 外部からの直接 DB アクセスは防げる」は正しい。ただしアプリ全体のセキュリティは別の話。

SvelteKit + Prisma モデルでは **SvelteKit サーバーが新たなセキュリティ境界**になる。

```
【supabase-js モデル】 DB の守護 = RLS（Supabase インフラが担保）
【SvelteKit + Prisma モデル】 DB の守護 = ルートハンドラの実装（開発者が担保）
```

ルートハンドラで認証チェックを忘れると、HTTP 経由で誰でもデータ取得できる。RLS が不要な理由は「サーバーが代わりに守るから」であり、そのサーバー実装の品質がセキュリティの要になる。

残る責任範囲：

| リスク                                | DATABASE_URL 秘匿で防げる？ | 実際の防御                 |
| ------------------------------------- | --------------------------- | -------------------------- |
| 外部から直接 TCP 接続                 | ✅                          | DATABASE_URL のパスワード  |
| Data API 経由の全件取得               | ✅（無効化で消える）        | Data API OFF               |
| ルートハンドラの認証バグ              | ❌                          | service 層の実装           |
| Prisma `$queryRaw` のインジェクション | ❌                          | 入力値の検証               |
| DATABASE_URL の git 流出              | ❌（自明）                  | `.gitignore` / `.env` 管理 |

---

## 4. 用語・概念整理

### GRANT と RLS の関係

二つは独立したレイヤー。どちらか一方を設定しても他方を補完しない。

| レイヤー | 制御対象                               | なければ                 |
| -------- | -------------------------------------- | ------------------------ |
| GRANT    | ロールがオブジェクトにアクセスできるか | `42501` エラー           |
| RLS      | ロールが見られる行はどれか             | GRANT があれば全行見える |

- Data API を公開する場合: GRANT + RLS 両方が必要
- Prisma 経由（`postgres` / `service_role` ロール）: `BYPASSRLS` 権限を持つため RLS の制約を受けない

### Table Editor の "unrestricted"

`schema: public`（テーブルが public 名前空間にある）とは別の概念。"unrestricted" は RLS が disabled であることを意味する。

### public を"private"相当にする操作（参考・今は不要）

操作Aと操作Bは全く異なる。

| 操作                                      | 内容                          | ダウンタイム       | Prisma 影響          | 再デプロイ |
| ----------------------------------------- | ----------------------------- | ------------------ | -------------------- | ---------- |
| **A: Exposed schemas から public を除外** | ダッシュボード設定変更のみ    | なし               | なし                 | 不要       |
| **B: テーブルを別スキーマへ物理移動**     | DDL + Prisma マイグレーション | テーブルロックあり | URL 変更・再生成必要 | 必要       |

このプロジェクトでは Data API を無効化すれば操作Aも不要。操作Bはやり過ぎ。

---

## アクションリスト

### TODO

- [x] Supabase Dashboard → Project Settings → API → Data API を OFF
- [ ] `+page.server.ts` / `+server.ts` の `load` 関数：認証チェックなしで全件返していないかレビュー
- [ ] API ルート（`+server.ts`）：未認証でアクセスできるエンドポイントがないかレビュー
- [ ] service 層：ユーザーが他ユーザーのデータを取れる経路がないかレビュー
- [ ] `$queryRaw` / `$executeRaw` 使用箇所：ユーザー入力の直接埋め込みがないか確認

### NOT TODO

- `schema: public` の変更（名前の問題ではない）
- RLS の設定（Data API を使わないなら不要）
- DATABASE_URL / DIRECT_URL の変更
- テーブルの別スキーマへの物理移動
- GRANT の明示的な設定

---

## 参考リンク

- [Breaking Change: Tables not exposed to Data and GraphQL API automatically](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
- [Using Custom Schemas | Supabase Docs](https://supabase.com/docs/guides/api/using-custom-schemas)
- [Securing your API | Supabase Docs](https://supabase.com/docs/guides/database/hardening-data-api)
- [Prisma | Supabase Docs](https://supabase.com/docs/guides/database/prisma)
- [Understanding API keys | Supabase Docs](https://supabase.com/docs/guides/api/api-keys)
- [Connect to your database | Supabase Docs](https://supabase.com/docs/guides/database/connecting-to-postgres)
