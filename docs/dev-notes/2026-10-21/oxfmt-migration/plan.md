# Prettier から oxfmt への移行（#2226）

[#2226](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2226) の残りの作業として、formatter を Prettier から oxfmt（0.75.0）に置き換えた。lint は今の構成のままで、JS/TS は oxlint、`.svelte` は ESLint（eslint-plugin-svelte）が担当する。

## 決めたこと

- **整形は formatter だけが担当する:** ESLint・oxlint には `meta.type` が `layout` のルール（`svelte/indent` など）を入れない。`AGENTS.md` と `CONTRIBUTING.md` に書いた。
- **出力は Prettier に揃える:** `oxfmt --migrate=prettier` の設定をそのまま使い、`sortImports`・`sortTailwindcss` は有効にせず、`sortPackageJson` は `false` にした（oxfmt の既定は `true`）。違いが出た3ファイルは一度だけ整形し直した。
- **Prisma の生成物は整形しない:** oxfmt は TOML も整形するので、`prisma/migrations/migration_lock.toml` を `ignorePatterns` に足した。
- **一度に切り替える:** Prettier と oxfmt は2つの `.ts` で結果が違い、両方を同時に通せないので、script・lefthook・整形し直しを同じ PR で行った。
- **版は exact で固定する:** 0.x の間は範囲指定にしない。
- **lefthook に `--no-error-on-unmatched-pattern` を付ける:** ignore の対象（`prisma/ERD.md` など）だけが staged のとき、flag が無いと oxfmt は exit 2 で失敗する。
- **エディターは Oxc の拡張機能に揃える:** `[svelte]` を含め、`editor.defaultFormatter` を `oxc.oxc-vscode` にした。firewall の許可リストでは `oxc` を足し、`prettier-vscode` だけの発行者だった `esbenp` を消した。
- **使われていなかった設定も消す:** `prettier.config.js` は `.prettierrc` に隠れて読まれておらず、Tailwind のクラスは並べ替えられていなかった。`eslint-config-prettier` はどこからも import されていなかった。

### 採らなかった案

- **ESLint も oxlint に置き換える:** oxlint は Svelte のテンプレートを lint できず、`svelte/require-each-key`・`svelte/no-navigation-without-resolve` などのチェックが無くなる。
- **`.svelte` だけ Prettier に残す:** formatter が2つになり、設定と ignore を二重に持つことになる。oxfmt は `.svelte` の100ファイルすべてで Prettier と同じ結果だった。
- **Tailwind の並べ替えを同時に有効にする:** 多くのファイルのクラス順が変わり、formatter の変更の review と混ざる。今も並べ替えは効いていないので、移行で挙動は変わらない。
- **`eslint-config-prettier` で衝突を防ぐ:** 整形のルールが0個で、そもそも import されていなかった。
- **`layout` のルールが無いことを自動で検査する:** 今は0個で、ルールを足すことは少ない。規約と review で十分。
- **oxfmt が 1.0 になるまで待つ:** 更新の手間は Prettier と同じ種類の作業になる。oxfmt はほぼ毎週更新されるが、Prettier も 2026-05 以降に約10回更新され、そのうち 3.9.3 では整形し直しが要った。待つ理由にはならない。

## 確認したこと（2026-11-01）

### Prettier との違い

- 違いが出たのは次の3ファイルだけだった（加えて `migration_lock.toml`）。untracked の dev-notes には違いが無かった。
  - `.ts` 2ファイル: 1行に収まる union 型を、oxfmt は先頭に `|` を付けて1メンバー1行に分ける。
  - `docs/dev-notes/2026-03-27/atcoder-verified-voting/plan.md`: もとから崩れていた `svelte` の code block の折り返し位置が変わる。
- `.svelte`: 100ファイルすべてが Prettier と同じ結果。oxfmt は `.svelte` を、内蔵の Prettier と prettier-plugin-svelte で整形する（実行時に `svelte` package が要る）。
- 2026-10-21 に Kit 3 の branch と `oxfmt@0.74.0` で行った確認でも、同じ結果だった。

### 速さ

同じツリーで、cache を使わずに測った。

| コマンド             | 時間        |
| -------------------- | ----------- |
| `prettier --check .` | 4.0〜4.8 秒 |
| `oxfmt --check`      | 0.72 秒     |
| `oxlint .`           | 約0.1 秒    |
| `eslint .`           | 1.6〜2.0 秒 |

`pnpm lint` 全体は約6秒から約2.6秒になる見込み。CI は pnpm の store だけを cache するので、毎回この差が出る。ただし、`lint` は `build`・`check`・`unit-test` と並列に走るので、CI 全体の時間が縮むかは確かめていない。

### lint と format の担当

- `src/routes/+page.svelte` に対して `ESLint#calculateConfigForFile` で有効なルールを数えると41個で、`problem` 23個・`suggestion` 18個・`layout` 0個だった（ESLint 10.14.0）。
- oxlint は追加のカテゴリを有効にしておらず、整形のルールは無い。oxlint 1.90.0 には Svelte のルールも無い。

### 移行後の確認

- `pnpm lint`・`pnpm check`・`pnpm test:unit`（2994件）が通り、`pnpm format` で差分が出ない。
- `Footer.svelte` を崩すと `pnpm lint` が exit 1 で失敗する。lefthook の pre-commit に渡すと整形し直される。
- lefthook に ignore の対象（`prisma/ERD.md`）だけを渡すと、format の job は exit 0 で終わる。
- `pnpm why prettier` で、Prettier に依存する package が残っていないことを確かめた。`prisma generate` も通る。
- devcontainer を Rebuild したあと、`.ts`・`.svelte` とも保存時に Oxc の拡張機能で整形された（ユーザーが確認）。

### 情報源

oxc.rs は dev container の firewall で取得できなかった。公式の情報は、npm の tarball の `--help`・`configuration_schema.json` と、検索で得た公式ページ（formatter・language support・editor setup・compatibility）の内容で確かめた。

## 確認していないこと

- Oxc の拡張機能は oxlint も動かす。`editor.codeActionsOnSave` の `source.fixAll` によって、保存時に oxlint の自動修正も走るはず。
- `.md` は `[markdown]` の `formatOnSave: false` のままで、保存時には整形されない（移行前と同じ）。

## 残りの作業

- lefthook の glob（`**/*.{js,jsx,ts,tsx,md,svelte}`）が、root のファイル（`AGENTS.md`・`vite.config.ts` など）に当たっていない。Prettier のときからある問題で、CI の `lint` では検出される。直すかを決める。
- Tailwind のクラスの並べ替え: `sortTailwindcss` を有効にするかを別 PR で決める。
- ESLint から oxlint への完全な移行: oxlint が Svelte のテンプレートの lint に対応したら、使っている41個のルールが揃うかを確かめて判断する。2026-11-01 時点では未対応で、言語 plugin の issue（oxc-project/oxc#23207）は open のまま。
- oxfmt の更新の PR で整形の結果が変わったら、その PR で整形し直す。oxfmt が 1.0 になったら、版の指定の仕方（exact か範囲か）を見直す。
