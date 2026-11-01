# Prettier から oxfmt への移行（#2226）

## 概要

[#2226](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/issues/2226) の残りの作業として、formatter を Prettier から oxfmt に置き換える。

lint は今の構成を続ける。JS/TS は oxlint（#3309 で導入済み）、`.svelte` は ESLint（eslint-plugin-svelte）が担当する。

## 着手の前提

- oxfmt はまだ 0.x のベータ版。影響は整形の結果だけで、実行時の動作には及ばず、diff で確認でき、元に戻すのも簡単なので、ベータ版を受け入れるかをユーザーが判断してから着手する。

## 確認の結果（2026-11-01）

staging（`aea72aa8`）を `git archive` したコピーで、`oxfmt@0.75.0`（2026-10-27 公開、latest）を使って確認した。repo 本体は変えていない。

### oxfmt の出力

- 設定: `oxfmt --migrate=prettier` で `.prettierrc` から `.oxfmtrc.json` を生成した。`prettier-plugin-svelte` の設定は `"svelte": {}` に、`.svelte` の parser 指定は `associations` に、`.prettierignore` は `ignorePatterns` に変換された。
- `sortPackageJson` は `false` で出力された。oxfmt の既定は `true` なので、`false` のまま使う。
- `.svelte`: 100ファイルすべてが Prettier と同じ結果。わざと整形を崩した `Footer.svelte` を検出したので、読み飛ばしてはいない。
- Prettier との違いは3ファイル（と生成物1つ）だけ。
  - `.ts` 2ファイル（`src/features/workbooks/utils/workbook_tasks.ts`・`src/lib/contests/fixtures/contest_name_and_task_index.ts`）: 1行に収まる union 型を、oxfmt は先頭に `|` を付けて1メンバー1行に分ける。
  - `docs/dev-notes/2026-03-27/atcoder-verified-voting/plan.md`: 段落の折り返し位置が違う。
  - `prisma/migrations/migration_lock.toml`: Prettier は TOML を整形しないが、oxfmt は整形する。Prisma の生成物なので対象外にする。
- 2026-10-21 に Kit 3 の branch（`444e4daf`）と `oxfmt@0.74.0` で行った確認でも、同じ結果だった。

### oxfmt の CLI と設定

- ignore: `--ignore-path` が無ければ `.gitignore` と `.prettierignore` を読む。
- ignore の対象のファイル（`prisma/ERD.md`）だけを渡すと、「Expected at least one target file」で exit 2 になる。`--no-error-on-unmatched-pattern` を付けると exit 0 になる。
- 設定の schema には `sortTailwindcss`（prettier-plugin-tailwindcss と同じ並べ替え）・`sortImports`・`sortPackageJson`・`svelte`（`allowShorthand`・`indentScriptAndStyle`・`sortOrder`）がある。
- `.svelte` の整形は既定で無効で、`svelte` の設定と、実行時の `svelte` package（`svelte/compiler`）が要る。`svelte` は devDependencies にある。

### 速さ

同じツリーで、cache を使わずに測った。

| コマンド             | 時間        |
| -------------------- | ----------- |
| `prettier --check .` | 4.0〜4.8 秒 |
| `oxfmt --check`      | 0.72 秒     |
| `oxlint .`           | 約0.1 秒    |
| `eslint .`           | 1.6〜2.0 秒 |

formatter だけで約6倍速く、`pnpm lint` 全体は約6秒から約2.6秒になる見込み。CI は pnpm の store だけを cache し、Prettier の cache は残らないので、毎回この差が出る。手元では `lint` の `--cache` が効くので、2回目以降の差はこれより小さい。

### lint と format の担当

- formatter と linter が食い違うのは、linter が整形のルールを持つ場合だけ。ESLint は整形のルールを `meta.type: "layout"` と分類する。
- `src/routes/+page.svelte` に対して `ESLint#calculateConfigForFile` で有効なルールを数えると41個で、`problem` 23個・`suggestion` 18個・`layout` 0個だった（ESLint 10.14.0）。
- oxlint は `.oxlintrc.json` で追加のカテゴリを有効にしておらず、`oxlint --rules` にインデント・行の長さ・改行などの整形のルールは無い。
- 今は linter が整形を見ていないので、formatter を Prettier から oxfmt に変えても lint の結果とは衝突しない。

### oxlint の Svelte への対応

- oxlint 1.90.0（latest）の `oxlint --rules` に Svelte のルールは無く、Svelte 用の plugin のオプションも無い。
- 公式の compatibility ページでも、Svelte のテンプレートの lint は未対応。言語 plugin の issue（oxc-project/oxc#23207）は open のままで、Svelte の実装は始まっていない。

### 既存の問題

- Prettier は `.prettierrc` を優先して読む（`prettier --find-config-path` で確認）。`prettier.config.js` の `prettier-plugin-tailwindcss` は使われておらず、Tailwind のクラスは並べ替えられていない。
- `eslint-config-prettier` は devDependencies にあるが、`eslint.config.mjs` を含めてどこからも import されていない。

## 方針

- **整形は formatter だけが担当する:** ESLint・oxlint には `layout` のルール（`svelte/indent`・`svelte/html-quotes`・`svelte/max-attributes-per-line` など）を入れない。ルールを足すときは、そのルールの `meta.type` が `layout` でないことを確かめる。この方針を `AGENTS.md` に書く。
- **出力は Prettier に揃える:** `--migrate=prettier` の設定をそのまま使い、`sortImports`・`sortPackageJson`・`sortTailwindcss` は有効にしない。違いの出る3ファイルは一度だけ整形し直す。
- **一度に切り替える:** Prettier と oxfmt は2つの `.ts` で結果が違い、両方を同時に通すことはできない。script・lefthook・整形し直しを同じ PR で行う。
- **Tailwind の並べ替えは別に決める:** 今も並べ替えは効いていないので、移行で挙動は変わらない。有効にすると多くのファイルのクラス順が変わり、formatter の変更の review と混ざる。

## 採らなかった案

- **ESLint も oxlint に置き換える:** oxlint は Svelte のテンプレートを lint できず、`.svelte` のテンプレートへのチェック（`svelte/require-each-key`・`svelte/no-navigation-without-resolve` など）が無くなる。
- **`.svelte` だけ Prettier に残す:** formatter が2つになり、設定と ignore を二重に持つことになる。oxfmt は `.svelte` の100ファイルすべてで Prettier と同じ結果だったので、分ける理由が無い。
- **Tailwind の並べ替えを同時に有効にする:** 「方針」のとおり、差分が大きく review が混ざる。
- **`eslint-config-prettier` で衝突を防ぐ:** ESLint の整形のルールを無効にする config だが、今は整形のルールが0個で、そもそも import されていない。方針で防ぎ、依存は消す。
- **`layout` のルールが無いことを自動で検査する:** 今は0個で、ルールを足すことは少ない。規約と review で十分。

## フェーズ

### Phase 0: 直前の再確認

- [ ] oxfmt の latest を確かめ、「確認の結果」と同じ比較（`--migrate=prettier`、`--list-different`、`.svelte` を1つ崩して検出されるか、時間）をもう一度行う。違いが増えていたら、ここで止めて相談する。
- [ ] oxfmt の版を決めて、exact で入れる（0.x の間は範囲指定にしない）。

### Phase 1: 切り替え

- [ ] `oxfmt` を devDependencies に足し、`pnpm exec oxfmt --migrate=prettier` で `.oxfmtrc.json` を作る。`ignorePatterns` に `prisma/migrations/migration_lock.toml` を足す。
- [ ] `package.json` の script を変える。`lint` の `prettier --check . --cache` は `oxfmt --check` にする。

  ```json
  "format": "oxfmt",
  "lint": "oxfmt --check && oxlint . && eslint ."
  ```

- [ ] `lefthook.yml` の format の job を `pnpm exec oxfmt --no-error-on-unmatched-pattern {staged_files}` にする。glob は今と同じ。ignore の対象のファイルだけが staged のときに失敗しないよう、`--no-error-on-unmatched-pattern` を付ける。
- [ ] `pnpm format` を実行し、変わるのが「確認の結果」の3ファイルだけであることを確かめる。整形し直しは、設定の変更とは別の commit にする（`style: reformat with oxfmt`）。
- 確認: `pnpm lint` が通る。`.svelte` を1つ崩すと `pnpm lint` が失敗する。lefthook の pre-commit で、staged の `.svelte` が整形される。
- 設定と整形だけで分岐が無いので、テスト先行は省略する。

### Phase 2: Prettier の撤去

- [ ] devDependencies から `prettier`・`prettier-plugin-svelte`・`prettier-plugin-tailwindcss`・`eslint-config-prettier` を消す。
- [ ] `.prettierrc`・`prettier.config.js`・`.prettierignore` を消す。ignore は `.oxfmtrc.json` の `ignorePatterns` と `.gitignore` で足りる。
- [ ] repo 全体で `rg -ni prettier -g '!docs/dev-notes/**' -g '!pnpm-lock.yaml'` を実行し、残りが意図した記述だけであることを確かめる。
- 確認: `pnpm install` 後に `pnpm lint`・`pnpm format` が通り、`pnpm format` で差分が出ない。

### Phase 3: エディターと docs

- [ ] `.devcontainer/devcontainer.json` の `editor.defaultFormatter`（全体・言語ごと・`[svelte]` の `svelte.svelte-vscode`）を `oxc.oxc-vscode` に変え、`esbenp.prettier-vscode` を外す。この拡張機能は LSP で動き、npm で入れた oxfmt を使う。release notes によれば `.svelte` も oxfmt に渡す（oxc-vscode #111）。
- [ ] `.devcontainer/init-firewall.sh` の `vscode_extension_publishers` に `oxc` を足し（CONTRIBUTING.md の規約）、`esbenp` を消す。`esbenp` は `prettier-vscode` だけの発行者で、許可先は最小限にする。
- [ ] `AGENTS.md` の「Lefthook runs Prettier, …」を oxfmt にし、「整形は oxfmt だけが担当し、ESLint・oxlint には layout のルールを入れない」を足す。
- [ ] `CONTRIBUTING.md` の Prettier の記述（ツールの一覧、拡張機能の例、`prettier --write` の説明）を更新する。
- 確認: devcontainer を作り直し、`.ts`・`.svelte`・`.md` の保存時に整形される。

## 後で決めること

- Tailwind のクラスの並べ替え: `sortTailwindcss` を有効にするかを別 PR で決める。有効にしない場合は、Phase 2 で `prettier.config.js` と一緒に plugin も消えるので、そのままでよい。
- ESLint から oxlint への完全な移行: oxlint が Svelte のテンプレートの lint に対応したら、使っている41個のルールが揃うかを確かめて判断する。
- oxfmt が 1.0 になったら、版の指定の仕方（exact か範囲か）を見直す。

## 確認限界

- 確認は devcontainer 上のコピーで行った。oxfmt はほぼ毎週更新されるので、Phase 0 でやり直す。
- 拡張機能が `.svelte` を実際に整形するかは試していない（Phase 3 で確認）。
- lefthook 経由の動作は試していない。`--no-error-on-unmatched-pattern` の挙動は、CLI に直接ファイルを渡して確かめた。
- oxc.rs は dev container の firewall で取得できなかった。公式の情報は、npm の tarball の `--help`・`configuration_schema.json` と、検索で得た公式ページの内容で確かめた。
