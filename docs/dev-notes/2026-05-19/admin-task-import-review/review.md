# コードレビュー妥当性評価: 管理者タスクインポート周辺

対象ファイル:

- `src/lib/clients/fixtures/record_requests.ts`
- `src/routes/(admin)/tasks/_utils/contests.ts`
- `src/routes/(admin)/tasks/[task_id]/+page.server.ts`
- `src/routes/(admin)/tasks/+page.server.ts`
- `src/routes/(admin)/tasks/+page.svelte`

---

## Finding 1: `record_requests.ts` — 非決定的サンプリング + 参照整合性

**有効性: 部分的に有効、優先度は低い**

コードを確認。`getRandomElementsFromArray`はMath.random()を使用しており非決定的であることは事実。ただし：

- このファイルはフィクスチャ**記録スクリプト**（`pnpm dlx vite-node` で手動実行）であり、生成後のJSONファイルはgit管理されている
- テスト自体はnockで固定JSONをリプレイするため、スクリプトの非決定性はコミット後に影響しない
- 参照整合性の懸念（タスクが存在しないコンテストを参照）は実際に起こりうるが、AtCoderのfixture用途でこれが問題になるユースケースがコード内に見当たらない

再現性向上のためsort+sliceに変えることに害はないが、緊急性は低い。

---

## Finding 2: `contests.ts` — 空白文字列の扱い

**有効性: 有効（ただし一部過剰）**

`!query`はスペースのみの文字列を「クエリあり」と判定し、フィルタが何もヒットしない状態になる。実用上の不具合。修正は簡単。

ただし「undefined/nullのguardを追加せよ」という提案は不要。型シグネチャが`query: string`であり、呼び出し元も`$state('')`で常にstring。TypeScriptが保証している。

---

## Finding 3: `[task_id]/+page.server.ts` — Superforms + Zodに置き換え

**有効性: 低い（YAGNI）**

現在のコードはシンプルで正しく動作している。フィールドは2つ（`task_id`, `task_grade`）のみ。Superformsに書き換えるコストに見合うメリットがない。AGENTS.mdは「Prefer simplicity over pathological correctness. YAGNI, KISS」と明示している。

また、Finding 4（params.task_idの使用）が本質的な問題であり、そちらを修正すれば`task_id`のバリデーション自体が不要になる。

---

## Finding 4: `[task_id]/+page.server.ts` — params.task_idを使うべき

**有効性: 有効**

現在の実装はルートパラメータ`params.task_id`を無視してフォーム値の`task_id`を信頼している。管理者が別タスクのIDを送信できてしまう。管理者限定ではあるが、意図せぬ操作が可能な点は問題。修正も単純。

---

## Finding 5: `+page.server.ts` (fetch/create) — Superforms + Zodに置き換え

**有効性: 低い（過剰設計）**

Finding 3と同じ理由。さらにここでは`tasks`フィールドがJSON文字列としてシリアライズされて送られており、Superformsのzodスキーマと相性が悪い（`z.preprocess`でJSONパースが必要になる等）。現状のバリデーションは十分機能している。大規模リファクタのコストに見合わない。

---

## Finding 6: `+page.server.ts` (create) — クライアント提供データを信頼するな

**有効性: 技術的には正しいが実装提案が非現実的**

タスクデータがクライアントから戻ってくることは確かであり、原則論としては正しい。ただし提案する「task.idで外部APIを再フェッチ」は：

1. タスクごとにAPIコールが発生しコストが爆増する
2. フェッチしたデータを一時的にサーバーサイドにキャッシュする設計が別途必要
3. 管理者限定のフローであり、実際の攻撃面は非常に限定的

現実的な代替案（セッションでfetch結果をキャッシュする等）は現行アーキテクチャに存在しない。提案そのままの実装は難しい。

---

## Finding 7: `+page.server.ts` — `sha256(contest_id + task.title)` → `sha256(contest_id + task.id)` に変更

**有効性: 有効、変更安全（初回評価を修正）**

### 初回評価の誤り

「DBマイグレーションなしには適用できない」と評価したが、これは誤りだった。

調査の結果、`id`（sha256ハッシュ）はCRUDで一切参照されていないことが判明：

| フィールド | 役割 | CRUDでの使用 |
| --- | --- | --- |
| `id` | PK（sha256ハッシュ） | **なし**（書き込まれるが読まれない） |
| `task_id` | 外部識別子（`abc001_a`等） | 全検索・更新・リレーション |

また `filterUnregisteredTasks` が `task_id` で登録済みチェックを行うため、既存レコードは再インポート対象から除外される。よって **ハッシュ生成ロジックを変更しても既存DBへの影響はゼロ**。

### 衝突リスクの実例

AOJの同一コンテスト内に同一タイトルの問題が存在することが実際に判明（task ID: 4076, 4080）。`sha256(contest_id + task.title)` では同一の `id` が生成され、DB unique制約違反かサイレントな上書きが起こりうる。`task.id`（AOJでは問題番号）はコンテスト内でユニークであるため、衝突は起きない。

### 結論

変更は安全に実施できる。実害が確認されたため優先度を引き上げる。

---

## Finding 8: `+page.svelte` — ソース切り替え時にimportContestsをリセット

**有効性: 有効**

`selectedSource`を切り替えても`importContests`は古いデータのまま残る。TaskTableForImportは`source={selectedSource}`を受け取るため、AtCoderのコンテスト一覧を表示した状態でAOJに切り替えてインポートを実行すると、`source=aoj`でAtCoderのデータを送信するという誤インポートが実際に起こりうる。修正は2行追加で済む。

---

## まとめ

| #   | 対象                                      | 有効性                   | 優先度 | 方針         |
| --- | ----------------------------------------- | ------------------------ | ------ | ------------ |
| 1   | `record_requests.ts` 非決定的サンプリング | 部分的                   | 低     | 任意対応     |
| 2   | `contests.ts` 空白文字列                  | 有効（guard不要）        | 中     | trimのみ修正 |
| 3   | `[task_id]` Superforms化                  | 無効（YAGNI）            | —      | スキップ     |
| 4   | `[task_id]` params.task_id使用            | 有効                     | 高     | 修正する     |
| 5   | `+page.server.ts` Superforms化            | 無効（YAGNI）            | —      | スキップ     |
| 6   | create クライアントデータ再検証           | 原則正しいが提案非現実的 | —      | 要議論       |
| 7   | sha256 task.id使用                        | 有効・変更安全（初回評価誤り） | 高（実害確認済） | 修正する     |
| 8   | ソース切替リセット                        | 有効                     | 高     | 修正する     |
