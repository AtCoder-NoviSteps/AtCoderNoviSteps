# 計画: store テストの browser mock クランプ修正（Option C）

**ステータス: Phase 1-3 実装完了（2026-07-13）**

## Context（背景）

commit `19411e5b`（2026-07-13）で vitest の default 環境を node にし、DOM 参照を持つ 3 つの store テストにだけ `// @vitest-environment jsdom` を付与した。しかし調査で以下が判明した：

- 3 ファイルはいずれも先頭に `vi.mock('$app/environment', () => ({ browser: true }))`、さらに SSR 用 describe の `beforeEach` 内で `vi.mock(..., { browser: false })` を宣言している。
- vitest は **全ての `vi.mock` をホイストし、同一モジュールでは後勝ち**になるため、実測で全テストが `browser = false` になる（`PROBE-MAIN browser = false`）。
- 結果、store の localStorage 分岐（`getInitialValue`/`loadInitialState` の `localStorage.getItem`、setter/`toggleView` の `localStorage.setItem`）は **jsdom でも node でも一度も実行されない**。`vi.stubGlobal('localStorage', …)` の足場も store 経由では実質未使用。
- 副作用として `active_contest_type` の "invalid localStorage key" / "with null" テストは `mockStorage` を読まず常に default を返す **false-positive**。`replenishment` の "persists state in localStorage" は「JSDOM では localStorage をモックできない」という誤ったコメント付きで `test.skip` されている（真因は browser=false）。

つまり testing.md の根拠「jsdom を残せば browser 分岐カバレッジが守られる」は、この 3 ファイルでは成立していない。本計画は **browser mock を main=true / SSR=false に正しく効かせ、localStorage 分岐を実際にカバーする**。

## 設計方針（確定事項）

- **環境**: 3 ファイルとも `// @vitest-environment jsdom` を維持し、jsdom の**実 localStorage** を使う（`vi.stubGlobal('localStorage', …)` のモックは廃止）。検証は状態ベース（`localStorage.getItem(key)` の値を assert）。
- **browser 切替**: 単一ファイル内で `vi.hoisted` の可変フラグ + getter 形式の 1 個の `vi.mock` に統一。describe ごとに `beforeEach` でフラグを切替える。**同一モジュールへの 2 個目の `vi.mock` は作らない**（クランプの再発防止）。
- import 時の singleton 構築が SSR-safe になるよう、フラグ既定値は `false`（localStorage 未参照で構築）。main describe の `beforeEach` で `true` に切替える。

## 共通パターン（3 ファイル共通）

各テストファイルの mock を以下に置換する：

```typescript
// @vitest-environment jsdom
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
// … store imports

// import 時は browser=false（singleton は localStorage 非参照で構築）。
const browserState = vi.hoisted(() => ({ value: false }));

vi.mock('$app/environment', () => ({
  get browser() {
    return browserState.value;
  },
}));
```

- main describe の `beforeEach`: `browserState.value = true; localStorage.clear();`（+ 必要に応じ fresh store 生成）
- SSR describe の `beforeEach`: `browserState.value = false;`（既存の `vi.restoreAllMocks()` / 2 個目の `vi.mock` は削除）
- `afterEach`: `localStorage.clear();`（旧 `vi.unstubAllGlobals()` は不要）

## Phase 1: production の export 追加（低リスク・加算のみ）

**対象**: `src/features/workbooks/stores/replenishment_workbook.svelte.ts`

`ReplenishmentWorkBooksStore` クラスが未 export のため、テストで fresh インスタンスを作れず `loadInitialState` の invalid-data catch 分岐を真に検証できない。他 2 store（`ActiveContestTypeStore` / `ActiveProblemListTabStore`）と同様に**クラスも named export** する（singleton export はそのまま）。

```typescript
export class ReplenishmentWorkBooksStore { … }        // 既存 class に export を付与
export const replenishmentWorkBooksStore = new ReplenishmentWorkBooksStore();
```

## Phase 2: 3 テストファイルの改修

いずれも上記「共通パターン」を適用し、localStorage を実 Storage に置換する。

### `src/features/tasks/stores/active_contest_type.svelte.test.ts`

- `mockLocalStorage` / `mockStorage` / `vi.stubGlobal` / `vi.unstubAllGlobals` を削除。
- `beforeEach`: `browserState.value = true; localStorage.clear(); store = new ActiveContestTypeStore(); store.reset();`
- "invalid localStorage key" / "with null": `mockStorage[...] = …` を `localStorage.setItem('contest_table_providers', JSON.stringify(...))` に置換 → `new ActiveContestTypeStore()` が browser=true で実際に getItem を読み、invalid → default 'abs' の分岐を真に通す。
- 追加: `set()` が localStorage に永続化することを 1 件状態 assert（例 `set('abc319Onwards')` 後 `JSON.parse(localStorage.getItem('contest_table_providers')!) === 'abc319Onwards'`）。
- SSR describe: `beforeEach` を `browserState.value = false;` のみに（`restoreAllMocks` と 2 個目の mock を削除）。singleton `activeContestTypeStore.get()` は import 時構築の 'abs' を返す。

### `src/features/workbooks/stores/replenishment_workbook.test.ts`

- 未使用になる `type Mock` import を削除。`mockLocalStorage` / `vi.stubGlobal` を削除。
- `beforeEach`: `browserState.value = true; localStorage.clear(); replenishmentWorkBooksStore.reset();`
- `test.skip('persists state in localStorage')` を **un-skip し状態 assert に書換え**：
  ```typescript
  replenishmentWorkBooksStore.toggleView(); // false -> true
  expect(localStorage.getItem(localStorageKey)).toBe(JSON.stringify(true));
  replenishmentWorkBooksStore.toggleView(); // true -> false
  expect(localStorage.getItem(localStorageKey)).toBe(JSON.stringify(false));
  ```
- "handles invalid localStorage data" を Phase 1 の export を使い実分岐化：
  ```typescript
  localStorage.setItem(localStorageKey, 'invalid-json');
  expect(new ReplenishmentWorkBooksStore().canView()).toBe(false); // loadInitialState の catch を通す
  ```
- `toBeFalsy()` → `toBe(false)`（testing.md のアサーション規約に整合）。
- SSR describe: `beforeEach` を `browserState.value = false;` のみに。

### `src/test/lib/stores/active_problem_list_tab.svelte.test.ts`

- `mockLocalStorage` / `mockStorage` / `vi.stubGlobal` / `vi.unstubAllGlobals` を削除。
- `beforeEach`: `browserState.value = true; localStorage.clear(); store = new ActiveProblemListTabStore(); store.reset();`
- 追加: `set()` の localStorage 永続化を 1 件状態 assert。
- SSR describe: `beforeEach` を `browserState.value = false;` のみに。singleton `.get()` は 'contestTable'。

## Phase 3: testing.md のルール更新（低リスク）

**対象**: `.claude/rules/testing.md` の "Test Environment" 節。

「jsdom を残せば browser 分岐が守られる」の記述を実態に合わせ、真の落とし穴を明文化する：

- 同一ファイルで `vi.mock('$app/environment')` を **2 回登録しない**。全 `vi.mock` はホイストされ後勝ちのため、SSR describe 内の `{browser:false}` がトップの `{browser:true}` を黙って上書きし、全テストが browser=false に固定され browser 分岐カバレッジが落ちる。
- browser を describe ごとに切替えるには **1 個の動的 mock**（`vi.hoisted` フラグ + `get browser()`）を使い、フラグを `beforeEach` でトグルする。既定値は false にして import 時 singleton 構築を SSR-safe に保つ。
- jsdom オプトインファイルでは localStorage は `vi.stubGlobal` でモックせず jsdom の実 Storage を使い、状態ベースで検証する。

## 検証（Verification）

1. `pnpm vitest run src/features/tasks/stores/active_contest_type.svelte.test.ts src/features/workbooks/stores/replenishment_workbook.test.ts src/test/lib/stores/active_problem_list_tab.svelte.test.ts` — 全 pass。旧 skip テストが実行され pass することを確認（skipped 0）。
2. **browser 両分岐の実行確認**: main（browser=true）の永続化 assert が pass ＝ localStorage 分岐が実際に走る。SSR（browser=false）テストも pass。
3. **カバレッジ回帰確認**: `pnpm coverage` で 3 つの store source（`active_contest_type.svelte.ts` / `replenishment_workbook.svelte.ts` / `active_problem_list_tab.svelte.ts` と `local_storage_helper.svelte.ts`）の `localStorage.getItem`/`setItem` 行が **covered**（従来 0）になることを確認。
4. `pnpm lint` / `pnpm check` — 未使用 import（`Mock` 等）除去後にクリーン。
5. `pnpm test:unit` フルラン — 他テストへの回帰なし。
6. `pnpm format`（コミット前）。

**フォールバック**: 万一 `import { browser }` が getter を live binding として拾わない場合（環境依存の可能性は低い）、各ファイルの SSR describe を `browser:false` 固定のトップレベル `vi.mock` を持つ別 `*.test.ts` に分離する方式に切替える（ホイスト衝突が原理的に起きない）。

## 実装結果（2026-07-13）

### 実施内容

- **Phase 1**: `ReplenishmentWorkBooksStore` に `export` を付与（singleton export は据え置き）。
- **Phase 2**: 3 テストファイルを共通パターン（`vi.hoisted` フラグ + getter 形式の単一 `vi.mock`）に統一。`vi.stubGlobal('localStorage', …)` / `mockStorage` / `vi.unstubAllGlobals` / `vi.restoreAllMocks` / 未使用の `type Mock` import をすべて削除し、jsdom の実 Storage による状態ベース検証に置換。`test.skip('persists state in localStorage')` を un-skip。`toBeFalsy()` → `toBe(false)`。
- **Phase 3**: `.claude/rules/testing.md` の "Test Environment" 節に "Toggling `browser` per describe" 小節を追加（2 重 `vi.mock` 禁止 + 単一動的 mock のコード例 + `vi.stubGlobal` 不使用の方針）。

### 計画からの変更点

- **SSR describe を singleton assert → fresh インスタンス assert に変更**（ユーザー判断）。localStorage にデータを入れた状態で `new XxxStore()` を browser=false で生成し default が返ることを assert する。SSR 経路（localStorage 無視）を実際に通すうえ、singleton の残留状態＝テスト実行順序への依存が消える。`activeContestTypeStore` / `activeProblemListTabStore` の singleton assert は「import 時構築が SSR-safe」の確認として SSR describe に併存させた（main describe が singleton を触らないため順序非依存）。
- **カバレッジ穴埋めのテストを追加**（当初計画に無し）。実装後の実測でまだ 0 だった分岐：
  - `local_storage_helper.svelte.ts` の `getInitialValue` catch（不正 JSON）→ active_contest_type に `'invalid-json'` ケース追加。計画の "invalid localStorage key" は**正当な JSON**（`JSON.stringify('invalidContestType')`）なので catch を通らない。
  - `browser=false` 時の書き込みガード（`toggleView` / setter の `if (browser)` false 側）→ 各 SSR describe に「set/toggle しても `getItem` が null のまま」を追加。
  - replenishment の「localStorage が空」ケース（`savedStatus ? … : false` の null 側）。

### 検証結果

- 対象 3 ファイル: **36 passed / 0 skipped**（旧 `test.skip` は実行され pass）。
- スコープ付きカバレッジ（4 つの store source）: **Statements 100% / Lines 100% / Functions 100% / Branches 92.59%**（従来 localStorage 行は 0）。残る未カバー 2 分岐は `getActiveContestTypeStore` / `getActiveProblemListTabStore` の `if (!instance)` false 側（singleton メモ化）で、追試の価値なしと判断。
- `pnpm lint` クリーン / `pnpm check` 0 errors（30 warnings は既存の無関係な route ファイル）。
- `pnpm test:unit` フルラン: **80 files / 2757 passed**、回帰なし。
- フォールバック（SSR を別ファイルに分離）は**不要**だった。`import { browser }` は ESM live binding として getter を毎回評価するため、`vi.hoisted` フラグの切替えがそのまま効く。

### novel lessons

- `vi.mock` の 2 重登録は**エラーにも警告にもならず**、後勝ちで静かにクランプする。テストは緑のまま分岐カバレッジだけが落ちるため、レビューでもすり抜ける。`grep -c "vi.mock('\$app/environment'" <file>` が 2 以上なら赤信号（実施時点で該当は本 3 ファイルのみ）。
- 「invalid な値」テストを書くときは**どの分岐を狙っているか**を区別する。ドメイン的に不正（`'invalidContestType'`）と JSON として不正（`'invalid-json'`）は別の分岐で、前者だけでは parse の catch を通らない。
- テストの skip 理由コメントは真因の記録として信用できない（本件の「JSDOM では localStorage をモックできない」は誤り。真因は browser クランプ）。

## 却下した代替案

- **node + モック localStorage（spy 検証）へ移行**: perf は微増するが jsdom が不要化し「C = jsdom を意味あるものにする」趣旨に反する。localStorage 分岐を実 Storage で状態検証する今回方針の方が実態に忠実。
- **現状維持 + テスト名だけ修正**: browser クランプという真因を放置し、カバレッジ 0 のまま。

## QA（真因メカニズムの要約）

**Q. `vi.mock` の「ホイスト」とは？**
Vitest はファイル変換時に全 `vi.mock(...)` を `import` より上へ機械的に巻き上げる。`import`（ESM）はコードより先に評価されるため、モック登録が手遅れにならないようにする措置。`beforeEach` や `describe` の内側に書いた `vi.mock` も同様に巻き上げられ、**「その行に来たとき」ではなく全テストより前に一度だけ実行される**（Vitest も "not at the top level ... hoisted and executed before any tests run" と警告）。

**Q. 「同一モジュールで後勝ち」とは？**
本 3 ファイルは `$app/environment` を 2 回モックしている（先頭 `{browser:true}`、SSR describe の `beforeEach` 内 `{browser:false}`）。両方が巻き上げられ、同一モジュールのモック登録は 1 つだけ保持される → **後に登録した `{browser:false}` が先の `{browser:true}` を上書き**。結果、SSR describe だけでなく browser=true を期待していたメイン describe も含め、**ファイル全体で `browser=false`** に固定される（実測 `PROBE-MAIN browser = false`）。

**Q. 「全テストが browser=false」＝ 実質 store をテストしていない？**
概ね正しい（テストは緑だが肝心の分岐に未到達）。store は `browser` で SSR 経路（デフォルト返却）と localStorage 経路を分けている。`browser=false` 固定のため：

- コンストラクタの `getInitialValue` は `localStorage.getItem` を通らず即デフォルト返却
- setter/`toggleView` の `localStorage.setItem` も未実行

→ **ストアの存在意義である localStorage 読み書きが一行も実行されていない**。`stubGlobal('localStorage', …)` の足場も store 経由では呼ばれず空回り。例えば "invalid localStorage key" テストは `mockStorage` を読まずデフォルトを返すだけで pass する **false-positive**。皮肉にも `19411e5b` が「browser 分岐カバレッジを守るため」に付けた jsdom も、browser=false ゆえ localStorage コードが走らず無効化している。これが本計画で直す本体。
