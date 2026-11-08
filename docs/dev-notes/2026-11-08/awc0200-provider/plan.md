# AWC0200 単独テーブル

Issue: #4320（参考: PR #3997）

## 決定事項

awc0200 を `AWCSpecialContestProvider` で単独のテーブルにし、`0151Onwards`（151〜9999）を `0151To0199` に狭めた。

| 表示順 | provider key      | 範囲・対象                            |
| ------ | ----------------- | ------------------------------------- |
| 1      | `AWC::0200`       | awc0200（15 問）                      |
| 2      | `AWC::0151To0199` | awc0151〜awc0199                      |
| 3 以降 | 既存のまま        | 0150 / 0101〜0149 / 0100 / 0001〜0099 |

- 命名は PR #3997 の `0101Onwards` → `0101To0149` に揃えた。`abbreviationName` は `TaskTable.svelte` の Map キーにしか使われず、永続化されないので、改名の互換対応はしていない。
- `awc_provider.test.ts` は config をテスト内に直書きするため、本番の config ミスを検出できない。そこで `contest_table_provider_groups.test.ts` で、登録順と「境界の contest_id がどの provider に出るか」をリテラルで検証した。
- 却下: 同じ PR で `0201Onwards` を追加する案。ユーザー判断で別 issue に分けた。
- 却下: `0151Onwards` を残して awc0200 だけ除外する案。`AWCRangeProvider` に除外リストが要り、範囲と名前も食い違う。

## コードと履歴に残らない事実

- seed と fixture の awc0200 はダミー（`Dummy Problem A`〜`O`）。15 問は awc0100 / awc0150 に合わせた仮定で、実際の問題数は未確認。
- 計画外の対応として、seed の awc0151 A〜E のダミー名を、ユーザー提供の JSON にある実問題名に差し替えた。同じ JSON の awc0150 は seed とすでに一致していたので、変更していない。
- `maxRound: 199` を `9999` に戻す変異は、`AWC0001Onwards shows awc0200 only in AWC::0200` が検出した（41 件中 1 件が失敗）。
- `pnpm format` / `pnpm lint` / `pnpm check` / `pnpm test:unit`（3069 件）/ `git diff --check` はすべて通過した。
- 未確認: `pnpm db:seed` 後の dev サーバーでの目視（0200 の表が 0151〜0199 の上に出ること）。ローカル DB への書き込みになるため実施していない。

## 残タスク

- `0201Onwards` を別 issue で追加する。本 PR のデプロイ後からそれまで、awc0201 以降は表に出ない。
- awc0200 の開催後、seed のダミー名を実問題名に差し替える。問題数が 15 問でなければ fixture とテストも直す。
