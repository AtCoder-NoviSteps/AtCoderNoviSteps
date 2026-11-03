# E2E テストの高速化

## 概要

Playwright のインストールと E2E 実行に時間がかかる問題について、ツールを置き換えずに現行構成のまま短縮する。

ブラウザのインストール（Dockerfile のレイヤーキャッシュと `--only-shell`）は `../slim-devcontainer/plan.md` の Phase 1 に統合済みで、本計画では扱わない。

### 現状（2026-11-03 再計測）

8 コアのマシンで、現行設定（既定の 4 ワーカー、`trace: 'retain-on-failure-and-retries'`）のまま実行した結果は次のとおり。2026-09-30 の値も併記する。

| 段階                                     | 2026-09-30（104 件） | 2026-11-03（120 件） |
| ---------------------------------------- | -------------------- | -------------------- |
| `prisma generate`（単体）                | 約 2.8 秒            | 約 2.0 秒            |
| `vite build`（単体）                     | 約 19.8 秒           | 約 15.2 秒           |
| 起動待ち（実行開始から最初のテストまで） | —                    | 約 19.8 秒           |
| テスト本体                               | 約 45 秒             | 約 69.5 秒           |
| `pnpm test:e2e` 合計                     | 約 71.5 秒           | 約 89.5 秒           |

- テスト本体の間、4 ワーカーはいずれも 50〜68 秒稼働していた。最も重いファイル（`redirect_after_login`、39.9 秒）よりワーカー全体の処理量が律速であり、ファイル内の直列実行は主因ではない。
- ファイル別の上位は `redirect_after_login`（39.9 秒）、`workbooks_list`（27.6 秒）、`signin`（21.1 秒）、`votes`（20.2 秒）、`workbook_order`（20.1 秒）である。
- 最も遅いテストは `problems_contest_table` と `submission_status` の「再読み込み後も保持される」系で、各約 13 秒かかる。`/problems` の読み込みが 1 回あたり約 4 秒かかっており、アプリ側の要因なので本計画の対象外とする。
- `vite build` のうち約 5.0 秒は `@sveltejs/adapter-vercel` による Vercel 用出力の生成で、`vite preview` はこれを使わない（2026-09-30 計測）。
- 2026-09-30 時点で失敗していた `user_edit.spec.ts:24` は、2026-11-03 の 8 回の実行ではすべて成功した。

### 条件別の計測（2026-11-03）

`PLAYWRIGHT_JSON_OUTPUT_NAME=... pnpm exec playwright test --reporter=json,line` に CLI オプションを付けて実行し、JSON の各テストの開始時刻から起動待ちとテスト本体を分けた。トレースの有無以外は設定ファイルのまま。

| 条件                                      | 起動待ち   | テスト本体    | 合計          | テスト時間の総和 | 結果                                |
| ----------------------------------------- | ---------- | ------------- | ------------- | ---------------- | ----------------------------------- |
| 4 ワーカー（現状）                        | 19.8 秒    | 69.5 秒       | 89.5 秒       | 226 秒           | 全件成功                            |
| 6 ワーカー                                | 14.6 秒    | 42.6 秒       | 57.2 秒       | 163 秒           | 全件成功                            |
| 8 ワーカー                                | 14.7 秒    | 43.6 秒       | 58.4 秒       | 203 秒           | 全件成功                            |
| 6 ワーカー＋`fullyParallel`（3 回）       | 約 15.7 秒 | 36.2〜39.3 秒 | 51.9〜55.2 秒 | 206〜223 秒      | 3 回中 1 回 `workbook_order` が失敗 |
| 8 ワーカー＋`fullyParallel`               | 14.9 秒    | 42.3 秒       | 57.3 秒       | 321 秒           | 全件成功                            |
| 6 ワーカー＋`fullyParallel`＋トレースなし | 15.7 秒    | 25.0 秒       | 40.8 秒       | 142 秒           | `navbar` が 1 件失敗                |

- **ワーカー数が最大の要因:** 4 から 6 にするとテスト本体が 70 秒から 43 秒になった。8 では、preview サーバー・Postgres とブラウザが CPU を奪い合い、テスト時間の総和が膨らむ（`fullyParallel` 併用時に 321 秒）ため、6 より速くならない。
- **トレースの記録が約 3 割を占める:** `retain-on-failure-and-retries` は失敗時に残すために全テストを記録する。なしにするとテスト本体が 36〜39 秒から 25 秒になった（1 回のみの計測）。
- **`fullyParallel` の効果は小さい:** 6 ワーカー同士の比較で 3〜6 秒の短縮にとどまる。
- **`workbook_order` の失敗:** `reordering within the same column persists after reload` が `Expected: 35 / Received: 45` で失敗した。同じファイル内の並べ替えテストが同じ配置データを同時に更新した競合である。
- **`navbar` の失敗:** `navbar.spec.ts:42` で、ハンバーガーメニューをクリックしてもメニューが開かなかった。描画が速くなり、ハイドレーション完了前にクリックした可能性が高い。設定によらない潜在的な不安定さで、高速化で表に出やすくなる。
- 最初の計測の途中で作業ツリーが `ac0a3f98` に更新されたため、4 ワーカーの計測だけテストが 2 件少ない（120 件、他は 122 件）。改善幅を小さく見せる方向の差なので、結論は変わらない。
- 計測のためにローカル DB に対して 8 回実行したので、サインアップのテストが作るユーザー（`testuser_*`）などが増えている。

## 方針

- テストの検証内容は変えず、サーバー起動・ワーカー数・トレース記録・ログインの重複だけを減らす。
- 設定だけで済む変更から着手し、テストコードに触れる変更は前のフェーズの後に再計測して判断する。
- 各フェーズの前後で、上記と同じ方法で所要時間を計測し、本ファイルに追記する。並列度を上げるフェーズでは、DB の競合と不安定なテストを見つけるため、全件を 3 回以上繰り返して確認する。

## 見送り案

- **tester-army/e2e に置き換える:** 実体は `playwright-core`（1.64.1 で固定）の上に独自のランナーと、自然言語で操作する AI エージェントを載せたもので、ブラウザ操作の速さは変わらない。速度の主張やベンチマークはない。移行ガイドでは Playwright の 185 機能中 55 が未サポートで、`page.on('request')`・`browser.newContext(devices)`・判定関数付きの `waitForResponse`・`waitForFunction`・`fullyParallel`・Trace Viewer・UI モードが使えない。`getByRole` の名前の文字列指定が既定で完全一致になり、ずれると否定のアサーションが素通りする。1.0 前で、エージェント手順には CI に LLM の API キーが要る。
- **他のフレームワークに置き換える:** 2026 年のベンチマークでは、Playwright が Cypress の約 1.45 倍・Selenium の約 1.85 倍速く、上回るものは見つからなかった（いずれもベンダーの記事）。Puppeteer はテストランナーを持たず、Vitest Browser Mode は内部で Playwright を使うコンポーネントテスト向けである。
- **Stagehand に置き換える:** AI エージェント向けのブラウザ操作 SDK で、テストランナーではない。操作のたびに LLM を呼ぶため、むしろ遅くなり費用もかかる。
- **Lightpanda に置き換える:** 2026-10-02 に 1.0 が発表されたとする記事があるが、npm の README はまだ CDP 対応を WIP としている。レイアウトを計算せず、スクリーンショットも撮れない点は変わらないため、`navbar.spec.ts` の `boundingBox()` や `toBeVisible()` / `click()` の表示判定、ダークモード・カスタムカラーの検証が信用できなくなる。
- **Rust 製ツールに置き換える:** thirtyfour や chromiumoxide にはテストランナー・trace viewer・codegen がない。時間の大半はブラウザとアプリサーバーの待ちなので、ドライバーを Rust にしても短縮効果はほぼない。
- **ブラウザを別コンテナに出す（`playwright run-server` ＋ `connectOptions.wsEndpoint`）:** devcontainer からブラウザと依存ライブラリはなくなるが、公式イメージの取得、preview の `0.0.0.0` 待ち受け、ファイアウォールの調整が要る。インストールの遅さは `slim-devcontainer` の Phase 1 で解消する見込みなので不要。
- **`webServer` を `pnpm dev` に切り替える:** ビルドは不要になるが、ページごとの初回コンパイルで遅延が出るうえ、依存パッケージの再最適化による再読み込みでテストが不安定になる。本番ビルドとの差異も生じる。
- **E2E 時だけアダプタを切り替えて約 5 秒削る:** `svelte.config.js` に環境変数による分岐が増える。起動済みサーバーを再利用すれば 2 回目以降はビルド自体を省けるため、YAGNI として見送る。
- **ワーカー数を 8（`'100%'`）にする:** CPU の奪い合いで 6 より速くならないことを実測で確認した。
- **トレースを `on-first-retry` ＋ `retries: 1` にする:** 失敗時に自動でトレースが残るが、`navbar` のような不安定なテストがリトライで成功扱い（flaky）になり埋もれる。既定は記録なしとし、失敗したテストだけトレース付きで再実行する。
- **`fullyParallel` を確認なしに全体へ適用する:** `workbook_order` で競合による失敗を確認した。DB を更新するファイルを特定して除外してからでないと適用できない。

## フェーズ

### Phase 1: 起動済みサーバーの再利用とタイムアウトの見直し（設定のみ）

対象は `playwright.config.ts`。

```typescript
webServer: {
  command: 'pnpm build && pnpm preview',
  port: 4173,
  reuseExistingServer: !process.env.CI,
  timeout: 180 * 1000,
},
```

- `reuseExistingServer` を有効にすると、別ターミナルで `pnpm build && pnpm preview` を起動しておけば、`pnpm test:e2e` はビルドを省略してそのサーバーを使う。サーバーが起動していなければ従来どおりビルドする。
- 現在の `timeout: 10000 * 1000`（約 2.8 時間）は、ビルドが固まっても失敗として表に出ないため、180 秒に短縮する。現状の起動待ちは約 15〜20 秒なので、十分な余裕がある。
- リスク: 起動済みの preview が古いビルドのままだと、変更前のコードに対してテストが通ってしまう。コードを変更したら preview を起動し直すことを、`docs/guides/agent-rules/testing-e2e.md` の Setup に一行追記する。
- 検証: preview を起動した状態と起動していない状態で `pnpm test:e2e` を実行し、両方で結果が変わらないことと、所要時間を記録する。
- 期待効果: 2 回目以降の実行で起動待ちの約 15〜20 秒が消える。

### Phase 2: ワーカー数の引き上げとトレースの既定値の変更（設定のみ）

対象は `playwright.config.ts` と `docs/guides/agent-rules/testing-e2e.md`。

```typescript
const config: PlaywrightTestConfig = {
  // 6 on an 8-core machine; more workers slowed each test by competing with preview and Postgres.
  workers: '75%',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:4173',
    // Recording every test cost about 30% of the run; rerun failures with `--last-failed --trace on`.
    trace: 'off',
  },
  // ...
};
```

- ワーカー数を増やしても、同時に走るファイルが増えるだけで、ファイル内の実行順は変わらない。ファイルをまたぐ並列は現状の 4 ワーカーでもすでに起きており、6・8 ワーカーでの各 1 回の実行では失敗はなかった。
- 失敗の調査は `pnpm test:e2e --last-failed --trace on` で失敗したテストだけトレース付きで再実行する。この手順を `testing-e2e.md` の Debugging に一行追記する。
- `navbar.spec.ts:42` の失敗が本フェーズの検証で再現したら、ハイドレーションの完了を待ってからクリックするよう修正する。待ち方は再現時の状況を見て決める。
- 検証: 全件を 3 回以上実行し、失敗がないことを確認する。`navbar.spec.ts` は単体でも `--repeat-each=10` で確認する。
- 期待効果: 6 ワーカー化で合計 89.5 秒から 57 秒前後（実測）。トレースなしでテスト本体がさらに約 3 割短くなる見込み（`fullyParallel` 併用時の実測で 36〜39 秒から 25 秒）。Phase 1 と合わせ、2 回目以降は 30 秒前後を見込む。

### Phase 3: ファイル内の並列化（Phase 2 後の再計測で判断）

対象は `playwright.config.ts`、`e2e/workbook_order.spec.ts`、`docs/guides/agent-rules/testing-e2e.md`。

```typescript
// playwright.config.ts
fullyParallel: true,
```

```typescript
// e2e/workbook_order.spec.ts (file top level)
// Reorder tests update the same placements, so run this file in order on one worker.
test.describe.configure({ mode: 'default' });
```

- 実測の効果は 3〜6 秒と小さく、ファイル内で共有データを更新するテストの競合という新しいリスクを持ち込む。Phase 2 後に再計測し、短縮が数秒にとどまるなら見送る。
- 着手する場合は、`workbook_order` 以外に同じデータを更新するテストを持つファイル（`votes`、`workbook_edit`、`user_edit`、`account_transfer`、`submission_status` など）を読み、該当すれば同じく `mode: 'default'` にする。
- `testing-e2e.md` の Setup & Teardown にある「`describe.configure({ mode: 'parallel' })` で並列化する」を、「既定で並列。共有データを更新するファイルは `mode: 'default'` で直列にする」に書き換える。
- 検証: 全件を `--repeat-each=3` で実行し、失敗がないことを確認する。

### Phase 4: ログイン状態の使い回し（効果を計測してから判断）

`beforeEach` でのフォームログインを、事前に保存したログイン状態（`storageState`）の読み込みに置き換える。

2026-09-30 時点の対象は、`loginAsUser` / `loginAsAdmin` を呼んでいる 6 ファイル・11 箇所（`votes` 4、`workbook_order` 2、`workbooks_list` 2、`problems_cache` 1、`user_edit` 1、`workbook_edit` 1）。テストが増えているため、着手時に数え直す。

最も重い `redirect_after_login` はログインの流れそのものを検証しているため対象外で、効果は限定的な可能性がある。

**着手前の計測:** 対象ファイルでログイン 1 回にかかる時間を計測し、削減見込みが数秒未満であれば本フェーズは見送る。ワーカーが増えた後は、ログインの削減分がそのまま全体の短縮にはならない点も考慮する。

想定する構成:

```typescript
// playwright.config.ts
projects: [
  { name: 'setup', testMatch: /auth\.setup\.ts/ },
  {
    name: 'all',
    testMatch: /(.+\.)?spec\.[jt]s/,
    dependencies: ['setup'],
  },
],
```

```typescript
// e2e/helpers/auth.ts
export const ADMIN_STORAGE_STATE = 'e2e/.auth/admin.json';
export const GUEST_STORAGE_STATE = 'e2e/.auth/guest.json';
```

```typescript
// e2e/auth.setup.ts
setup('authenticate as admin', async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});

setup('authenticate as guest', async ({ page }) => {
  await loginAsUser(page);
  await page.context().storageState({ path: GUEST_STORAGE_STATE });
});
```

```typescript
// Each spec: replace `beforeEach(loginAsUser)` with
test.use({ storageState: GUEST_STORAGE_STATE });
```

- `all` プロジェクト全体には `storageState` を設定しない。未ログイン状態を前提とするテスト（`signin`、`redirect_after_login` など）に影響させないため。
- `e2e/.auth/` は `.gitignore` に追加する。
- ログアウト処理は該当セッションだけを無効化する（`invalidateSession(sessionId)`）。`signin.spec.ts` のログアウトテストは独自にログインしているため、共有したログイン状態は無効化されない。
- 検証: `pnpm test:e2e` の結果が変わらないこと、所要時間が短縮されることを確認する。

## 対象外

- **`/problems` の読み込みの重さ（1 回約 4 秒）:** アプリの性能の問題として別途扱う。
- **ブラウザのインストール:** `../slim-devcontainer/plan.md` の Phase 1 で扱う。同計画の `Dockerfile` 例は 2026-09-30 時点の値（Node 24、Playwright 1.63.0）で、現在は Node 26、Playwright 1.64.1、ブラウザは `chromium-1248`（400MB）と `chromium_headless_shell-1248`（276MB）である。
- **CI での E2E 実行:** `ci.yml` では E2E がコメントアウトされたままで、本計画では扱わない。

## 作業後の確認

各フェーズの完了時に `pnpm format`、`pnpm lint`、`pnpm check`、`git diff --check` を実行し、計測結果を本ファイルに追記する。
