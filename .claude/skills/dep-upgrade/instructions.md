# Dependency Major Upgrade Checklist

## 1. Breaking Changes Analysis

Fetch the official migration guide via WebFetch. For each breaking change, grep `src/`, config files,
and `package.json` to determine applicability. Produce two tables:

**問題なし（対応不要）**

| Confirmed Item | Rationale |
| -------------- | --------- |
| ...            | ...       |

**要対応**

| Item | Content | Risk                |
| ---- | ------- | ------------------- |
| ...  | ...     | High / Medium / Low |

Key areas to check:

- Runtime requirements (`engines.node` in `package.json`)
- Config file format changes (flat config vs legacy, etc.)
- Deprecated/removed APIs used in `src/`
- Directive comments that become errors in the new version (e.g., `/* eslint-env */` in ESLint v10)

## 2. Companion Package Check

Some packages must be upgraded together in the same commit to avoid version mismatch.
Check `package.json` for known companion pairs:

- `@sveltejs/kit` + `@sveltejs/vite-plugin-svelte`
- `eslint` + `@eslint/js`

Also verify peer dependency compatibility (`"eslint": "^8 || ^9 || ^10"` style) for all
related packages already installed.

If companion packages are found, include them in the upgrade scope.

## 3. New Features to Adopt

List features unlocked by the new major version:

| Feature | Description | Recommendation      |
| ------- | ----------- | ------------------- |
| ...     | ...         | High / Medium / Low |

## 4. plan.md Structure

Write `docs/dev-notes/YYYY-MM-DD/{package}-upgrade/plan.md` in Japanese:

- **概要**: Which Dependabot PR / bump triggered this; summary of scope
- **破壊的変更の影響調査結果**: Tables from sections 1–2 above
- **設計方針**: How to handle action-required items; companion package strategy
- **却下した代替案**: Alternatives considered (e.g., upgrading only one of a companion pair)
- **便利な新機能（採用検討）**: Table from section 3
- **実装フェーズ**: Phased `- [ ]` checklist (lowest risk → highest risk)
- **検証手順**: The exact commands to run

## 5. Verification Commands

```bash
pnpm install
pnpm lint
pnpm check
pnpm test:unit
```

> **`pnpm check` tip:** If type errors appear and you have uncommitted changes, run
> `git stash && pnpm check 2>&1 | tail -5` to confirm whether errors are pre-existing.
> Restore with `git stash pop`. If there is nothing to stash, skip this check — without
> a baseline to compare against, it gives no useful signal.

Update the plan.md `- [ ]` checklist and add a verification results table when done.
