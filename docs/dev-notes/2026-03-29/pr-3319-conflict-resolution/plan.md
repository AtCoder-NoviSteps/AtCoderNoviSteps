# PR #3319 × staging コンフリクト解消

## 概要

`feature/atcoder-verified-voting`（PR #3319）と `staging` のコンフリクトを解消した。

**原因**: PR #3319 の作成後に `feature/atcoder-account-model`（PR #3324）が staging にマージされ、PR #3319 が参照していたファイルが移動・リネームされた。

**設計方針**: `feature/atcoder-verified-voting` ブランチで `git merge origin/staging` を実行。rebase ではなく merge を選択した理由: コンフリクト解消の文脈が追跡しやすく、作業量も同じため単純さを優先した。

## CodeRabbit Findings

`coderabbit review --plain` 実行済み（2026-03-29）。未対応の所見を記録。

### potential_issue: `src/routes/users/edit/+page.svelte` line 32–35

> message / message_type がフォームアクション後に更新されない
>
> let message = data.message は初期値のみキャプチャ。アクション後は form?.message を参照する必要がある。

### potential_issue: `docs/dev-notes/2026-03-26/pr-3316-review/review.md` line 196

> 誤字: updateValicationCode → updateValidationCode

### potential_issue: `src/routes/problems/+page.server.ts` line 37 — **対応不要（false positive）**

> isAtCoderVerified は locals.user を参照しているが、他は session?.user を参照している。

`locals.user.is_validated` は `hooks.server.ts` で `user.atCoderAccount?.isValidated` から設定される。`session?.user` にはこのフィールドが存在しないため、`locals.user` 参照は正しい。
