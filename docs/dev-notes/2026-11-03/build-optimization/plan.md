# ビルド・開発サーバ高速化 / サイズ削減 (#3799)

SvelteKit 3 + Vite 8 (Rolldown 1.2) 導入後に、設定の見直しでビルド時間・ビルドサイズを半分以下にできるかを調べ、効果のあった設定を入れた。

## 結論

| 対象                                     | 結果                                   | 半分以下 |
| ---------------------------------------- | -------------------------------------- | -------- |
| ビルド時間 (`vite build`)                | 6.8 → 4.8 秒 (-29%)                    | 不可     |
| トップページの初回 JS (gzip)             | 231 → 117 KB (-49%)                    | ほぼ達成 |
| サーバ出力 (`.svelte-kit/output/server`) | 7.3 → 5.8 MB (-20%)                    | 不可     |
| デプロイ関数                             | 変更なし (Prisma エンジン削減は見送り) | -        |

- ビルド時間の残りは、Svelte のコンパイルと SvelteKit のモジュール解決 (guard プラグイン) がほとんどで、設定でさらに半減させる手段は見つからなかった。
- 開発サーバは起動 0.5〜0.8 秒、`/` の初回 SSR 3.2 秒、2 回目以降 0.1 秒前後で、すでに十分速いため手を入れていない。

## 決定事項

### flowbite-svelte を tree-shake 可能にした (`vite.config.ts`)

- `build.rolldownOptions.treeshake.moduleSideEffects` で flowbite-svelte の `.js` / `.svelte` を副作用なしと宣言し、`experimental.lazyBarrel` を有効にした。
- 原因は 2 つの組み合わせだった。
  - flowbite-svelte 内部の 57 ファイルが `import { Badge, Modal } from ".."` のように全体の入口 `dist/index.js` から import し、入口は `export *` で 83 個のサブ入口を束ねている。1 つのコンポーネントを使うだけで全体がたどられる。
  - `package.json` に `sideEffects` の宣言がなく、Rolldown はたどった全コンポーネントを残していた。
- 結果、全ページの初回 JS に入っていた 183 コンポーネントが、バンドル全体で 59 個、トップページで 26 個、`/problems` で 41 個になった。646 kB のチャンクと 500 kB 超の警告は消えた。
- `moduleSideEffects` は、Rolldown docs が推奨するルール配列で書いた。ルールにマッチしないモジュールが既定の判定に戻ることは、関数版と出力 (チャンクのハッシュまで) が一致することで確かめた。
- Svelte の `<style>` から生じる仮想 CSS モジュール (`?svelte&type=style&lang.css`) は、正規表現を `\.(js|svelte)$` で終端させて対象から外している。
- 上流で `sideEffects` が宣言される見込みは低いとユーザーが判断したため、この設定を恒久対処とする。

### Prisma のエンジン削減 (旧 Phase 2) は見送った

- 本番の関数には、Vercel 上では使わない `libquery_engine-debian-openssl-3.0.x.so.node` が入っている (ユーザーが Vercel ダッシュボードの Source の Output で確認)。デプロイ用ビルドを GitHub Actions (`ubuntu-latest`) で行うため、`binaryTargets` の `native` が debian になる。
- `binaryTargets = env("PRISMA_BINARY_TARGETS")` で CI のデプロイジョブだけ rhel 用に絞る案を検討したが、変数が未設定だと `prisma generate` が `Attempted to load binaryTargets value using env(PRISMA_BINARY_TARGETS) but it was not present` で失敗した。
- 全開発者の `.env` に変数を足す運用は避けたいため、事前に決めたとおり見送った。

### 画像の圧縮 (旧 Phase 3) は見送った

- `static/` の PNG 14 枚で 962 KB あるが、本件の主題 (ビルド速度・バンドルサイズ) から外れるので別の PR で扱う。
- 状態アイコン (`ac.png`、`wa.png` など) は `prisma/submission_statuses.ts` と `src/lib/services/submission_status.ts` からファイル名で参照されている。拡張子を変えるとデータの移行が必要になる。
- `static/.DS_Store` は git 管理外で、本番には配信されていない。

### Vite 8 までの機能の扱い

| 機能                                         | 判断   | 理由                                                                              |
| -------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| `treeshake.moduleSideEffects` (Rolldown)     | 採用   | 上記                                                                              |
| `experimental.lazyBarrel` (Rolldown)         | 採用   | 単独では効かないが、上と併用でビルドがさらに約 -7%                                |
| `server.warmup`                              | 見送り | 効くのは開発サーバ起動後の初回 SSR 3.2 秒だけ                                     |
| `experimental.bundledDev` (Vite 8.1)         | 見送り | experimental で、一部プラグインが未対応と明記されている。開発サーバは既に十分速い |
| `resolve.tsconfigPaths` (Vite 8)             | 不要   | エイリアスは SvelteKit が解決している。公式も「わずかに遅くなる」としている       |
| `server.forwardConsole` (Vite 8)             | 不要   | コーディングエージェント検出時に自動で有効になる                                  |
| `css.transformer: 'lightningcss'`            | 見送り | CSS は Tailwind 4 の Vite プラグインが処理しており、利得がない                    |
| `build.rolldownOptions.output.codeSplitting` | 不要   | 500 kB 超の警告は消えた。チャンクを分けても総量は減らない                         |
| `devtools` (Vite 8)                          | 任意   | 調査用のツールで、常時有効にする必要はない                                        |

### 却下した案

- `build.chunkSizeWarningLimit` の引き上げ: 警告が消えるだけで、サイズは変わらない。
- flowbite-svelte の import を個別パス (`flowbite-svelte/Button.svelte`) に書き換える: 66 箇所の変更が必要なうえ、ライブラリ内部が `from ".."` で全体の入口を import しているので、アプリ側だけ書き換えても全体がたどられる。
- `pnpm patch` で flowbite-svelte 内部の import を書き換える: 追加で減るのは中継ファイル 84 個の読み込みだけで、57 ファイル分のパッチを更新のたびに追従させるコストに見合わない。
- adapter-vercel の `split: true`: 関数の数が増えるだけで、各関数が Prisma エンジンを含むため小さくならない。
- Tailwind の `@source` を使用中のコンポーネントだけに絞る: CSS は gzip で 36 KB と小さく、コンポーネントを追加するたびに設定の更新が必要になる。
- Prisma 7 への移行 (Rust エンジン不要の構成): 関数サイズへの効果は大きいはずだが、本件の範囲を超える。

## 計測と検証の記録

### 計測条件

- devcontainer (aarch64) で、プロジェクトの設定ファイルを変えずに、`vite.config.ts` を読み込んで差分だけ足すスクラッチ側の Vite 設定で比較した。
- 各パターンを交互に実行し、1 周目は捨てて平均した。静かな状態では 3 周で、変更前 6.8 秒、変更後 4.8 秒。
- 実装後に本物の設定で測り直したときはマシンの負荷が高く (load average 2.6〜6)、変更前 13.4 秒、変更後 10.4 秒 (-22%、4 周中 3 周で変更後が速い) だった。
- 最初に報告した「`vite build` 15 秒」はキャッシュのない 1 回目の値で、通常は約 7 秒。

### 計測値 (静かな状態)

| 項目                                        | 変更前               | 変更後               |
| ------------------------------------------- | -------------------- | -------------------- |
| クライアントで読み込むモジュール数          | 1183                 | 705                  |
| うち flowbite-svelte のコンポーネント       | 184                  | 61                   |
| うち flowbite-svelte のテーマ               | 82                   | 36                   |
| うち flowbite-svelte の中継ファイル         | 84                   | 84                   |
| 最大クライアントチャンク                    | 646 kB (gzip 163 KB) | 125 kB               |
| トップページ初回 JS (entry + layout + page) | 823 kB / gzip 231 KB | 331 kB / gzip 117 KB |
| `/problems` 初回 JS                         | 914 kB / gzip 262 KB | 479 kB / gzip 167 KB |
| クライアント JS 合計 (gzip)                 | 393 KB               | 317 KB               |
| `.svelte-kit/output/client`                 | 2.9 MB               | 2.6 MB               |
| `.svelte-kit/output/server`                 | 7.3 MB               | 5.8 MB               |

- ビルドのプラグイン時間で `vite-plugin-sveltekit-guard` が 82〜87% に見えるのは、このプラグインがクライアント側の全 import に対して `this.resolve()` を呼び直す設計 (`@sveltejs/kit` 3.1.1 の `src/exports/vite/plugins/guard.js`) で、モジュール解決の時間がまとめて計上されるため。設定では外せない。
- デプロイ関数 (`catchall.func`、53 ルートが共有) は手元で 37 MB で、うち 31 MB が Prisma のエンジン 2 個 (手元では arm64 用 14 MB と rhel 用 16 MB)。

### 動作確認

- `pnpm format`、`pnpm lint`、`pnpm check`、`pnpm test:unit` (2994 件)、`git diff --check` は通過した。
- E2E (本番ビルドに対して実行) は、1 回目に `e2e/navbar.spec.ts` のスマホ幅のハンバーガーメニューのテストが 1 件失敗した。
  - 変更前・変更後のビルドそれぞれで単体実行 (2 回ずつ) と 15 回の繰り返し実行を行い、すべて通った。
  - 本物の設定で全件を再実行し、121 件成功・1 件スキップ (もとから skip 指定) で通った。
  - テストが `page.goto('/')` 直後に hydration を待たずにボタンを押しているため、高負荷時にクリック処理が付く前のボタンを押す競合と判断した。今回の変更とは独立した不安定さ。

### 情報源

- SvelteKit docs (performance、icons、adapter-vercel)、Vite docs (performance ガイド、Vite 8 / 8.1 のリリース記事)、Rolldown docs (lazy barrel optimization) は、svelte.dev・vite.dev が devcontainer の egress allowlist で拒否されたため、GitHub 上の docs のソースで読んだ。
- Rolldown のオプションは、インストール済み Rolldown 1.2.14 の型定義で確認した。
- Prisma docs は取得できなかったため、`binaryTargets` の `env()` 対応は Prisma 5.22 CLI 本体のコードと実際の `prisma generate` で確認した。

### 確認していないこと

- 変更後の実機での UI 確認 (ドロップダウン、モーダル、タブ、トースト、クリップボード、カルーセル、トグル、ツールチップ)。ステージングでユーザーが手動確認する。
- 開発時のブラウザ側の読み込み時間。開発サーバは SSR の応答時間だけを測った。

## 残タスク

- ステージングで、上記の flowbite コンポーネントの操作を手動確認する (ユーザー)。
- 依存を更新するときの確認事項:
  - flowbite-svelte の更新時は、副作用なしという前提が崩れていないかを E2E で確認する。設定が効かなくなると 646 kB のチャンクが戻り、ビルドの「500 kB 超」警告が再び出るので、それを退行の目印にする。
  - Rolldown は `lazyBarrel` オプションを将来削除する予定 (既定で有効になる想定)。Vite / Rolldown の更新時に、設定キーがエラーや無視にならないかを確認する。
- 別 issue の候補:
  - `e2e/navbar.spec.ts` のハンバーガーメニューのテストで、クリック前に hydration を待つようにする。
  - `src/lib/services/answers.ts` が本番コードで `@quramy/prisma-fabbrica` を import して `initialize()` を呼んでいる。AGENTS.md の「fabbrica は `prisma/seed.ts` だけで使う」に反し、関数にも同梱されている (64 KB)。
  - `package.json` の `dependencies` にある `playwright` (未使用)、`svelte-eslint-parser` (`eslint.config.mjs` だけで使用)、`@types/node` (型チェックだけで使用) を devDependencies へ移すか削除する。サイズや速度への影響はない。
  - `static/` のスクリーンショットの圧縮。
  - Prisma のエンジン削減。`.env` を増やさない方法 (CI のデプロイジョブで `vercel build` の後に debian 用エンジンを消すなど) は検討していない。
