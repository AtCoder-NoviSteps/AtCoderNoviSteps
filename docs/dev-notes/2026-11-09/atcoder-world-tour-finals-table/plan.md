# AtCoder 世界大会のコンテスト別テーブル（#4314）

## 結論

「旧 ARC」と「AtCoder 日本大会」の間に「AtCoder 世界大会」ボタンを足し、World Tour Finals（Algorithm 部門）の 6 コンテストを、メンテナのスプレッドシート順にコンテストごとのテーブルで並べた。分類・ContestType・DB は変えていない。

| contest_id        | 見出し                           | seed        |
| ----------------- | -------------------------------- | ----------- |
| awtf2026algo      | World Tour Finals 2026 Algorithm | 無し → 5 問 |
| awtf2025algo-open | World Tour Finals 2025 Algorithm | 5 問        |
| awtf2024-open     | World Tour Finals 2024           | 5 問        |
| wtf22-day2        | World Tour Finals 2022 Day2      | 5 問        |
| wtf22-day1-open   | World Tour Finals 2022 Day1      | 5 問        |
| wtf19-open        | World Tour Finals 2019           | 6 問        |

## 決定事項

- **日本大会の Provider を `AtCoderChampionshipProvider` に改名して共用する**（メンテナが選択）。エントリ 1 件 = Provider 1 個の形がそのまま使える。却下: `PerContestProvider` など汎用名（メンテナが命名を却下）、世界大会専用の Provider を新設（同じクラスが 2 つになる）、改名せずに使う（名前と中身が合わない）。
- **見出しは `getContestNameLabel` から作り、配列には contest_id だけを書く**。日本大会と違い、既存のラベルがスプレッドシートと同じ文字列を返す。スプレッドシートの「(AGC)」は付けない（メンテナが選択）。却下: 見出しの直書き（ラベルを二重に持つ）。
- **並び順は明示的な配列**。contest_id の形（`-open` の有無、`algo` の有無）がそろわない。スプレッドシートの 2 つ目の「2022 Day2」（Save the Monsters 〜）は Day1 なので、Day2 → Day1 の順にした。
- **seed との整合テストは `isWorldTourFinals` で拾う**。来年の回を seed に足して配列に書き漏らすと落ちる（配列から 1 件消すと 3 テストが落ちることを確かめた）。
- **命名は `AtCoderWorldTourFinals`**。却下: `AtCoderWorldChampionship`（日本大会と対にはなるが、6 件とも公式名が World Tour Finals）。

## コードと履歴から分からない事実

- **データの出典**: メンテナが貼った AtCoder Problems の 31 行。既存の 26 行は seed と全項目一致し、seed に足したのは awtf2026algo の 5 行だけ。awtf2026algo の contest_id には `-open` が付かないので、fixture の推測の ID（`awtf2026algo-open`）を直した。
- **分類**: スプレッドシートの「(AGC)」から AGC_LIKE への登録を疑ったが、6 件ともコード（正規表現）・ローカル DB・本番 DB で `ATCODER_MAIN_OFFICIAL_ONSITE` だった。
- **本番 DB**（2026-11-09 にメンテナが Supabase で確認）: 6 件とも 5, 5, 5, 5, 5, 6 行で取り込み済み。`awtf2024` は 2026-05-13 〜 07-08 の間 OTHERS に分類されていたが、その間に取り込まれた行は無く、データ migration は要らなかった。
- **検証**: `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit`（3074 件）が通った。クロスレビューは条件に当たらないので行っていない。
- **画面の表示は確認していない。**

## 残タスク

なし（デプロイ後の取り込みも不要）。
