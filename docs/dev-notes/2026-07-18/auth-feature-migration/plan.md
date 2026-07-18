# auth モジュールの features/auth への移行 + sample_data 削除

## Overview

PR #3864 で lucia v2 を自前 auth 実装に置換した。その実装のうち `src/lib/server/` に置かれた
`auth.ts` / `session.ts` / `password.ts` / `random.ts` は、importer 全数調査の結果 **auth ドメイン専用**
であることが確認された(hooks / (auth) ルート / `features/auth/services/credentials.ts` / `prisma/seed.ts` のみ)。
`docs/guides/architecture.md` の3層モデル「単一ドメインのコード → `features/{feature}/`」に従い、
`features/auth/server/` へ移行する(`votes/server/`・`workbooks/server/` の前例に準拠)。

`database.ts`(14+ サービスが依存する共有インフラ)と `tasks/cache.ts`(auth 無関係)は `lib/server/` に残す。

また `src/lib/server/sample_data.ts` はデッドコード確定(実参照ゼロ、唯一のヒットは
`TagListForEdit.svelte:17` のコメントアウト import)のため削除する。

## 設計根拠

- **移行先は `src/features/auth/server/`**: サーバ専用・非サービスコードの置き場として
  `votes/server/`・`workbooks/server/` の前例に一致。既存 `services/session.ts` との名前衝突も回避
- **ビルド時保護の実質維持**: `$lib/server/` を出ると SvelteKit のクライアント import 禁止は効かなくなるが、
  `session.ts`/`auth.ts` は `$lib/server/database` の推移的 import で保護が残り、
  `password.ts`/`random.ts` は `node:crypto`・サーバ文脈依存でクライアントビルド不可
- **名前衝突の解消**: 既存 `features/auth/services/session.ts`(redirect ガード)を
  `session_guards.ts` にリネームし、移行してくる `server/session.ts`(DB ライフサイクル)と区別

## 却下した代替案

1. **`services/session.ts` への統合**: redirect を throw するルートガードと framework 非依存の
   DB ライフサイクルで責務が別物。テストのモック戦略も別系統(`vi.mock('@sveltejs/kit')` vs
   `vi.mock('$lib/server/database')`)で、統合すると1ファイルに2系統のモックが同居する。
   さらに `server/auth.ts` → `validateSession` の依存が redirect/`buildLoginPath` を含む
   ルート向けモジュールへ向かい、レイヤ方向が逆転する
2. **`auth.ts`/`password.ts`/`random.ts` を `features/auth/utils/` へ**: auth.ts は cookie 書き込み
   (副作用)+ `RequestEvent` 依存で utils 規約「No side effects」違反。password.ts は `node:crypto`
   依存のサーバ専用 crypto で、クライアント importable な既存 utils(`buildLoginPath` 等)との同居は
   誤 import を誘発。random.ts のみ字面上は utils 適格(Web Crypto、副作用なし)だが、用途が
   ソルト・セッション ID 生成でクライアント実行の正当なユースケースがなく、消費者もサーバ側3つのみ。
   凝集性と YAGNI で server/ 同居とし、2ドメイン目の利用が現れた時点で `src/lib/utils/` へ抽出
3. **`*.server.ts` サフィックスでビルド時保護を完全維持**: ファイル名規約(snake_case 単純名)から逸脱し、
   既存 `votes/server/`・`workbooks/server/` の前例とも不揃い。推移的保護で実質十分と判断
4. **移行しない(`lib/server/` 維持)**: architecture.md 自体が `lib/server/auth.ts` を明記しており
   現状も文書上は正当化可能だが、3層モデル「単一ドメイン → features」との矛盾が残る

## 実装手順(低リスク → 高リスク)

### Phase 1: sample_data.ts 削除(独立コミット)

- [ ] `src/lib/server/sample_data.ts` を削除
- [ ] `src/lib/components/TagListForEdit.svelte:17` のコメントアウト import 行を削除
- [ ] Residual-Reference Sweep: `rg -ni 'sample_data' -g '*.ts' -g '*.svelte' -g '*.md'`
      (生成物 `.svelte-kit/` `build/` は無視)

**サマリ**: 三条件ルール(呼び出しゼロ・代替不要・依存フィールドなし)を満たすデッドコードの除去。

### Phase 2: services/session.ts → session_guards.ts リネーム(独立コミット)

- [ ] `git mv` で `src/features/auth/services/session.ts` → `session_guards.ts`、
      `session.test.ts` → `session_guards.test.ts`(テスト内の相対 import `./session` → `./session_guards`)
- [ ] import 更新(7ルート、`'$features/auth/services/session'` → `'.../session_guards'`):
  - [ ] `src/routes/problems/[slug]/+page.server.ts:5`
  - [ ] `src/routes/users/edit/+page.server.ts:10`
  - [ ] `src/routes/users/[username]/+page.server.ts:9`
  - [ ] `src/routes/workbooks/+page.server.ts:30`
  - [ ] `src/routes/workbooks/create/+page.server.ts:12`
  - [ ] `src/routes/workbooks/edit/[slug]/+page.server.ts:12`
  - [ ] `src/routes/workbooks/[slug]/+page.server.ts:15`
- [ ] `.claude/rules/auth.md` の Key Files 該当行を更新
- [ ] `pnpm test:unit && pnpm check && pnpm lint`

**サマリ**: 移行してくる `server/session.ts` との名前衝突を、責務を表す名前へのリネームで解消。

### Phase 3: auth 4モジュール移行(本体コミット)

- [ ] `git mv` で 8 ファイルを `src/lib/server/` → `src/features/auth/server/` へ:
      `auth.ts` / `auth.test.ts` / `session.ts` / `session.test.ts` /
      `password.ts` / `password.test.ts` / `random.ts` / `random.test.ts`
- [ ] feature 内部の相互参照を相対 import に(既存慣例: `services/` の `../utils/login` 参照と同様):
  - [ ] `server/session.ts`: `$lib/server/random` → `./random`(`$lib/server/database` は**そのまま**)
  - [ ] `server/auth.ts`: session への import 指定子を確認し `./session` に
  - [ ] `server/password.ts`: `./random` のまま(変更不要)
- [ ] 外部 importer の更新:
  - [ ] `src/hooks.server.ts:6`: `'$lib/server/auth'` → `'$features/auth/server/auth'`
  - [ ] `src/app.d.ts:10`: `import('$lib/server/auth').AuthRequest` → `import('$features/auth/server/auth').AuthRequest`
  - [ ] `src/routes/(auth)/login/+page.server.ts:5`・`signup/+page.server.ts:5`(`createSession`)、
        `logout/+page.server.ts:3`(`invalidateSession`): `'$lib/server/session'` → `'$features/auth/server/session'`
  - [ ] `src/features/auth/services/credentials.ts:4-5`: `'$lib/server/password'` / `'$lib/server/random'`
        → 相対 `'../server/password'` / `'../server/random'`
  - [ ] `prisma/seed.ts:22`: `'../src/lib/server/password'` → `'../src/features/auth/server/password'`
- [ ] テストのモック指定子を**ソースの import 指定子と一致させて**更新:
  - [ ] `server/auth.test.ts`: `vi.mock('$lib/server/session')` → auth.ts の新指定子に一致(相対なら `'./session'`)
  - [ ] `server/session.test.ts`: `vi.mock('$lib/server/database')` は**そのまま**、
        `$lib/server/random` のモックがあれば `'./random'` に
  - [ ] `src/features/auth/services/credentials.test.ts:18,24`: `vi.mock('$lib/server/password')`
        → credentials.ts の新指定子に一致
- [ ] Residual-Reference Sweep(repo 全体):
      `rg -n 'lib/server/(auth|session|password|random)' -g '*.ts' -g '*.svelte' -g '*.md'`
      → ヒットは docs のみになるはず(Phase 4 で対応)
- [ ] `pnpm test:unit && pnpm check && pnpm lint && pnpm build`

**サマリ**: auth ドメイン専用の4モジュール+テストを3層モデルに従い feature 内へ移動。
`database.ts` / `tasks/cache.ts` は共有インフラとして `lib/server/` に残留。

### Phase 4: ドキュメント更新(Phase 3 と同コミットでも可)

- [ ] `.claude/rules/auth.md` Key Files: `src/lib/server/auth.ts` / `session.ts` / `password.ts`
      → `src/features/auth/server/...` に更新
- [ ] `docs/guides/architecture.md`: `src/lib/server/` セクションから auth.ts の記載を除去し、
      残留物(`database.ts` / `tasks/cache.ts`)を反映。`features/{feature}/server/` サブディレクトリ規約
      (サーバ専用・非サービスコード置き場)を明文化

**サマリ**: コードと文書の乖離を解消し、feature 内 `server/` 規約を明文化。

### Phase 5: リファクタサイクル(AGENTS.md 規約)

- [x] `coderabbit review --plain` を実行し、critical / high / potential_issue 所見を本ファイルの
      `## CodeRabbit Findings` に記録(**修正はユーザー判断待ち、独断で直さない**)
- [ ] novel lessons と残タスクを本ファイルに記録

## 検証

各 Phase 後:

```bash
pnpm test:unit      # 特に features/auth 配下と移行テスト 8 ファイル
pnpm check          # app.d.ts の型 import 解決を確認
pnpm lint
```

Phase 3 後は追加で:

```bash
pnpm build          # $lib/server 推移保護・alias 解決の最終確認
```

E2E(auth フロー: login / signup / logout)を `pnpm test:e2e` で実行、
または dev サーバで手動ログイン確認。

## 注意点

- `vi.mock()` の第1引数はソースの import 指定子と完全一致が必要 — 移行時の主要な破損ポイント
- `app.d.ts` は ambient d.ts だが `$features` alias は `.svelte-kit/tsconfig.json` の paths で解決される
  (`pnpm check` で確認)
- `features/auth/server/` には SvelteKit のビルド時クライアント import 禁止は**効かない**(規約ベース)。
  実質保護: session/auth は `$lib/server/database` 推移 import、password/random は node:crypto / サーバ文脈
- `.svelte-kit/` `build/` 内の残留ヒットは生成物なので無視

## CodeRabbit Findings

`coderabbit review --plain`(v0.6.5、`#3870 → staging`)を実行。48ファイル・21所見
(major 17 / minor 4)。うち**本移行の変更スコープに関係するのは 4 件のみ**。残り 17 件は
ブランチに未追跡で含まれる無関係ファイル(`docs/ui-mock/*`・`docs/dev-notes/*`・
`docs/superpowers/plans/*`)への指摘で、本タスクとは別物のため下記「スコープ外」に集約。

**修正はユーザー判断待ち。独断では直していない。**

### スコープ内(auth 移行関連)

| #    | 重要度                  | 箇所                                                 | 指摘                                                                                                                                                                                                                                                                                               | 評価                                                                                                                                                                                                                                                     |
| ---- | ----------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CR-1 | major (Security)        | `docs/guides/architecture.md:94-104`                 | `features/*/server/` に実効的なサーバー境界(`*.server.ts` / 保護配置 / CI 検査)を追加すべき。推移的依存に頼る現状では、将来 node:crypto・DB 非依存の補助コードが追加された時点でクライアントから import 可能になる                                                                                 | **却下した代替案 #3 + 注意点で既に明示的に受容したトレードオフ**。CodeRabbit は受容済みの設計判断を再提起している。CI 検査(eslint の import 制約等)の追加は将来の別タスク候補                                                                            |
| CR-2 | major (Correctness)     | `src/features/auth/server/auth.ts:51-57`             | `validate()` の有効セッション経路で Cookie を再発行しないため、セッション層がアイドル期限を延長してもブラウザは初回 `expires` 到達後に Cookie 送信を停止 → 利用中ユーザーが強制ログアウトされうる。更新有無と新 `idlePeriodExpiresAt` を返却契約に含め、更新時のみ `setSessionCookie()` を呼ぶべき | **PR #3864 由来の既存挙動**。本移行はファイル移動と import 指定子変更のみで、この挙動は不変更。正当な潜在バグだが移行スコープ外。別 issue 化を推奨                                                                                                       |
| CR-3 | minor (Correctness)     | `src/features/auth/server/auth.test.ts:24-29`        | Cookie モックが状態を持たず、`delete()` 後も `get()` が旧セッション ID を返す。実 SvelteKit では削除直後の同一リクエスト内 `get()` は `undefined`。ステートフルなモックにすべき                                                                                                                    | **既存テストを移動しただけ**。テスト品質改善。minor のため PR CI に委ねてよい                                                                                                                                                                            |
| CR-4 | major (Maintainability) | `src/features/auth/services/session_guards.ts:24-48` | `getLoggedInUser` / `ensureSessionOrRedirect` が `redirect()` を直接呼び、サービス層をフレームワーク依存にしている。コーディング規約「Services return data or null; never call redirect()」違反。`server/` 等へ移動しルートから呼ぶべき                                                            | **既存挙動**(リネーム前から redirect を呼んでいた)。本タスクは衝突回避のリネームのみが目的で、責務再配置は却下した代替案 #1 の範囲。ただし規約違反の指摘自体は妥当 — 別タスクで `session_guards` を `server/` 直下 or route ハンドラへ寄せる検討余地あり |

### スコープ外(未追跡の無関係ファイル、17 件)

本移行と無関係。ブランチに未コミットで存在する別作業の成果物への指摘:

- `docs/ui-mock/2026-{06-27,07-04,07-11}/index.html` — 10 件(投票ピッカーの `position:fixed`
  スクロール座標バグ、その他 UI モックの機能不整合)
- `docs/dev-notes/{2026-04-26,2026-06-28,2026-07-01,2026-07-13}/...` — 5 件(ドキュメント記述の
  正確性: Remote Functions の種類数、PR マージ可否総括、Bun 移行 survey 等)
- `docs/superpowers/plans/2026-06-11-full-codebase-refactoring.md` — 3 件(計画文書の記述)

→ 各成果物の担当タスクで対応すべきもの。本 PR には含めない。
