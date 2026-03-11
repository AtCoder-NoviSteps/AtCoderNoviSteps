# リファクタリング（workbook order 機能）

workbook order 機能のリファクタリング記録。

調査観点・フェーズ設計の原則は `.claude/skills/refactor-plan/instructions.md` に抽出済み。
コーディング規約は `.claude/rules/` 各ファイルに反映済み。

---

## 主な意思決定

- **`_server.ts` vs form action**: JSON API が必要（ページ遷移なし）なので `+server.ts` を採用。form action は不要
- **snippet を維持した理由**: `solutionBoard` / `curriculumBoard` snippet は `$state` に直接アクセスしており、コンポーネント化すると props が10個以上になる。snippet のまま維持が妥当
- **`saveUpdates` のテストを省略した理由**: ロジックが `if (!response.ok) throw` の1行のみ。fetch モックのセットアップコストがテスト価値を上回る。E2E でカバー
- **DnD の Playwright テスト除外**: mouse + @dnd-kit の組み合わせが不安定なため
- **`createInitialPlacements` のエラーハンドリング**: throw 時は SvelteKit が 500 として処理するため現状維持で問題なし

## ハマった点

- Prisma enum とアプリ enum は構造が同じでも TypeScript は別型として扱う。キャストが必要な箇所を残すこと
- `$state()` の初期化式で `$props()` を参照すると「This reference only captures the initial value」警告。意図的なら `untrack(() => ...)` でラップ
- `{#snippet}` はコンポーネントタグの**外**（トップレベル）に定義する。タグ内に書くと named slot として解釈されて型エラー
- fixture を `.filter()` でサブセット化するとき、同じ ID でも fixture が更新されると別エンティティを指す可能性がある

## 出典

- [SvelteKit Routing - server](https://svelte.dev/docs/kit/routing#server) — `+server.ts` の採用根拠
- [Svelte 5 Snippets](https://svelte.dev/docs/svelte/snippet) — snippet の仕様
- [@dnd-kit/helpers `move()`](https://github.com/clauderic/dnd-kit/tree/master/packages/helpers) — flat array vs Record の挙動
