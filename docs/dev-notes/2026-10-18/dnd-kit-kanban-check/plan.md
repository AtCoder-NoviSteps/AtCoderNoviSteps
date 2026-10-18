# dnd-kit 0.5.1 の Kanban 実操作確認と Escape キャンセル修正

## 概要

[#4165](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps/pull/4165)（dnd-kit 0.5.0 → 0.5.1）は、[継続ログ](../../2026-06-28/upstream-pr-review/plan.md)で「実操作確認を条件に反映可」と判定済み。
本計画は次の 2 本からなる。

1. **0.5.1 の手動確認**：ローカル環境で管理画面 Kanban（`src/routes/(admin)/workbooks/order/`）を実際に操作し、結果を記録する。コード変更なし。
2. **Escape キャンセル修正**：調査中に見つけた既存の不具合。ドラッグを Escape でキャンセルしても、移動後の並びが保存される（C1）。列の外で離すと、表示だけ移動後の並びになり DB は元のまま残る（C2）。どちらも 0.5.1 とは無関係なので、#4165 には混ぜず別ブランチで扱う。

## 自動テストで代替できない理由

| 種別   | 現状                                                                                                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CI     | e2e のステップはコメントアウトされている（`.github/workflows/ci.yml` の `TODO: Run integration test`）。#4165 の CI 成功は build・lint・check・unit test だけを意味する。                                                |
| e2e    | `e2e/workbook_order.spec.ts` は並べ替えを API への直接 POST で検証しており、ドラッグを一度も通らない。マウス操作は過去に不安定で断念した（[2026-02-28 のメモ](../../2026-02-28/workbook-order/plan.md)「教訓 > DnD」）。 |
| unit   | `_utils/kanban.ts` の純関数だけが対象。テスト環境は node が標準で、jsdom には画面配置の計算がない（`getBoundingClientRect` が 0 を返す）。そのため dnd-kit の重なり判定や並び位置の計算を動かせない。                    |
| 見た目 | 半透明・ハイライト・自動スクロール・素早い操作の追従は、テストで判定すること自体が難しい。                                                                                                                               |

## 前提・環境

- 保存を伴う確認はローカルで行う。共有 DB には書き込まない。
- #4165 の取得：`git fetch origin pull/4165/head:pr-4165` → `git switch pr-4165` → `pnpm install` → `pnpm dev`。
- データ：`pnpm db:seed` で placement が作られる（`prisma/seed.ts` の `addWorkBookPlacements`）。未配置の問題集があれば、画面の初期化ボタン（`initializePlacements` action）で作る。カードが 2 枚以上ある列と、スクロールが出るほどカードの多い列が必要。
- 管理者でログインする。ブラウザーは普段使うもの 1 つでよい。
- ローカル DB なので、確認後に元の順序へ戻す必要はない。

---

## Phase 1：0.5.0 での基準確認（staging、コード変更なし）

既存の不具合と 0.5.1 による退行を切り分けるため、staging（0.5.0）で次の 2 項目だけ先に確認する。

- **C1**：カードを別の列へ動かした状態で Escape を押す（ポインター操作中、キーボード操作中の両方）。表示が元に戻るか、リロード後の並びが表示と一致するかを記録する。
- **C2**：カードを別の列へ動かした後、どの列にも重ならない場所で離す。表示とリロード後の並びが一致するかを記録する。

コード上の予想：C1 は「表示もリロード後も移動後の並びになる（保存される）」。根拠は後述の「設計判断」を参照。C2 は「表示だけ移動後の並びになり、DB は元のまま（表示と DB がずれる）」。どちらも未検証。

## Phase 2：0.5.1 の手動確認（#4165、コード変更なし）

`pr-4165` ブランチで次を確認する。優先度の「高」は 0.5.1 の変更がこのコードの依存箇所に直接当たるもの。

| ID  | 操作                                                                                    | 期待                                                                                         | 対応する 0.5.1 の変更                             | 優先度 |
| --- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------ |
| M1  | 列をまたいで移動（未分類 → グラフ）し、リロード                                         | ドラッグ中に移動先の列が濃いグレー、掴んだカードが半透明になる。固まらない。リロード後も同じ | #2135 Svelte 版の状態購読                         | 高     |
| M2  | 同じ列の中で並べ替え、リロード                                                          | 挿入位置が正しく、リロード後も同じ                                                           | #2135                                             | 高     |
| M3  | カードの余白（ラベル付近）を掴み、別カードのタイトル上で離す                            | 離した直後に問題集の詳細ページへ移動しない                                                   | #2152 ドロップ直後のクリックの扱い                | 高     |
| M4  | タイトルリンクを普通にクリック                                                          | 詳細ページへ移動する                                                                         | #2152                                             | 高     |
| M5  | 動かしたカードを続けて再ドラッグ（往復、3 回以上）                                      | カードがポインターに追従し、位置がずれない。挿入位置が正しい                                 | #2149 initialIndex / initialGroup、#2142 スタイル | 中     |
| M6  | キーボード：Tab でフォーカス → Space / Enter で掴む → 矢印で移動 → Space / Enter で確定 | 各キーが反応し、確定後にリロードしても同じ                                                   | #2094 キー判定を `event.key` へ変更               | 中     |
| M7  | タブ切替（解法別 ⇄ カリキュラム）の後に M1・M5                                          | M1・M5 と同じ                                                                                | #2142                                             | 中     |
| M8  | カードの多い列で上下端へ、級列の多いカリキュラムタブで左右端へドラッグ                  | 自動スクロールが効き、離した位置に入る                                                       | #2126 スクロール位置測定の再利用                  | 低     |
| M9  | 掴んですぐ素早く動かす                                                                  | カードがポインター位置に追いつく                                                             | #2151 開始処理中のポインター移動                  | 低     |
| C1  | Phase 1 と同じ                                                                          | Phase 1 の結果と同じ（変化があれば記録）                                                     | —                                                 | —      |
| C2  | Phase 1 と同じ                                                                          | Phase 1 の結果と同じ                                                                         | —                                                 | —      |

影響しないと判断した変更：#2131（`transition: null`。transition を指定していない）、#2153（ボタン以外の role の `aria-pressed`）、#2076（modifiers の import。未使用）、#2134（`isSortable` の型。未使用）。

NG が出たら、同じ操作を staging（0.5.0）でも行い、退行かどうかを切り分ける。退行なら #4165 を保留し、上流への報告を検討する。回避用のコードは足さない。

**記録**：結果は本ファイル末尾の「確認結果」に書く。[継続ログ](../../2026-06-28/upstream-pr-review/plan.md)の「2026-10-16 レビュー」にある #4165 の判定欄には、結論と本ファイルへのリンクだけを追記する。#4165 のマージ判断と push は人が行う。

## Phase 3：キャンセル判定の util 化（テスト先行）

- **層**：utils（`_utils/kanban.ts`）と types（`_types/kanban.ts`）。
- **責務**：ドラッグ終了時に「何もしない・元に戻す・保存する」のどれを行うかを決める。
- **既存の検索結果**：`src/lib/utils/`・`src/lib/services/`・`src/features/*/utils/`・`src/features/*/services/` に、ドラッグ終了の判定や `canceled` を扱うコードはない。差分の計算は既存の `reCalcPriorities` を中で使う。
- **ブランチ**：#4165 反映後の staging から切る。Issue は人が作り、ブランチ名は `#<Issue 番号>` とする。

```typescript
// _types/kanban.ts
export type DragEndAction =
  | { kind: 'none' }
  | { kind: 'restore'; columns: KanbanColumns }
  | { kind: 'save'; updates: PlacementUpdates };

// _utils/kanban.ts
export function resolveDragEndAction(params: {
  canceled: boolean;
  before: KanbanColumns | null;
  after: KanbanColumns;
  columnKey: ColumnKey;
}): DragEndAction;
```

判定の順序：

1. `canceled` が true：`before` があれば `restore`、なければ `none`。
2. `reCalcPriorities(before ?? {}, after, columnKey)` が空：`none`。
3. それ以外：`save`。列の外で離した場合（C2）もここに入り、表示どおりに保存される。

テスト（`kanban.test.ts` の `describe('resolveDragEndAction')`、期待値はリテラルで書く）：

- `returns restore with the snapshot when a reordered drag is canceled`
- `returns none when the drag is canceled without a snapshot`
- `returns none when the order is unchanged`
- `returns save with recalculated updates when cards were reordered`
- `treats a missing snapshot as an empty board when not canceled`

完了条件：`pnpm test:unit` が通る。

## Phase 4：KanbanBoard への組み込みと手動確認

- **層**：components（`_components/KanbanBoard.svelte`）。
- **責務**：`resolveDragEndAction` の結果を状態更新と保存に結び付ける。

```typescript
async function onDragEnd(event: DragEndEventArg) {
  const capturedTab = activeTab;
  const capturedSnapshot = snapshot;
  // Clear before awaiting so a drag started during the save keeps its own snapshot
  snapshot = null;

  const action = resolveDragEndAction({
    canceled: event.canceled,
    before: capturedSnapshot,
    after: allItems[capturedTab],
    columnKey: TAB_CONFIGS[capturedTab].columnKey,
  });

  if (action.kind === 'restore') {
    allItems[capturedTab] = action.columns;
    return;
  }

  if (action.kind === 'none') {
    return;
  }

  try {
    await saveUpdates(action.updates);
  } catch {
    if (capturedSnapshot) {
      allItems[capturedTab] = capturedSnapshot;
    }

    errorMessage = '保存に失敗しました';
  }
}
```

手動確認（ローカル）：

- C1 を再確認：Escape 後に表示が元に戻り、リロード後も元の並びのまま。ポインター操作中、キーボード操作中の両方で確認する。
- C2 を再確認：列の外で離した後、リロードしても離した時点の表示と同じ並びになる。
- キャンセル直後に同じカードを再ドラッグでき、固まらない（過去に `{#each}` の DOM と dnd-kit の並べ替え処理が食い違って固まった事例があるため）。
- M1・M2・M5 を再確認：通常のドラッグが従来どおり保存される。
- 保存失敗時の復元：DevTools でオフラインにしてドラッグし、エラー表示が出て元の並びに戻る。

完了条件：`pnpm format`・`pnpm lint`・`pnpm check`・`pnpm test:unit`・`git diff --check` が通る。cross-review の条件（30 ファイル以上・認証・DB・共有の公開インターフェース）には当たらないため、AI レビューは任意。push は人が行う。

---

## 設計判断

- **キャンセル時に自前で元に戻す理由**：dnd-kit 側にもキャンセル時に DOM の並びを戻す処理がある。ただし、アプリの状態が変わっていると、その処理は何もせずに終わる（`@dnd-kit/dom` 0.5.0 `sortable.js` の dragend 監視にある `hasChanged` の分岐）。このコードは `onDragOver` の `move()` で状態を書き換えるので、ここに当たる。さらに `onDragEnd` は `event.canceled` を見ずに差分を保存する。dnd-kit 公式ガイドの複数リスト例も、キャンセル時に直前の状態へ戻していたと記憶しているが、今回は原文を取得できず未確認。
- **判定を util に出す理由**：DnD の経路には自動テストがなく、コンポーネントのテストでも jsdom ではドラッグを動かせない。分岐を純関数にすれば unit テストで固定できる（`testing.md`「Component testing」）。
- **引数を dnd-kit のイベント型ではなく boolean にする理由**：テストで `Draggable` などのクラスを偽装せずに済み、util が dnd-kit の型に依存しない。
- **`snapshot` を await より前に null へ戻す理由**：現状は保存完了後の `finally` で null にしている。保存待ちの間に次のドラッグを始めると、前のドラッグの `finally` が新しい snapshot を消す。すると次の保存では `reCalcPriorities({}, …)` になり、タブ内の全カードを更新する。保存に失敗しても戻せない。同じ関数の同じ変数の扱いで、直すコストがほぼないため今回含める。不要と判断されれば外す。
- **列の外で離した場合（C2）は表示どおりに保存する**：Phase 1・2 で表示と DB のずれを確認したうえで決めた（2026-10-18）。離した時点のカードは最後に重ねた位置に見えているので、それを保存すれば表示と DB が一致する。取り消したいときは Escape を使う。これにより、以前の `source`・`target` が無いときに何もしない早期 return は不要になる。

## 却下した案

- **#4165 に修正を同梱する**：依存更新と挙動修正が混ざり、切り戻しの単位が崩れる。
- **コンポーネントに `if (event.canceled)` を足すだけにする**：分岐をテストで固定できない。
- **dnd-kit のキャンセル時の DOM 復元に任せる**：上記のとおり、アプリの状態が変わっていると復元されない（0.5.1 の `sortable.js` でも同じ）。
- **列の外で離したら元に戻す**：誤って列の外で離したときに保存されない利点はある。ただ、最後に重ねた位置に見えているカードが離した後に元の位置へ戻るので、見た目と結果が食い違う。取り消しは Escape で足りる。
- **`onDragOver` で `canceled` を見る**：`move()` がすでにキャンセル時は items をそのまま返す（`@dnd-kit/helpers` の `mutate`）。
- **マウス操作の e2e を足す**：過去に不安定で断念しており、CI でも e2e は動いていない。
- **キーボード操作の e2e をお試しで足す**：今回は見送り。

## 確認結果

| ID  | 0.5.0（Phase 1） | 0.5.1（Phase 2） | 修正後（Phase 4） | メモ                                                 |
| --- | ---------------- | ---------------- | ----------------- | ---------------------------------------------------- |
| M1  | —                |                  |                   |                                                      |
| M2  | —                |                  |                   |                                                      |
| M3  | —                |                  | —                 |                                                      |
| M4  | —                |                  | —                 |                                                      |
| M5  | —                |                  |                   |                                                      |
| M6  | —                |                  | —                 |                                                      |
| M7  | —                |                  | —                 |                                                      |
| M8  | —                |                  | —                 |                                                      |
| M9  | —                |                  | —                 |                                                      |
| C1  |                  |                  |                   | 予想どおり保存されることを確認（2026-10-18）         |
| C2  |                  |                  |                   | 予想どおり表示と DB がずれることを確認（2026-10-18） |

確認日・ブラウザー：
