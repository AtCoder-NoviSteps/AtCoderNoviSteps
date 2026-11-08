# AtCoder 日本大会のコンテスト別テーブル（#4315）

## 結論

「旧 ARC」と「競プロ典型 90 問」の間に「AtCoder 日本大会」ボタンを足し、AtCoder Japan Open と、その前身の全国統一プログラミング王決定戦の 10 コンテストを、メンテナのスプレッドシート順にコンテストごとのテーブルで並べた。

| contest_id                                                              | ContestType                                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| arc232 / arc207 / arc186                                                | ARC（変更なし）                                                    |
| nikkei2019-2-qual / nikkei2019-qual                                     | ARC_LIKE（変更なし）                                               |
| ajo2025-final-open / ajo2024-final / nikkei2019-2-final / nikkei2019-ex | 未分類 → ATCODER_MAIN_OFFICIAL_ONSITE                              |
| nikkei2019-final                                                        | OTHERS → ATCODER_MAIN_OFFICIAL_ONSITE（既存行は migration で更新） |

## 決定事項

- **明示的な配列 + 専用 Provider**（「JAG 夏合宿・模擬地区など」と同じ形）。予選（ARC）と決勝が交互に並び、contest_id から順番を導けない。却下: JagRegionalProvider を汎用化して共用する案。JAG 側の 76 件とテストにも手が入るうえ、レイアウトは共用済みで、重複は 30 行ほどの配線だけ。
- **エントリに見出しと contestType を書く**。arc232 のラベルは `ARC 232` で、ARC_LIKE にはラベル生成が無いので、見出しは `getContestNameLabel` から作れない。contestType は provider key（`ARC::arc232`）を作る。却下: JAG のように preset で `classifyContest` を呼ぶ案。`null` を含む戻り値と 3 種類の分岐を扱うことになる。
- **ContestType は追加しない**。既存の値に分類するので、enum と優先度は変わらず、旧版へのロールバックも安全。
- **既存行の再分類は Prisma のデータ migration で行う**。DB の `contest_type` はアプリから読まれていないので表示には効かないが、分類との食い違いを残さない。却下: Supabase で手動 SQL を流す案（環境ごとの適用漏れが起きうる）。
- **予選は既存のテーブル（ARC 104 〜 / ARC-Like）にも残す**（メンテナが選択）。却下: acl1 のように ARC-Like から外す案。
- **命名は `AtCoderJapanChampionship`**。却下: `JapanOpen`（実在の大会名と重なり、nikkei を含まないように読める）、`Onsite`（予選はオンライン開催）、`Tournament` / `Cup`（公式・主要の意味合いが弱い）。

## コードと履歴から分からない事実

- **データの出典**: メンテナが貼った AtCoder Problems の 62 行（atcoder.jp はこのコンテナから届かない）。ID の重複なし、`title` = `{problem_index}. {name}`、seed 済みだった nikkei の 2 予選 12 行とも一致した。seed に足したのは残りの 50 行。
- **nikkei2019-ex の記号**: `nikkei2019ex_e` が F、`nikkei2019ex_f` が E。AtCoder 側の問題 URL と記号の対応がそうなっていて、スプレッドシートとも一致する。8 問のコンテストの 8 問目の記号は H（Ex ではない）。
- **migration の検証**: ローカル DB にも nikkei2019-final の 8 行が OTHERS のまま入っていた。migration を流すと、この 8 行だけが変わった（OTHERS は 117 → 109 行）。
- **本番の状態（未確認）**: 決勝 2 件・nikkei2019-2-final・nikkei2019-ex は分類が `null` だったので、管理画面の取り込みで skip され、本番には無いはず。
- **Codex のクロスレビュー**: 指摘は 2 件で、どちらも直した。
  - seed の中身を検証していない、という指摘には、問題数と E/F の対応を seed に対して検証するテストを足した。62 行をすべて列挙する案は、seed をテストにもう一度書くことになるので見送った。
  - contestType はセルのキー（`getTaskTableHeaderName`）にも渡る、という指摘は、確かめた結果、不具合ではなかった。キーが変わるのは ABC の H と記号 Ex の問題だけで、10 件には当たらない。コメントを直し、ARC / ARC_LIKE / オンサイトでセルのキーが見出しと一致するテストを足した。
  - 足したテストは、seed と Provider を一時的に壊すと落ちることを確かめた。
- **画面の表示は確認していない。**

## 残タスク（メンテナ）

1. デプロイ前に Supabase で対象行を確かめる（どれを取り込むかが分かる）。

```sql
SELECT "contest_id", "contest_type", count(*) FROM "task"
WHERE "contest_id" IN ('arc232', 'ajo2025-final-open', 'arc207', 'ajo2024-final', 'arc186',
  'nikkei2019-2-final', 'nikkei2019-2-qual', 'nikkei2019-ex', 'nikkei2019-final', 'nikkei2019-qual')
GROUP BY "contest_id", "contest_type"
ORDER BY "contest_id";
```

2. main へのマージで、CI が migration を流す。
3. デプロイの直後に、管理画面から ajo2025-final-open / ajo2024-final / nikkei2019-2-final / nikkei2019-ex（と、手順 1 で欠けていたもの）を取り込む。データの無い Provider は空の枠を描く。
