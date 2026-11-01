# ARC-Like コンテストの表を追加する（#4259）

## 概要

問題一覧のコンテスト別の表に「ARC-Like」ボタンと表を追加した。ボタンは「ABC-Like」の直後にある。表の形式は ABC-Like と同じで、ヘッダーは A〜F、行ラベルは contest_id の大文字、行の並びは contest_id の降順。

対象はメンテナのスプレッドシートにある 21 コンテスト。dwacon5th-prelims / dwacon6th-prelims は A〜E、tenka1-2017/2018/2019 と caddi2018 は C〜F で、ほかは A〜F。

## 決定と不採用の案

- **行の並びは contest_id の降順**: ABC-Like と同じ規則で、追加のコードが要らない。開催日順（スプレッドシートの並び）は、Provider に contest_id の配列を持たせて `getContestRoundIds` を上書きする必要があり、新しいコンテストのたびに配列も直すことになるので採らなかった（ユーザー判断）
- **共有問題は ARC-Like の行にも出す**: ABC042–125 / ARC058–103 と同じく、共有問題は両方の表に出す。スプレッドシートで tenka1・caddi2018 が E・F だけなのは、C・D を ABC-Like 側に載せているためと解釈した。caddi2018 の C・D は本来のコンテストが caddi2018b なので、caddi2018 へのペアを 2 件足した
- **acl1 は除く**: ACL グループで表示済み（ユーザー確認済み）。ABC-Like が abl を除くのと揃えた
- **seed に 13 件すべて足す**: ローカルの表を本番と揃える（ユーザー判断）。本番に無いと分かっていた 4 件だけだと、ローカルの表は 21 件中 12 件になる
- **ABCLikeProvider との共通基底クラスは作らない**: 既存の Provider はクラスごとに設定を持つ慣習で、差分は除外する contest_id と metadata だけ。抽象化の利得が小さい
- **`ARC_LIKE` を前方一致にしない**: `diverta2019` / `diverta2019-2` のように続編がある。完全一致の規則（`prefixes.ts` のコメント）を守り、5 件（m-solutions2019, exawizards2019, tokiomarine2020, nomura2020, hitachi2020）を個別に足した
- **新しい ContestType は作らない**: 既存の `ARC_LIKE`（schema・priority・ラベル）で足りた
- **`ARC_LIKE` の値は公式名**: 表示には使われない（ラベルは大文字の contest_id に落ちる）。exawizards2019 はユーザーの指示で「エクサウィザーズ 2019」とした

## コードと履歴からは分からない事実

- **データの出どころ**: seed に足した 13 件（76 問）の行は、メンテナが AtCoder Problems の problems.json から用意した。caddi2018 のペア 2 件もメンテナ提供。どちらもスプレッドシートのスクリーンショットと問題名まで照合し、欠落・重複が無いことを確かめてから seed に入れ、元の JSON は seed のコミットで消した
- **分類が無いと取り込めない**: 分類が `null` のコンテストは、管理画面の取り込み（`filterUnregisteredTasks`）でも `createTask` でも飛ばされる。今回分類に足した 5 件は、デプロイ前には本番に取り込めない
- **タスクの `contest_type` 列**: 書き込むだけで、表示には使われない（表示は `classifyContest` で決まる）
- **検証結果**:
  - `pnpm test:unit`（2993 件）が通り、`pnpm lint` / `pnpm check` のエラーは 0。警告はすべて今回触っていないファイルのもの
  - ローカルで `pnpm db:seed` を流し、新しいタスク 76 件と caddi2018 のペア 2 件が登録された。76 件の `contest_type` はすべて `ARC_LIKE`。「タスクが無いのでペアを飛ばした」警告は変更前と同じ 158 件で、増えていない
  - ローカル DB のタスクとペアを `ARCLikeProvider` に通し、21 行・ヘッダー A〜F・tenka1 と caddi2018 は C〜F・dwacon は A〜E・acl1 無しになることを確かめた
- **確かめていないこと**: ブラウザでの見た目（開発サーバーへのアクセスが許可されなかった）。本番のデータ

## 残りのタスク

1. ローカルのブラウザで、ARC-Like ボタンが ABC-Like の直後にあり、表が上の検証どおりに出ることを確かめる
2. デプロイ前に、本番の登録状況を確かめる

```sql
SELECT contest_id, COUNT(*) AS task_count
FROM task
WHERE contest_id IN (
  'keyence2021', 'tokiomarine2020', 'nomura2020', 'hitachi2020', 'keyence2020',
  'dwacon6th-prelims', 'ddcc2020-qual', 'nikkei2019-2-qual', 'jsc2019-qual', 'diverta2019-2',
  'm-solutions2019', 'diverta2019', 'tenka1-2019', 'exawizards2019', 'yahoo-procon2019-qual',
  'nikkei2019-qual', 'keyence2019', 'caddi2018', 'dwacon5th-prelims', 'tenka1-2018', 'tenka1-2017'
)
GROUP BY contest_id
ORDER BY contest_id;
```

3. デプロイ後、2 で行の無かったコンテスト（少なくとも tokiomarine2020 / nomura2020 / hitachi2020 / exawizards2019）を管理画面から取り込む
4. `contesttaskpair` に caddi2018 の 2 件（`caddi2018_a` → C、`caddi2018_b` → D）を Supabase の CSV で入れる（`id`・`createdAt`・`updatedAt` を含める。手順は `docs/guides/how-to-add-contest-task-pairs.md`）。キャッシュ（TTL 1 時間）が切れるまで表示に出ないことがある
5. 本番で、ARC-Like の表に 21 行が出ること、caddi2018 の行が C〜F になること、acl1 が出ないことを確かめる
