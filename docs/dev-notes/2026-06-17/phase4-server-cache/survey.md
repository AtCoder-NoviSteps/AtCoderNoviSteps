# Phase 4：調査・前提条件・Fluid Compute 検討

> 本ドキュメントは [plan.md](./plan.md) の背景資料。実装手順は plan.md、設計判断は [design.md](./design.md) を参照。

## 背景

Phase 1〜3 で過剰取得・匿名キャッシュの最適化を完了。残る課題はサーバープロセス内での DB 再取得コスト。共有かつ低頻度更新のデータ（タスク全件、問題集一覧、投票統計）は warm インスタンス内でキャッシュが有効に働く。

## 前提条件と制約

**トラフィック規模（2026年5月実績）：**

- 月3.8万PV、日ユーザー200-300人
- Function Invocations: 月236k（日約8k、特異日で54k/日を記録）
- Function Duration: 84GB hrs / Fast Origin Transfer: 35GB
- ピーク時間帯: 昼12:00、夕方18:00、夜20:00 に集中

**プロセス内キャッシュの特性：**

- Vercel サーバーレス関数の warm インスタンス内でのみ有効。インスタンス間のメモリ共有はない
- コールドスタート時はキャッシュ空から開始。TTL はインスタンス生存時間（Vercel 側制御、通常数分〜十数分）が上限
- ピーク時間帯はリクエスト間隔が短く warm 維持が見込める。オフピーク時はキャッシュヒット率が低下する

**Phase 4 の効果範囲：**

| route                                         | 日リクエスト | Phase 4 対象関数                                             | 備考                                                                                                   |
| --------------------------------------------- | ------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `/problems`                                   | ~2k          | `getMergedTasksMap()` + `getVoteGradeStatistics()`           | 匿名ユーザーは CDN (`s-maxage=300`) でカバー済み。Phase 4 はログインユーザーのみに効く                 |
| `/workbooks` (一覧)                           | 不明         | `getWorkbooksByPlacement()` + `getWorkBooksCreatedByUsers()` |                                                                                                        |
| `/workbooks/create`, `/workbooks/edit/[slug]` | 低頻度       | `getTasksByTaskId()`                                         | 管理者のみ                                                                                             |
| `/workbooks/[slug]`                           | ~2k          | **対象外**                                                   | 個別取得（`getWorkbookWithAuthor` + `getVoteGradeStatisticsForTaskIds`）のため全件キャッシュは効かない |

---

## Fluid Compute の有効化を推奨

現在レガシーサーバーレスモデル（1インスタンス1リクエスト）を使用しているが、Fluid Compute への切り替えを推奨する。

- **課金面：** レガシーは wall-clock time × メモリで課金され、DB クエリの I/O 待ち時間も全額課金される。Fluid Compute は Active CPU（実際のコード実行時間のみ）+ Provisioned Memory で課金され、I/O 待ち中は CPU 課金が止まる。DB クエリ中心のこのアプリは I/O 比率が高く、コスト削減効果が大きい（[Fluid compute pricing](https://vercel.com/docs/functions/usage-and-pricing)、[Legacy pricing](https://vercel.com/docs/functions/usage-and-pricing/legacy-pricing)）
- **キャッシュ効果：** Fluid Compute の optimized concurrency により、複数リクエストが同一インスタンスを共有する。レガシーでは高トラフィック時にインスタンスが増えてキャッシュが分散するが、Fluid Compute ではインスタンス集約によりキャッシュヒット率が向上する（[Fluid compute docs](https://vercel.com/docs/fluid-compute)）
- **並行性リスク：** モジュールスコープの変数が並行リクエスト間で共有されるため、リクエスト固有の値をグローバルに書き込むコードは危険。ただし Phase 4 のキャッシュは read-heavy かつ冪等（同じ fetchFn 結果の書き込み）なので並行性の問題は起きない（[Vercel Fluid Compute Guide](https://getautonoma.com/blog/vercel-fluid-compute)）
- **切り替え：** プロジェクト設定 > Functions > Fluid Compute をトグル → Save → 再デプロイで反映。コード変更不要。2025年4月以降の新規プロジェクトではデフォルト有効（[What is Compute?](https://vercel.com/docs/functions/concepts)）

### コスト試算（2026年5月実績ベース）

前提：Function Duration 84 GB-hrs、Invocations 236k、メモリ 3008MB（≒2.94GB）、リージョン hnd1（東京）。DB クエリ中心のため Active CPU 比率は wall-clock の 25-40% と推定。wall-clock = 84 GB-hrs ÷ 2.94GB ≒ 28.6時間。

| モデル           | Function Duration                                    | Invocations             | 月額推定   | レガシー比 |
| ---------------- | ---------------------------------------------------- | ----------------------- | ---------- | ---------- |
| レガシー（現在） | 84 GB-hrs × $0.18 = $15.12                           | 236k × $0.60/1M = $0.14 | **$15.26** | 100%       |
| Fluid（CPU 40%） | CPU 11.4h × $0.202 + Mem 84 GB-hrs × $0.0167 = $3.71 | $0.14                   | **$3.85**  | 25%        |
| Fluid（CPU 25%） | CPU 7.2h × $0.202 + Mem 84 GB-hrs × $0.0167 = $2.86  | $0.14                   | **$3.00**  | 20%        |

東京リージョン（hnd1）は Active CPU $0.202/hr、Provisioned Memory $0.0167/GB-hr。メモリ 3GB ではレガシーの GB-hrs が wall-clock の 3 倍で積まれるのに対し、Fluid Compute は Provisioned Memory 単価が大幅に安い（$0.18 vs $0.0167/GB-hr）。**月 $11-12 程度（75-80%）の削減が見込める。** さらに optimized concurrency によるインスタンス集約で Provisioned Memory の実 GB-hrs も下がる可能性がある。

### Fluid Compute FAQ

- **Q: warm インスタンスのキャッシュは同一ユーザーでのみ有効？**
  A: ユーザー単位ではなくリクエスト単位。同じインスタンスに振られたリクエストはユーザーが異なっても同じモジュールスコープの変数を共有する。Vercel 公式もプロセス内キャッシュの活用を推奨している（[What is Compute?](https://vercel.com/docs/functions/concepts)）
- **Q: コールドスタートは発生する？**
  A: 発生する。ただし optimized concurrency でインスタンス数が減るため頻度は下がる。Pro プランの本番環境では pre-warmed instances により最低1インスタンスが warm 維持される（[Fluid compute docs](https://vercel.com/docs/fluid-compute)）
- **Q: 1インスタンスにリクエストが集中してメモリが爆増しない？**
  A: Vercel がインスタンスの capacity を監視し、余裕がある場合のみ同一インスタンスにルーティングする。容量不足時は自動で新インスタンスを起動する。Phase 4 のキャッシュはモジュールスコープに1つなので、並行リクエスト数が増えてもキャッシュのメモリ消費は増えない（[Fluid compute docs](https://vercel.com/docs/fluid-compute)）
- **Q: リクエスト固有の値をグローバルに書き込むコードはある？（並行性安全性の調査）**
  A: プロジェクト全体を調査済み。ユーザーID・セッション等をモジュールスコープに格納するコードはなく、リクエスト間のデータ汚染リスクはない。top-level await が2箇所あるが、いずれもマスタデータの読み取り専用で実害なし：
  - `src/lib/services/task_results.ts:32-33` — `statusById` / `statusByName`（提出ステータス定義、変更頻度極低）
  - `src/routes/problems/[slug]/+page.server.ts:9` — `buttons`（UI ボタン定義、変更頻度極低）

  これらはレガシーモデルでも warm インスタンス内で同じデータが使い回されており、Fluid Compute 固有の問題ではない。将来的にリクエストスコープへの移動を検討してもよいが Phase 4 のスコープ外。

### 結論

ユーザー数に比して Function Duration・転送量が大きく、削減の余地はある。ピーク集中型のトラフィックパターンから warm インスタンスでのキャッシュヒットが見込めるため、実装コストに見合う効果が期待できる。特異日（54k/日）のような突発的なトラフィック増加時は、キャッシュなしでは全リクエストが DB を叩くためプロセス内キャッシュの効果が最も大きくなる。Fluid Compute を有効にすることでキャッシュヒット率がさらに向上し、課金も最適化される。ただし `/workbooks/[slug]`（日2k）には効かない点に注意。
