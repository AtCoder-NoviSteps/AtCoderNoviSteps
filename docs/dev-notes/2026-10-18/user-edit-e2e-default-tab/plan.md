# `/users/edit` の E2E: 既定タブの検証を seed に追従させる（完了記録）

## 結論

`e2e/user_edit.spec.ts` の「基本情報 tab is active by default」が毎回失敗していた件を、テスト側の修正で解消した。アプリと seed は変更していない。
Playwright 1.64.1 の E2E 検証（#4131）で見つかった既存の失敗だった。

## 原因

- `/users/edit` は、AtCoder 認証済みのユーザーには「AtCoder IDを設定」タブを開く。これは `e9ea7a0a`（2026-03-27）で入った意図どおりの仕様。
- spec は翌日の `053e0e96` で書かれ、当時の guest は未認証だった。`6696b604`（2026-09-19）で seed の guest を認証済み（`novisteps_guest`）にしたため、期待値が合わなくなった。
- CI の E2E ジョブはコメントアウト中のため、検知されなかった。

## 弱いテストだった理由

「username is displayed」は、基本情報タブが開いていなくても成功していた。

- Flowbite の `Tabs` は選択中のタブの中身だけを描画する。
- AtCoder タブのフォーム（`AtCoderVerificationForm.svelte`）にも「ユーザ名」の入力欄がある。テストはそちらを見つけて `guest` に一致していた。
- 修正後は、基本情報タブをクリックして `aria-selected="true"` を確かめてから値を見る。描画されるパネルは常に1つなので、`tabpanel` で範囲を絞っても区別できない。

## 意思決定

- **既定タブの分岐を両方検証する（ユーザー決定）:** 期待値を guest に合わせるだけでは、未認証側の分岐が E2E で検証されないまま残る。
- **未認証ユーザーには seed の `Alice` を使う:** `prisma/users.ts` で、未認証の経路を検証するために未認証のまま残されている seed ユーザー。
- **seed の guest を未認証に戻さない:** 認証済みが前提の機能を、実 API なしで使えるようにするための設定だから。
- **`?tab=atcoder` の分岐は追加しない:** 既定タブの修正という範囲を超えるため（YAGNI）。

## 検証

- `user_edit.spec.ts` を `--repeat-each=3` で実行し、15 件すべて成功した。E2E 全体は 105 件成功・1 スキップ（既存の条件付き skip）。
- 本体を一時的に改変し、それぞれのテストが失敗することを確かめた（確認後に元に戻した）。

| 改変（`src/routes/users/edit/+page.svelte`）                    | 失敗したテスト                                       |
| --------------------------------------------------------------- | ---------------------------------------------------- |
| `shouldOpenAtCoderTab` から `atCoderAccount.isValidated` を外す | 認証済み（guest）の既定タブ                          |
| 基本情報タブのユーザ名を空にする                                | username is displayed after opening the 基本情報 tab |
| `shouldOpenAtCoderTab` を常に `true` にする                     | 未認証（Alice）の既定タブ                            |

## 注意点

- 手元の DB で `Alice` を手動で AtCoder 認証すると、未認証側のテストが失敗する。seed は `atCoderHandle` を持つユーザー（admin・guest）だけを認証済みにする。
