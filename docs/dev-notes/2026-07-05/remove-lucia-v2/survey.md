# lucia v2 剥がし: 影響範囲調査と互換性維持移行計画

> **For agentic workers:** 実装開始にはユーザーの明示的な同意が必要(計画承認 ≠ 実装開始)。実装時は superpowers:executing-plans または superpowers:subagent-driven-development を使用。

**Goal:** EOL となった `lucia@2.7.7` + `@lucia-auth/adapter-prisma@3.0.2` を、**DB マイグレーションゼロ・既存パスワード/ログイン中セッション完全互換**で自前セッション実装に置換し、Prisma 本体アップデート(5.22 固定の解消)のブロッカーを除去する。

**関連:** [lucia deprecation 告知](https://github.com/lucia-auth/lucia/discussions/1707) / [#682](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/682)(lucia は対象外と明記 → 本作業は**新規 issue を作成**して #682 から参照) / 移行参考例: [the-road-to-next-app#9](https://github.com/rwieruch/the-road-to-next-app/pull/9)

---

## 調査結果(影響範囲)

lucia API の呼び出しは**実質 7 ファイルに集約**されており、影響範囲は限定的。

| ファイル                                   | 使用 API                                                                                              |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `src/lib/server/auth.ts`                   | `lucia()` 初期化(prisma adapter, sveltekit middleware, getUserAttributes)                             |
| `src/hooks.server.ts`                      | `auth.handleRequest(event)` → `locals.auth` / `validate()`                                            |
| `src/app.d.ts`                             | `Locals.auth: import('lucia').AuthRequest`、`Lucia` namespace                                         |
| `src/routes/(auth)/signup/+page.server.ts` | `createUser` / `createSession` / `setSession` / `LuciaError`(AUTH_DUPLICATE_KEY_ID)                   |
| `src/routes/(auth)/login/+page.server.ts`  | `useKey` / `createSession` / `setSession` / `LuciaError`(AUTH_INVALID_KEY_ID / AUTH_INVALID_PASSWORD) |
| `src/routes/(auth)/logout/+page.server.ts` | `invalidateSession` / `setSession(null)`                                                              |
| `src/routes/users/edit/+page.server.ts`    | `setSession(null)`(アカウント削除後)                                                                  |
| `prisma/seed.ts`                           | `generateLuciaPasswordHash`(`lucia/utils`)                                                            |

- `locals.auth.validate()` の呼び出しは約 25 ファイルにあるが、大半は `getLoggedInUser` / `validateAdminAccess` 等のサービス層ガード(`src/features/auth/services/`)経由。**locals API の形状を維持すればこれらは全て無変更**
- 未使用 API: `deleteUser` / `updateKeyPassword` / `createKey` / `invalidateAllUserSessions` / OAuth / 2FA / パスワードリセット → 再実装不要
- アカウント削除は `db.user.delete` + `onDelete: Cascade` で lucia 非依存(変更不要)
- ユニットテストは lucia 本体でなく `locals.auth.validate` をモック → **形状維持ならテストも無変更**
- E2E(signin / redirect_after_login / user_edit 等)はシードユーザーで実ログイン → そのまま回帰安全網になる

### prisma adapter の実装調査(2026-07-11 追記)

`@lucia-auth/adapter-prisma@3.0.2`(`dist/prisma.js`、実質 230 行)を全読し、lucia core の呼び出しと突き合わせた結果、**adapter は隠れたロジックゼロの薄い CRUD ラッパーで安全に剥がせる**と確定。暗号処理・状態・独自スキーマ要求は一切なし。

全 15 メソッド中、本アプリのホットパスに乗るのは 7 つのみ:

| アプリの呼び出し箇所                         | lucia core 経由で呼ばれる adapter メソッド                          |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `locals.auth.validate()`(hooks 全リクエスト) | `getSession` → `getUser`(2 クエリ)、idle 延長時のみ `updateSession` |
| signup `createUser`                          | `setUser(user, key)` — `$transaction` で user + key 同時 create     |
| signup/login `createSession`                 | `getUser` + `setSession`(並列)                                      |
| login `useKey`                               | `getKey`                                                            |
| logout `invalidateSession`                   | `deleteSession`                                                     |

未使用: `deleteUser` / `updateUser` / `getSessionsByUserId` / `deleteSessionsByUserId` / `setKey` / `deleteKey` / `deleteKeysByUserId` / `updateKey` / `getKeysByUserId`。

adapter が担う「CRUD 以外」の責務は 3 つだけで、全て自前実装で吸収可能:

1. **BigInt → Number 変換**(`transformPrismaSession`): schema の `active_expires` / `idle_expires` は `BigInt` 型。Prisma の読み取りは `bigint` を返すため、自前 `validateSession` でも `Number()` 変換してから期限比較が必要。書き込みは lucia core が Number をそのまま渡しており(prod で実証済み)、ms epoch は 2^53 未満なので精度問題なし
2. **Prisma エラー → LuciaError 変換**:
   - `P2002`(setUser)→ `AUTH_DUPLICATE_KEY_ID`。ただし変換条件は ``message.includes('`id`')`` の部分一致のみで、`username` 列の P2002 は生の Prisma エラーのまま素通し。signup ルートは既に両方を catch している(`signup/+page.server.ts:68-69`)ため、Phase 4 の「P2002 ハンドリングに一本化」で完全にカバーされる
   - `P2025`(deleteSession)→ **握りつぶし**。⚠️ logout ルートは catch なしで `invalidateSession` を呼ぶため、二重ログアウト等で行が既に無い場合、自前実装でも P2025 を握りつぶさないと 500 になる(Phase 2 に反映済み)
   - `P2003`(setSession)→ `AUTH_INVALID_USER_ID`。signup では user 作成直後にセッション作成するため実質発生不能。再現不要
3. **モデル名・列名のハードコード**(`client["user"]` / `user_id` / `hashed_password` 等): schema が snake_case に固定されている根本原因。剥がせば命名自由になるが、本移行は互換最優先でスキーマ無変更

補足: adapter は `getSessionAndUser`(session + user の 1 クエリ取得)を未実装のため、現行 validate はコールドパスで毎回 2 クエリ。自前実装で `include: { user: true }` にすれば 1 クエリに減らせる(挙動不変の最適化・任意)。

## 互換性判定: 完全互換で剥がし可能(根拠は実測値)

node_modules の lucia 2.7.7 実装を直読して以下を確定した。全て標準 `node:crypto` で再現可能(デプロイ先は Vercel serverless = Node ランタイム)。

### パスワードハッシュ(`lucia/dist/utils/crypto.js`)

- 形式: `s2:{salt}:{hash}`。salt = 16 文字 `[a-z0-9]`、hash = scrypt(**N=16384, r=16, p=1, dkLen=64**) の hex
- 入力は **NFKC 正規化**(`password.normalize('NFKC')`)、比較は constant-time(lucia は手書き XOR ループ。`timingSafeEqual` で置換する場合は**長さ不一致で throw するため事前の長さチェック必須**)
- 旧 2 パート形式 `{salt}:{hash}`(lucia v1 由来、r=8)フォールバック: **実装しない**。git 履歴確認(ffe902d8、2023-09-20 の初回導入コミット)で本プロジェクトは lucia `^2.6.0` から開始しており、v1 形式ハッシュは prod に存在し得ない(2026-07-05 レビューで削除決定)
- bcrypt 形式(`$2a` 始まり、v2 beta 期のみ)は lucia が `AUTH_OUTDATED_PASSWORD` を throw(login では 500 応答)するが、自前実装では**未知形式として false を返す**(400 のログイン失敗に統一。互換の唯一の意図的逸脱、実害なし)
- ⚠️ `node:crypto` の `scrypt` は要 `maxmem` 指定(128×N×r = 32MiB が既定上限に抵触。**64MiB を明示**)

### セッション(`lucia/dist/auth/index.js`, `request.js`)

- ID: 40 文字ランダム `[a-z0-9]`、`session` テーブルに**平文**保存(トークンハッシュ化なし)
- 期限: `active_expires` = 発行 +24h、`idle_expires` = active +14 日(ms epoch, BigInt)
- 検証: idle 超過 → 無効(**行削除なし**・cookie クリアのみ。期限切れ行は DB に残留する — v2 は v1 の autoDatabaseCleanup を廃止済み)/ active 内 → 有効(書き込みなし)/ idle 内 → **同一 ID のまま期限を延長**(UPDATE のみ。ID ローテーション無し)。延長時、`AuthRequest.setSession` は同一 ID のため early return し **cookie は再セットされない** → cookie の Expires は発行時の idle_expires で固定(= 継続利用でも発行から最長 15 日でブラウザ側 cookie が消え再ログイン)。**この 2 点とも v2 の実挙動どおり再現する**(2026-07-05 レビューで決定。行削除・cookie 延長は挙動変更となるため見送り、残課題へ)
- リクエスト内キャッシュ: `validate()` は同一リクエストで 2 回目以降キャッシュを返す(hooks + ルートの二重呼び出しで DB を 2 度叩かない)

### Cookie(`lucia/dist/auth/cookie.js`)

- 名前 `auth_session` / 値 = セッション ID / `path=/`, `httpOnly`, `sameSite=lax`, `secure`(PROD のみ) / `expires` = idle_expires(永続 cookie)

### その他

- ユーザー ID: `createUser` が 15 文字ランダム `[a-z0-9]` を生成 → 同形式を踏襲
- Key: `key.id` = `username:{小文字化ユーザー名}`、`hashed_password` 列 → テーブル・形式そのまま使用
- CSRF: lucia の origin チェックは SvelteKit 標準の `checkOrigin`(既定有効・無効化されていないことを確認済み)が同等機能を提供 → 削除して安全。補強確認: `+server.ts` に POST/PUT/PATCH/DELETE はゼロ(全て GET)のため、保護対象はフォーム action のみ = checkOrigin の守備範囲に完全に収まる

**結論: schema.prisma・migration・cookie 名・ハッシュ形式・セッション行を一切変えずに剥がせる。デプロイしてもユーザーは誰もログアウトされず、パスワードもそのまま通る。**

## 設計方針(ユーザー決定事項)

1. **移行先 = 自前セッション実装・スキーマ無変更**(lucia 作者公認の後継パターン。`sv create` の「lucia」テンプレートもライブラリ非依存の同方式)
2. **既存ログイン中セッションは完全維持**(v2 の active/idle 二重期限セマンティクスを再現)
3. **scrypt 互換を継続**(新規ユーザーも `s2:` 形式。追加依存ゼロ、DB 内ハッシュ形式が単一)
4. **Prisma 本体アップデートは別 PR**(本移行は「挙動不変で剥がす」に限定)
5. **locals API は同形状を維持**(`locals.auth = { validate, setSession }`。呼び出し側約 25 ファイル+テストは無変更。validate 戻り値の実利用フィールドは `sessionId` / `user.userId` / `user.username` / `user.role` のみと grep で全数確認済み)
6. **新規 issue を作成**して管理(#682 から参照)
7. **期限切れセッション行は削除しない**(v2 実挙動どおり。掃除は残課題)
8. **idle 延長時に cookie は再セットしない**(v2 実挙動どおり。cookie 期限延長は残課題)
9. **旧 2 パート形式フォールバックは実装しない**(v2.6 開始のため対象ハッシュが存在し得ない。`s2:` のみ検証、未知形式は false)
10. **bcrypt `$2a` は false 返し**(500 → 400 の意図的逸脱として明記)

### oslo / @oslojs の採用評価(不採用)

- `oslo` パッケージ本体は **2025-01 に deprecated**(後継は `@oslojs/*`)
- `@oslojs/crypto`(1.0.1, 最終更新 2024-09)は sha/hmac/ecdsa 等の「ランタイム非依存プリミティブ」で、**scrypt を含まない** → 本件のハッシュ互換には使えない
- `@oslojs` の存在意義は `node:crypto` が無いエッジランタイム向け。本プロジェクトは Node ランタイムなので `node:crypto`(scrypt / randomBytes / timingSafeEqual / sha256 全部入り)で完結
- sv テンプレートが `@oslojs/crypto` を使うのは「セッショントークンを sha256 でハッシュ化して保存する」新方式のため。本件は lucia v2 の平文 ID 形式を維持するので不要
- → **依存ゼロが本移行の目的に最も整合**。将来トークンハッシュ化等の強化をする場合も `node:crypto` で足りる

## 却下した代替案

1. **新スキーマへ刷新**(the-road-to-next#9 の完全踏襲: token ハッシュ保存 + key 廃止): DB 破壊的変更+データ移行が必要で「互換最優先」に反する。終着点の綺麗さより安全性
2. **別ライブラリ(better-auth / Auth.js)**: 独自スキーマ強制で破壊的変更が不可避。username+password のみの要件に過剰。「ライブラリ作者都合の EOL」リスクを再び抱える
3. **argon2 への lazy 移行**: 二重検証パス+依存追加+移行状態の混在。scrypt は OWASP 許容関数であり現時点で YAGNI(将来必要なら検証側の形式分岐に追加するだけ)
4. **locals.session/user 式への再設計を同時実施**: ルート約 25 ファイル+テストの大量修正が最高リスク PR に混入する。必要なら後続の独立リファクタとして起案

## フェーズ計画

各フェーズで `pnpm test:unit` / `pnpm check` / `pnpm lint` / `pnpm build` 全通過を維持。1 ブランチ 1 PR(フェーズはコミット単位)。

### Phase 1: 互換性フィクスチャ + パスワードユーティリティ(TDD)

- **lucia が残っているうちに** `generateLuciaPasswordHash` で既知パスワード(シードの `Ch0kuda1` 等)のハッシュを生成し、テストフィクスチャとして固定(互換性の錨)
- `src/lib/server/password.ts`(新規): `hashPassword` / `verifyPassword`。`s2:` 形式再現(NFKC / N=16384, r=16, p=1, dkLen=64 / maxmem 64MiB / `timingSafeEqual`(長さ不一致は事前チェックで false))。**`s2:` 以外の形式(旧 2 パート・bcrypt `$2a` 含む)は一律 false**
- テスト: 自己ラウンドトリップ + **lucia 生成フィクスチャの検証一致** + 不一致/形式不正(2 パート・`$2a`・空文字)の拒否

### Phase 2: セッションサービス(TDD)

- `src/lib/server/session.ts`(新規): `createSession(userId)` / `validateSession(sessionId)` / `invalidateSession(sessionId)` + cookie 生成ヘルパー。v2 セマンティクス(24h/14d、idle 内は同一 ID で延長=UPDATE のみ、**idle 超過は null 返しのみで行削除しない**)と cookie 属性を上記実測値どおり実装
- **BigInt 変換**: `active_expires` / `idle_expires` は Prisma が `bigint` で返すため、期限比較の前に `Number()` 変換必須(書き込みは Number のままで可 — 現行 adapter と同じ)
- **`invalidateSession` は P2025 を握りつぶす**(logout の冪等性。現行 adapter の deleteSession と同挙動。logout ルートは catch なしで呼ぶため、握りつぶさないと二重ログアウトで 500)
- テスト: `vi.mock('$lib/server/database')` で active(書き込みなし)/ idle 延長(UPDATE のみ・DELETE なし)/ 期限切れ(null 返し・**DELETE が呼ばれないことを検証**)/ 行なし の 4 状態を網羅。時刻は `vi.useFakeTimers`。加えて **invalidateSession の P2025 握りつぶし**と **BigInt を返す mock での期限比較**(Number を返す mock だと変換漏れを見逃す)を含める

### Phase 3: locals.auth 互換オブジェクト + hooks + 型

- `src/lib/server/auth.ts` に `createAuthRequest(event)` を**追加**: `{ validate, setSession }` を返す(validate はリクエスト内キャッシュ付き)。**lucia の `auth` export はこの時点では削除しない**(signup / login / logout ルートが Phase 4 まで使用。消すと本フェーズのコミットで `pnpm check` / `build` が落ちる)
- 返すセッション形状は現行利用箇所に合わせ `{ sessionId, user: { userId, username, role } }` を維持。**無効セッション時は cookie クリア、idle 延長時は cookie を触らない**(v2 の `storedSessionId === sessionId` ガードと同挙動)
- Phase 3〜4 の間は lucia の `createSession` が返す Session オブジェクトが自前 `setSession` に渡るため、cookie 生成は `sessionId` と `idlePeriodExpiresAt`(Date)のみ参照する(Phase 2 の自前セッションにも同名フィールドを持たせて Phase 4 の差し替えを無変更にする)
- `src/hooks.server.ts`: `auth.handleRequest(event)` → `createAuthRequest(event)` に差し替え(以降のロジック不変)
- `src/app.d.ts`: `Locals.auth` の型のみ `import('lucia').AuthRequest` → 自前型に置換。**`Lucia` namespace と `/// <reference types="lucia" />` は削除しない**(lucia インスタンスの型解決に必要。削除は Phase 4)
- サービス層ガード・ルート約 25 ファイルは**無変更**であることを test:unit で確認

### Phase 4: 認証ルート置換 + seed 置換 + 依存削除

- signup: `auth.createUser` → `prisma.$transaction`(user + key 作成。userId は 15 文字 `[a-z0-9]`、key.id は `username:{小文字}`)。重複は既存の P2002 ハンドリングに一本化(`LuciaError` 分岐削除)。**ユーザー向けメッセージは現行文言を厳守**(E2E が文言依存)
- login: `auth.useKey` → key 取得 + `verifyPassword`。エラーメッセージ・挙動(キー無し/パスワード不一致を同一応答にしている現行仕様)を維持
- logout: `invalidateSession`(行削除)+ cookie クリアヘルパーへ置換
- users/edit(アカウント削除): **cookie クリアのみ**(session 行は `user.delete` の `onDelete: Cascade` で消えるため `invalidateSession` は呼ばない — 調査結果表のとおり現行も `setSession(null)` のみ)
- `prisma/seed.ts`: `generateLuciaPasswordHash` → 自前 `hashPassword`(seed からの import は `$lib` alias 不可のため相対パス。tsx 実行で通ることを確認)
- `src/lib/server/auth.ts` の lucia 初期化 export 削除、`src/app.d.ts` の `Lucia` namespace / `/// <reference types="lucia" />` 削除(Phase 3 から繰り延べた分)
- `package.json` から `lucia` / `@lucia-auth/adapter-prisma` 削除 → `pnpm install` → リポジトリ全体 grep で残存 import ゼロ確認(コメント内の言及も棚卸し)

### Phase 5: 検証 + 仕上げ

- `pnpm test:e2e` 全通過(signin / signup 系 / redirect_after_login / user_edit / votes / workbooks)
- **セッション継続の実機確認**: 移行前コードで dev 起動 → ログイン → cookie 保持のまま移行後コードで再起動 → ログイン状態が維持されること
- **パスワード互換の実機確認**: 移行前に作成したユーザー(シード含む)で移行後にログイン成功すること
- `pnpm format` → `coderabbit review --plain` → critical/high/medium 所見を本ファイル `## CodeRabbit Findings` に記録(修正はユーザー判断)

## リスクと対策

| リスク                                                  | 対策                                                                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| scrypt パラメータの再現ミス → 全ユーザーログイン不能    | Phase 1 の lucia 生成フィクスチャ照合テストで機械的に担保。maxmem 未指定エラーはテストで即検出                     |
| セッション期限判定の再現ミス → 意図しない一斉ログアウト | Phase 2 で 4 状態を fake timer で網羅。Phase 5 で実機のセッション継続確認                                          |
| CSRF 保護の喪失                                         | SvelteKit `checkOrigin`(既定有効)が同等機能を提供済みであることを確認済み。無効化しないこと                        |
| 本番デプロイ後の障害                                    | DB 変更ゼロのため**ロールバック = 直前リリースへの再デプロイのみ**で完結(切り戻し容易性が本方式の最大の利点)       |
| ~~prod に lucia v1 時代の旧形式ハッシュが残存~~         | **解消済み**: git 履歴(ffe902d8)で lucia `^2.6.0` からの開始を確認 → v1 形式は存在し得ず、フォールバック自体を削除 |

## 残課題(本移行に含めない後続作業)

- Prisma 5.22 → 6/7 アップデート(本移行完了で解禁。別 issue / 別 PR)
- **期限切れセッション行の掃除**(v2 は削除しないため現行 prod にも死に行が蓄積中。定期削除 or 検証時削除を別途検討)
- **idle 延長時の cookie 期限延長**(v2 は再セットしないため継続利用でも発行から最長 15 日で要再ログイン。延長するとセッション寿命が実質無期限化するためトレードオフ判断が必要)
- `locals.session` / `locals.user` 式への locals API 再設計(任意。full-codebase-refactoring 計画との整合を取って起案)
- `key` テーブル廃止・`user` へのパスワード列統合等のスキーマ整理(任意。互換要件が解けた後)
- パスワードリセット機能(別 PR。下記補遺参照)

## QA: 理解確認と批判的レビュー(2026-07-15 追記)

ソース根拠: `lucia/dist/auth/index.js` / `lucia/dist/utils/crypto.js` / `@lucia-auth/adapter-prisma/dist/prisma.js`。

- **呼び出しチェーン**: `app → lucia core(公開 API)→ adapter(CRUD)` で正しい。例: `auth.createUser` は core 側で userId 生成(15 文字)+パスワードハッシュ化を行い、`adapter.setUser(user, key)` に渡す(`auth/index.js:160-180`)。通常の利用では意識不要だが、剥がしでは **core のロジックと adapter の CRUD の両方**を自前実装が吸収する(Phase 4 で 2 層を Prisma 直呼びに畳む)
- **メソッド名の差異(createUser vs setUser)**: 名前衝突の回避ではなく**レイヤ分離**。公開 API はドメイン語彙(create / use / invalidate)、adapter インターフェースは全 DB アダプタ共通のストレージ語彙(get / set / update / delete)。公開 1 メソッドが adapter 1〜n 呼び出しに対応する(createSession → getUser + setSession)
- **salt**: パスワードごとに生成するランダム値(16 文字 `[a-z0-9]`)で、ハッシュ入力に混ぜる。目的は「同じパスワードでも毎回異なるハッシュ」にしてレインボーテーブル(事前計算)攻撃を無効化すること。**秘密ではない**ため `s2:{salt}:{hash}` に平文で埋め込まれる。ユーザー間の一意性保証は不要(十分ランダムであればよい)
- **暗号化ではなくハッシュ(一方向)**: 復号は存在しない。検証は「入力パスワード + 保存済み salt で scrypt を再計算 → 保存済みハッシュと定数時間比較」
- **NFKC 正規化**: 同じ見た目の文字列でも Unicode 表現が複数あり得る(全角/半角、合成/分解済み文字)ため、バイト列を一意化してからハッシュする。実務上の含意は 1 つ: **自前 verify でも必ず正規化する**(漏れると非 ASCII パスワードが照合不能になる)。**(2026-07-15 補正)** `authSchema` のパスワード規則は初回実装(2023-09)から半角英数字限定のため、非 ASCII パスワードは prod のハッシュにも login 入力にも存在し得ない(signup / login とも zod 検証後に crypto 層へ到達)。normalize は実害回避ではなく**アルゴリズム忠実性(lucia 等価)の担保**として維持する
- **scrypt パラメータ**: scrypt は決定的アルゴリズム(RFC 7914)。同一入力 + 同一 (N, r, p, dkLen) なら出力は**バイト単位で一致する(「可能性が高い」ではなく保証)**。リスクは自前実装側のミス(node:crypto のパラメータ名対応、maxmem、hex 変換、NFKC 漏れ)に集中し、Phase 1 のフィクスチャテストはそれを機械検出する仕組み。担保するのは「冪等性」ではなく**互換性(等価性)**。salt がランダムなため生成ハッシュ同士の直接比較はできず、「lucia 生成ハッシュを自前 verify が受理する」形で検証する(固定 salt の hex 直接比較テストを足すとさらに強い)
- **セッション ID の平文保存**: ID は 40 文字ランダム(約 207 bit)のサーバ生成トークンで、低エントロピーかつ使い回されるパスワードとは脅威モデルが異なるため平文でも許容範囲。残るリスクは「DB 読み取り漏洩 → セッション乗っ取り」で、新方式(sv テンプレート等)が sha256 保存するのはこのため。ただし**トークンハッシュ化は後からでも無停止で移行可能**(既存行を一括ハッシュ化しても cookie は平文トークンのままで、検証側がハッシュして照合すればよい)。「互換性のため永久に仕方ない」ではなく「本移行では挙動不変を優先して見送り」が正確
- **bcrypt `$2a`**: 本プロジェクト導入前の仕様ではなく、**lucia 自身の v2 beta 期の遺物**(crypto.js に `TODO: remove in v3` 付きでガードが残る)。本プロジェクトは stable `^2.6.0` 開始のため該当ハッシュは存在し得ない。「対処しておく」というより、自前 verify の自然な設計(未知形式 → false)が到達不能ケースを覆うだけ。500 → 400 は唯一の意図的逸脱として記録済み
- **フェーズ理解の補正**: Phase 2 は新規サービスの作成 + テストのみで**配線はしない**(validate 系の切替は Phase 3、create/invalidate 系は Phase 4)。lucia と adapter の依存削除は Phase 4 の完了後ではなく **Phase 4 の内部タスク**。Phase 5 が E2E + 実機確認(セッション継続・パスワード互換)
- **⚠️ Phase 3 の順序問題(レビュー指摘・要修正)**: Phase 3 時点では signup / login / logout ルートがまだ lucia の `auth` インスタンス(`createUser` / `useKey` 等)を使うため、`auth.ts` の lucia 初期化 export と `app.d.ts` の `Lucia` namespace は **Phase 4 完了まで削除できない**(消すと Phase 3 コミットで `pnpm check` / `build` が落ちる)。対応案: (i) Phase 3 は `createAuthRequest` を**追加**して hooks を差し替えるに留め、lucia export と型削除を Phase 4 に移す(推奨)、(ii) Phase 3+4 を 1 コミットに統合 → **(i) を採用しフェーズ本文修正済み(2026-07-15)**

---

## 補遺: パスワードリセット機能の追加容易性(批判的レビュー・2026-07-05)

**問い:** lucia 剥がしが成功すれば、パスワードリセット追加は「比較的容易」と考えてよいか?

**回答: 半分正しい。** 剥がしは前提整備として有効だが、リセットの主障壁はもともと lucia ではない。難所は「本人確認チャネル」と「トークン基盤+レート制限」で、これらは剥がし後も丸ごと残る。ただし本プロジェクト固有の事情(後述の AtCoder 連携チャネル)を使う設計なら「比較的容易」評価は妥当。

### 剥がしが効く部分(正の効果)

- Phase 1-2 で作る `hashPassword` / セッションサービスがそのまま再利用でき、パスワード更新は `key.hashed_password` の UPDATE 1 本 + 全セッション削除(`deleteMany`)1 本で完結する
- EOL ライブラリの上に新機能を積まずに済む(先に剥がす順序判断自体は正しい)
- トークンテーブル等のスキーマ設計が lucia アダプタの命名制約から自由になる(schema.prisma の方針どおり新規モデルは camelCase で書ける)

### 剥がしでは解決しない部分(過大評価に注意)

1. **本人確認チャネルが存在しない(最大の障壁)**: `User` に email 列がない(username + password のみ)。標準的なリセットフロー(メールでトークン送付)は前提から成立しない。なお公平を期すと、lucia v2 にも `updateKeyPassword` / `invalidateAllUserSessions` はあったため「lucia が邪魔でリセットを作れなかった」わけではない — 障壁は当初からチャネル側にある
2. **トークン基盤は自作が必要**: 公式学習リソース(lucia-auth.com)と [The Copenhagen Book](https://thecopenhagenbook.com/password-reset) の要件 — 十分なエントロピーの乱数トークン、**保存前に SHA-256 でハッシュ化**、有効期限 ~1h(最大 24h)、使い捨て(成功時削除)、**リセット成功時に当該ユーザーの全セッション無効化**、トークンを含むパスへの `Referrer-Policy: strict-origin`、ユーザー列挙を防ぐ曖昧な応答文言。新テーブル + migration が必要(追加のみで非破壊)
3. **レート制限基盤が現状ない**: Copenhagen Book は発行エンドポイントへの厳格なレート制限を必須としている。Vercel serverless ではインメモリ制限が効かないため、DB ベースの token bucket 等の新規実装になる

### 本人確認チャネルの選択肢(実装コストの支配項)

| 案                         | 概要                                                                                                                                                                                            | コスト     | 備考                                                                                                                                                                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (a) email 基盤導入         | email 列(既存ユーザーは NULL)+ 確認フロー + 送信プロバイダ + 到達性運用                                                                                                                         | **大**     | 標準的だが基盤導入が本体。「比較的容易」ではない                                                                                                                                                                                                                                             |
| (b) AtCoder 連携で本人確認 | 既存の `AtCoderAccount`(handle / isValidated / validationCode)検証機構を再利用し、**事前に検証済みの連携**がある場合のみ、AtCoder プロフィール等に新規コードを設置させて本人確認 → リセット許可 | **小〜中** | email 不要・本サービスの利用者特性に合致。制約: 未連携ユーザーは対象外。リスク: AtCoder アカウント侵害 = 本サービス乗っ取り(全セッション無効化とセットで許容範囲か要判断)。**必ず事前検証済み連携に限定**(リセット時に初回連携を許すと、handle を主張するだけで未連携アカウントを乗っ取れる) |
| (c) 管理者手動リセット     | 現行の「X DM → アカウント移行」を「X DM → ワンタイムリセットリンク/仮パスワード発行(admin 画面)」に置換                                                                                         | **最小**   | 人手プロセスは残るが、移行(回答履歴の付け替え)より運用負荷が大幅に軽い。(b) の対象外ユーザーの受け皿としても機能                                                                                                                                                                             |

現状の回復手段は「X 公式アカウントへ DM → 管理者がアカウント移行」(`forgot_password/+page.svelte`、`(admin)/account_transfer`)であり、ページには「パスワードリセット機能は開発中です」と明記済み。同ページは lucia 公式の [example-sveltekit-email-password-2fa](https://github.com/lucia-auth/example-sveltekit-email-password-2fa) を既にコメント参照している(= email 前提の案 (a) を想定した形跡)。

### 結論

- 「剥がし成功 → リセット容易」の因果は**部分的**。剥がしで得るのは再利用可能な password/session ユーティリティと負債の上積み回避であり、リセット固有の難所(チャネル・トークン・レート制限)は別途残る
- チャネルに **(b) + (c) の併用**(検証済み連携ユーザーはセルフサービス、それ以外は管理者発行)を選ぶなら「比較的容易」は妥当: 新テーブル 1 つ + サービス層 + ルート 2 つ + 既存検証機構の再利用で収まり、email 基盤が不要
- **(a) email 基盤を選ぶ場合、「容易」ではない**。email 導入自体が独立した中規模プロジェクト(スキーマ・確認フロー・プロバイダ選定・運用)になる
- いずれの案でも着手は lucia 剥がし完了後(Phase 1-2 の成果物に依存)。チャネル選択はユーザー判断が必要な設計分岐点
