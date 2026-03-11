# リファクタリング（workbook order 機能）

workbook order 機能のリファクタリング記録。
Phase 0–10 の全タスク完了済み。

---

## リファクタリング対象の見つけ方

次のリスク順に調査する。各カテゴリで問題が見つかれば修正フェーズを設ける。

### 1. 命名・スタイル（最小リスク・局所的）

- 省略形・1文字変数（`res`, `r`, `btn` 等）→ 完全な名前に修正
- 1文 `if` のブレース省略 → ブレースを追加
- ハードコード文字列 → 型定義の enum 定数に置換
- `toBeTruthy()` / `toBeFalsy()` → `toBe(true)` / `toBe(false)`

### 2. 型定義の整理

- `Hoge[]` が直接使われている → 複数形型エイリアスを定義
- 型のハードコード（`'solutionCategory' | 'taskGrade'` のような union） → 型エイリアスに抽出
- 関数引数の型が広すぎる → 「実際に使うフィールドの最小型」に絞る

### 3. 純粋関数の抽出（テスト可能性の確保）

- 副作用（URL 操作・DB アクセス・fetch 等）とビジネスロジックが混在している
  → ビジネスロジックを副作用のない純粋関数として `_utils/` に抽出
- 関数を `_utils/` に抽出したら **同時に** テストを追加する（後回しにしない）

### 4. コンポーネントの肥大化

- `<script>` 内に静的設定定数が書かれている → `_utils/` の定数に移動
- `<script>` 内に変換・計算ロジックが書かれている → `_utils/` の純粋関数に移動
- snippet かコンポーネントか迷う箇所 → `svelte-components.md` の判断軸を適用

### 5. サービス層の構造を再構成

- DB クエリ・ビジネスロジック・DB 書き込みが1関数に混在 → 責務別に分割
- ルートハンドラや seed が Prisma を直接呼んでいる → service 層に集約
- service 関数が `Response` / `json()` を返している → `{ error: string } | null` に変更

### 6. 単体テストの整備

- 抽象的なテストデータ（`'t1'`, `'t2'`） → 実 fixture の値を使用
- テストデータが複数のテストケースで重複 → fixture ファイルに抽出
- 同じ mock パターンが複数回出現 → テスト内ヘルパー関数に抽出
- 未テストの `_utils/` 関数がある → テストを隣接追加

### 7. ドキュメント更新（最後）

- `.claude/rules/` などに反映すべき新しいパターンがあれば追記
- 次回に活用できる教訓を記録し、作業計画（本ファイル）は要約して整理

---

## 方針・指針

### フェーズ設計

- 変更リスクの低い順（局所的・最小リスク → 構造的・広範囲）にフェーズを並べる
- 各フェーズの依存関係を明示し、後続フェーズの前提条件を明確にする
- 「調査してから決める」タスクはフェーズに分ける（調査 → 実施 or スキップ）

### 純粋関数の抽出と副作用の分離

- 副作用（`replaceState`, fetch, DB アクセス等）を含む関数は、ロジック部分を純粋関数として `_utils/` に抽出してテスト可能にする
- `_utils/` に移動する純粋関数は、引数で依存を明示する（グローバル・ストアへの直接参照を避ける）
- 副作用は呼び出し元に残す。service 関数が HTTP 固有オブジェクト（`Response`）を返すのも同様に分離する

### 静的設定定数の配置

- 静的設定（タブ設定、ラベルマッピング等）はコンポーネントの `<script>` ではなく `_utils/` に置く
- `Record<EnumType, Config>` でキー型を enum にすることで文字列インデックスより型安全になる
- コンポーネントが担うのは「状態管理と描画」のみにする

### 状態管理の分岐削減

- タブ系の状態を `if (activeTab === '...')` で分岐する代わりに `Record<ActiveTab, T>` に統合するとすべての分岐が消える
- 「状態によって変わる値」と「状態に関係ない静的設定」を分けて考える

### サービス層の構造設計

- 公開 API（エントリーポイント）をファイル先頭に置き、プライベートなサブ関数を直後に配置する（「何をするか」が先に目に入る）
- 大きいファイルはセクションコメント（`// --- 1. CRUD ---` 等）で区切りナビゲーションコストを下げる

### テストを書かないと決めた基準

- seed は統合テスト相当のため単体テスト対象外
- ロジックが1行のみ（例: `if (!response.ok) throw`）で fetch モックのセットアップコストがテスト価値を上回る場合は E2E に委ねる
- 副作用のみでテスタブルなロジックがない関数（Lucia 設定、認証リダイレクト等）は対象外
- DnD UI の Playwright テストは mouse + @dnd-kit が不安定なため除外

---

## 技術的教訓

> 詳細なパターンは `.claude/rules/` 各ファイル参照。ここには rules に書きにくい補足のみ残す。

### TypeScript

- Prisma enum とアプリ enum は構造が同じでも TypeScript は別型として扱う。キャストは残すこと
- Prisma mock のキャスト定型: `value as unknown as Awaited<ReturnType<typeof prisma.xxx.findMany>>`
- `Parameters<typeof fn>[0]` で型定義の二重管理を避けられる

### Svelte 5

- `$state()` の初期化式で `$props()` の値を参照すると「This reference only captures the initial value」警告。意図的なら `untrack(() => ...)` でラップ
- `{#snippet}` はコンポーネントタグの**外**（トップレベル）に定義する。タグ内に書くと named slot として解釈されて型エラー

### 状態管理

- ドラッグ操作の変更検出: 影響範囲の手動追跡より「開始時の snapshot と現在の Record を比較」が安全で漏れがない

### テスト設計

- `Promise.all` で同一 mock 関数を複数回呼ぶ場合、`mockResolvedValueOnce` を呼び出し順に積み上げれば対応できる
- fixture を `.filter()` でサブセット化するとき、同じ ID でも fixture が更新されると別エンティティを指す可能性がある。フィルタ後の中身を必ず確認すること

### 命令型 → 関数型変換

- 二重ループで `Map` を構築する処理は `flatMap(...).map(...)` + `new Map(entries)` で書き直せる
- `flatMap` で条件を満たす場合だけ展開し、満たさない場合は `[]` を返すことで `filter → flatMap` を1ステップに統合できる

---

## 出典

- [SvelteKit Form Actions](https://svelte.dev/docs/kit/form-actions) — fetch vs form action の判断根拠
- [SvelteKit Routing - server](https://svelte.dev/docs/kit/routing#server) — `+server.ts` の仕様
- [Svelte 5 Snippets](https://svelte.dev/docs/svelte/snippet) — snippet の仕様
- [@dnd-kit/helpers `move()`](https://github.com/clauderic/dnd-kit/tree/master/packages/helpers) — flat array vs Record の挙動
- [dnd-kit-kanban 参照リポジトリ](https://github.com/KATO-Hiro/dnd-kit-kanban) — Record ベースのカンバン実装例
- [Playwright Best Practices](https://playwright.dev/docs/best-practices) — テスト設計のベストプラクティス
