# リファクタリング

## TODO

- [ ] UI の修正
  - [ ] `src/routes/(admin)/workbooks/order/\_components/KanbanTabBar.svelte`
    - [ ] タブの余白が消えているので、/workbooks とスタイルを合わせる
    - [ ] 表示カテゴリ、グレードのボタンの色をタブの配色と合わせる + ホバーしたときライトモードでは、緑系の文字でハイライト
- [ ] テストの追加・補強
  - [ ] `src/routes/(admin)/workbooks/order/_utils/kanban.ts` のテストを書くように指示したのに書かれていないので必ず正常系・異常系・境界値の単体テストを書く
- [ ] `src/routes/(admin)/workbooks/order/+server.ts`
  - [ ] validateAndUpdatePlacements() で null を返す仕様になっているが、空白文字（``）ではダメなのか? null チェックが必要な状況は、null pointer? バグの温床となってよくないのでは?
  - [ ] 上記の戻り値は実際にはエラーメッセージなのに `result` だと意味不明な上に、実態と乖離しているので、`errorMessages` といった命名にする
- [ ] `src/routes/(admin)/workbooks/order/+page.svelte`
  - [ ] h2 タグを使っているが <HeadingOne title="" /> をインポートして使う
- [ ] `src/routes/(admin)/workbooks/order/+page.server.ts`
  - [ ] await createInitialPlacements(); を呼び出している側でエラーハンドリングしていない気がする。管理者画面だけなので不要ということ? 失敗しても、success = true になっていませんか?
- [ ] `src/routes/(admin)/workbooks/order/_utils/kanban.ts`
  - [ ] `calcPriorityUpdates`
    - [ ] 命名が英語的に不自然に感じられるので、`updatePriority` か `updatePriorities` もしくは `reCalcPriority` か `reCalcPriorities` の方がいいのでは?
    - [ ] `enumKeys` は技術用語に寄り過ぎているので、`columnKeys` とした方がいいのでは?
    - [ ] columnKey: 'solutionCategory' | 'taskGrade', はハードコードになっているので、型を定義もしくは既存の型を使用
    - [ ] PlacementUpdate[] は複数形を定義するか、定義済みの型を使う
    - [ ] isChanged が true のときの処理で、'solutionCategory' と 'taskGrade' が null で埋められているが処理的にいいのか? DBで両方 null となる違反が生じる可能性はないか?
    - [ ] for 文の処理をしているが、関数ベースで書くのは妥当?
  - [ ] `saveUpdates`
    - [ ] クライアント側とはいえ、HTTPS 通信をしていると思うが、utils 層が責務として妥当?
    - [ ] `res` のように省略すると意味不明なので、`response` と書くべきでは?
    - [ ] あと、1文でif () returnは禁止。 if () { return hoge} と必ず書く。
- [ ] `src/routes/(admin)/workbooks/order/_types/kanban.ts`
  - [ ] TabConfig の columnKey: 'solutionCategory' | 'taskGrade'; がハードコードになっているようなので型定義をする
  - [ ] PlacementUpdate の複数形を定義して、PlacementUpdate[] の代わりに使う
  - [ ] SortableProps の属性の違いが分からないのでコメントを入れるか、より明示的な変数に書き換える
- [ ] src/routes/(admin)/\_utils/auth.ts は単体テストを追加しなくて良いのか? 逆に、redirect などがあるのでテストしづらい?
- [ ] src/routes/(admin)/workbooks/order/\_components/KanbanColumn.svelte
  - [ ] Props が適当に並んでいるので、意味が識別できるような単位で並び替えて
  - [ ] カラム内にあるカード数を表す数を右寄せにして、数字自体ももう少し大きくして
- [ ] src/routes/(admin)/workbooks/order/\_components/KanbanTabBar.svelte
  - [ ] Props が肥大化しているので、意味のある単位で型を定義すべきでは? オーバーエンジニアリングならそのままで
  - [ ] 'PENDING'はハードコードなので、TaskGrade や SolutionCategory 型を使う
- [ ] src/routes/(admin)/workbooks/order/\_components/KanbanCard.svelte
  - [ ] Props が肥大化しているので、意味のある単位で型を定義すべきでは? オーバーエンジニアリングならそのままで
  - [ ] PublicationStatusLabel と WorkbookLink は別の行に分ける
- [ ] src/routes/(admin)/workbooks/order/\_components/KanbanBoard.svelte
  - [ ] solutionBoard() や curriculumBoard() が snippet として残っているは、KanbanTabBar に移動すると、データの引き渡しや動的な更新が困難になるため? そうであるなら、コメントとして残しておいてほしい。簡単に移動できるなら、分離した方が良さそう
  - [ ] TypeScript で書かれている部分が相当に汚いです。内部の状態を保持している関係上やむを得ない?
    - [ ] 例: state は \_store ディレクトリに切り出すのは妥当?
    - [ ] state のハードコードも型定義を使う
    - [ ] updateUrl は $page.url を使っているので状態が保持されているように思う。引数として、urlを持てば\_utilsに移動できて、単体テストもしやすいのでは? 状態管理と密接なせいで、分離が困難ならそのままで、コメントは残しておいて。
    - [ ] tabConfigs は定数か汎用関数に移動すべきでは?
    - [ ] SolutionCols は意味不明なので、SolutionCategory や SolutionCategories とすべきでは? 一般的ではない省略形は禁止
- [ ] src/routes/(admin)/workbooks/order/\_components/ColumnSelector.svelte
  - [ ] 最小限が2つなっている理由を英語で明記(plan.mdやdecisions.md に明記してあるはずのなので)
  - [ ] 22行目のような 1行リターンは厳禁。冗長でも、if () { return } にする
  - [ ] ボタンの色をgreen ではなく、primary を使う
- [ ] src/features/workbooks/zod/schema.test.ts
  - [ ] workBookPlacementSchema は、 workbook schema の外側に配置すべきでは?
- [ ] src/features/workbooks/services/workbook_placements.ts
  - [ ] workBookType がハードコードになっているので、src/features/workbooks/types/workbook.ts の WorkBookType を使うべきでは?
  - [ ] getWorkBookPlacements はメソッド名がわかりづらくない? 問題集の種類を指定していることを含めた命名にして
  - [ ] upsertWorkBookPlacements の PlacementInput[] は複数形の型を使って。なければ定義して、/types に入れて。
  - [ ] UnplacedCurriculumRow[] も上記と同様
  - [ ] buildTasksByTaskId が二重 for 文になっているけど、もっと関数型っぽくシンプルに書けないかな?
  - [ ] buildTasksByTaskId だと、責務が違うのかなと思ってしまいます。また、unplaced curriculum workbook rows であることが分からないので、もう少しわかりやすい命名にして
  - [ ] Hoge[] は、複数形の型を src/features/workbooks/types/workbook_placement.ts から参照して使うか、なければ同ファイルで定義して使うようにして。
  - [ ] groupWorkbooksByGrade メソッドとしてはかなり汚い書き方に見えます。同等の内容を関数型でシンプル書き直して。
  - [ ] createInitialPlacements が未だに肥大化したメソッドなので、単一責務となるようにメソッドを分割して。前も指示したはずですが、ignore され続けています。また、メインのメソッドが先で、サブメソッドはその後になるようにしてほしい。
  - [ ] validateAndUpdatePlacements や も上記と同様。
  - [ ] またファイル内全体で、initialize 相当のメソッドが下の方にあるのはかなり違和感しかありません。getAll 相当のメソッドのように 最もシンプルな CRUD が先頭に来るのは自然ですが、メソッドの順番を使う順番となるように、もう少しよく考えてほしい。例えば以下のような順番はどうだろうか?
    - [ ] 基本的なCURD
    - [ ] カリキュラム
      - [ ] 初期化
      - [ ] 更新系
    - [ ] 解法別
      - [ ] 初期化
      - [ ] 更新系
    - [ ] カリキュラムと解法別に共通する処理
    - [ ] seed.ts 専用
- [ ] src/features/workbooks/services/workbook_placements.test.ts -[ ] src/features/workbooks/services/workbook_placements.test.ts のテストも src/features/workbooks/services/workbook_placements.ts を意味のある順序に並びかえたものと対応すように並べ直して
  - [ ] テストデータは基本的に、src/features/workbooks/fixtures/workbooks_placements.ts を新設して移動させて。
  - [ ] src/features/workbooks/fixtures/workbooks_placements.ts の に対応したテストが全て書かれていないように思うので、不足しているテストは追加して
  - [ ] vi.mocked(prisma.workBookPlacement.findMany).mockResolvedValue(
        mockPlacements as unknown as Awaited<ReturnType<typeof prisma.workBookPlacement.findMany>>,
        ); のような記述が何回も書かれているのはテストコードあっても流石に無駄なのでは? vitest の制約?
  - [ ] expect(result).toEqual(mockPlacements); はテストしていないと同じでは? 私の勘違いかな? 直後のexpect でカバーされているので不要では?
  - [ ] initializeCurriculumPlacements や initializeCurriculumPlacements with fixture-based task data のテストデータが未だに杜撰すぎます。prisma/tasks.ts や src/features/workbooks/fixtures/workbooks.ts のデータを参照するように何回も指示したのに、なぜ守られていないのですか?
  - [ ] expect(isValid).toBeTruthy(); ではなく ,toBe(true) を使うべきでは?
  - [ ] validateAndUpdatePlacements では、ハードコードされているので、TaskGrade や SolutionCategory、WorkBookType 型を使う
  - [ ] const byId = new Map(result.map((r) => [r.workBookId, r])); のような1文字変数は禁止したはず。意味のある命名にしてほしい
- [ ] prisma/seed.ts の addWorkBookPlacements で、未だに CRUD が直書きされています。何回も指示したのに ignore してているのはあなた悪意からですか? 必ず service 層からインポートして使って。ないなら、service で定義して。
- [ ] 全体的なルールとして、.svelte は薄くしつつ、/types、/utils、/stores などの責務の分割して、単体テストを追加する

- [ ] ドキュメントの更新（上記が完了したら実行）
  - [ ] `docs/guides/architecture.md` に `_types/`, `_utils/` ディレクトリの規約を追記
  - [ ] コンポーネントはできるだけシンプルにする。型宣言や汎用的な処理などは書かずに、`types/` もしくは `_types/`, `utils/` もしくは `_utils/` に入れる
  - [ ] 汎用的な処理に対しては、単体テストを書く
  - [ ] service 層以外での CRUD 直書きを禁止するルール（`.claude/rules/` など）を明記
  - [ ] 毎回指示している内容を規約などに明記して確実に実行されるようにする
    - [ ] 忖度せずに批判的な観点からレビューする
    - [ ] プロダクションコードのとテストを実装し、全てのテストケースか通過したら、TODO リストの更新と汎用的な教訓を手短にまとめる + 設計の意思決定は残す + 教訓を各種ファイルに追加・要約・更新して反映させた後で、古くなったTODOは破棄
  - [ ] Claude Code の拡張ポイント（`.claude/rules/`, subagents, custom commands, skills, hooks など）を調査し、本リファクタリングで特定された繰り返しパターンに対して、次回以降は自律的に修正できるようにする

---

## 方針・指針

### フェーズ設計

- 変更リスクの低い順（局所的・最小リスク → 構造的・広範囲）にフェーズを並べる
- 各フェーズの依存関係を明示し、後続フェーズの前提条件を明確にする

### snippet vs コンポーネントの判断軸

snippet を第一選択とする条件:

1. 親の `$state` に直接アクセスが必要（コンポーネント化すると props が多数必要になる）
2. 独自の状態やライフサイクルを持たない純粋な表示ロジック
3. 同一ファイル内の限定的な DRY 化が目的（他ファイルからの再利用なし）

コンポーネントに昇格する条件:

- 独自の状態管理・ライフサイクルが必要になった場合
- 約30行を超えた場合（認知負荷の閾値）

### DB への CRUD は service 層に集約

- seed・ルートハンドラは service を呼ぶだけにする
- HTTP 層のエラー処理を service 層で引き取る際は `Response` / `json()` を持ち込まず、`{ error: string } | null` の純粋な値を返す設計にする

### やらないと決めた方針

- ページファイルが小さい（25行程度）場合は snippet 化しない
- seed は統合テスト相当のため単体テスト対象外
- DnD UI の Playwright テストは mouse + @dnd-kit が不安定なため除外
- 型制約で安全なハードコード定数の置換は優先度を下げる

---

## 技術的教訓

### TypeScript

- Prisma enum とアプリ enum は構造が同じでも TypeScript は別型として扱う。キャストが必要な箇所は残すこと
- `as never` の代替: `as unknown as Awaited<ReturnType<typeof prisma.xxx.findMany>>`
- 関数引数の `as never` は構造的部分型付けで除去できることが多い（余剰プロパティは変数経由なら許容）
- ユーティリティ関数の引数型は「実際に使うフィールドの最小型」に絞る → 呼び出し元のキャストが不要になる
- `Parameters<typeof fn>[0]` で型定義の二重管理を避ける

### Svelte 5

- `$state()` の初期化式で `$props()` の値を参照すると「This reference only captures the initial value」警告が出る。意図的な場合は `untrack(() => ...)` でラップする
- `{#snippet}` はコンポーネントタグの外（トップレベル）に定義する。タグ内に書くと named slot として解釈されて型エラーになる
- `{#each}` 内で同じ式を複数回参照する場合は `{@const}` で単一評価にまとめる
- コンポーネントが内部で `{#if}` を持つ場合、呼び出し元でのラッパーは不要

### 状態管理

- タブ系の状態は `Record<string, T>` に統合すると `if (activeTab === '...')` 分岐が消える
- タブごとに変わる「純粋な設定値（state でないもの）」は `TabConfig` に集約し、プロパティアクセスで分岐を排除する
- `onDragEnd` 等で影響範囲を手動管理する代わりに、ドラッグ開始時の snapshot と現在の Record を比較して変更箇所を検出する

### テスト

- テストデータには抽象的な値（`'t1'`, `'t2'`）より実際の fixture に存在する値を使う。仕様変更時に整合性チェックになる
- URL 同期は初回ロード時には発生しないため、URL パラメータより UI 状態（表示されるべき要素の存在）で検証する
- E2E でセッション Cookie が必要な fetch テストは、`beforeEach` でページを goto してセッションを確立してから発行する

### seed

- seed 固有の知識は service 層に持ち込まない
- service は汎用的な初期値で初期化し、seed 側でオーバーライドするパターンで関心の分離を保つ

### CSS / Tailwind

- 同じ CSS プロパティを複数クラスで指定すると競合警告が出る。置換後は VSCode の cssConflict 診断で即時確認する
- 競合するクラスは片方だけでなく両方を削除して、意図するクラスだけを残す

---

## 出典

- [SvelteKit Form Actions](https://svelte.dev/docs/kit/form-actions) — フォームアクションの仕組み（fetch vs form action の判断根拠）
- [SvelteKit Routing - server](https://svelte.dev/docs/kit/routing#server) — `+server.ts` の仕様（JSON API エンドポイントの採用根拠）
- [Svelte 5 Snippets](https://svelte.dev/docs/svelte/snippet) — snippet の仕様（snippet vs コンポーネント判断）
- [Svelte 5 Component Basics](https://svelte.dev/docs/svelte/svelte-components) — コンポーネント分割の基準
- [@dnd-kit/helpers `move()`](https://github.com/clauderic/dnd-kit/tree/master/packages/helpers) — flat array vs Record の挙動の違い
- [dnd-kit-kanban 参照リポジトリ](https://github.com/KATO-Hiro/dnd-kit-kanban) — Record ベースのカンバン実装例
- [Playwright Locators](https://playwright.dev/docs/locators) — ロケータの優先順位（E2E テストの設計方針）
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) — テスト設計のベストプラクティス
- [Superforms Nested Data](https://superforms.rocks/concepts/nested-data) — `dataType: 'json'` の仕様（不採用の根拠）
