# Learning: devcontainer 内で Claude / Codex のサンドボックスが全滅した件

## 問題

- 症状: devcontainer 内で Claude / Codex の Bash が全滅し、`git commit` もできない（`bwrap: setuid use of bubblewrap is not supported` → `/proc` マウント失敗 → Codex の `Bad file descriptor`）。
- 根本原因: Debian のセキュリティ更新で入った bubblewrap 0.12.0 が setuid 方式を廃止し、setuid が暗黙に担っていた `/proc` マウントの回避策が消えた。その結果、Codex 側の未修正バグ 2 件（ファイル単位の deny が 2 つ以上で失敗、`/proc` 失敗時の代替手段が新しいエラー文言を検知できない）が順に表に出た。

## 有効だったアプローチ

- エラー文言で上流のソース（`bubblewrap.c` の `acquire_privs()`）とリリースノート、Debian security tracker を引き、「いつ・なぜ挙動が変わったか」を一次情報で確定させた。
- エラーの対象パスが変わるたびに「どの設定行が効いているか」を実ファイル（`ls`、`find`）と突き合わせ、仮説を 1 つずつ潰した。
- 設定が反映されないときは、常駐プロセスの起動時刻と設定ファイルの更新時刻を比べた（VS Code 拡張が起動した Codex の app server が、古い設定のまま CLI の接続先になっていた）。
- Claude は公式ドキュメントの `enableWeakerNestedSandbox`、Codex は `systempaths=unconfined` で `/proc` のマウントを通し、実害の範囲（OrbStack の VM 内に閉じる）を明記して許容した。

## ハマった点

- 「setuid は不要」と判断した: setuid が `/proc` マウントの回避策を兼ねていたことを見落としていた。
- 「ワークスペース内の実在ファイルが 2 つ以上で失敗」と狭く理解した: 実際は、実在しない完全パスも含めて、Codex の設定全体で数えられていた。そのため `.env.example` → `.env.local` → `~/.claude/.credentials.json` と、3 回に分けて潰すことになった。
- 「CLI を再起動すれば反映される」と説明した: CLI は常駐している app server に接続するだけで、設定を読み直していなかった。
- `.env` を deny から外す案を推した: 「動かすこと」を優先して目的（秘密情報の保護）を損ねる本末転倒だった。
- 「すでに緩めてあるから」を理由に `systempaths=unconfined` のリスクを小さく見積もった: 緩和を重ねる理由にはならない。

## 教訓

- 権限まわりの設定（setuid、capability、security_opt）を外すときは、それが暗黙に回避していた制約を先に洗い出す。例: setuid が `/proc` マウントの制約を回避していた。
- バージョンを固定しないパッケージは、再ビルドした日によって挙動が変わる。「以前は動いた」ときは、まず実環境のバージョンを確認する。例: `bwrap --version` で 0.12.0 を確認。
- 設定の変更が効かないときは、その設定を読むのが常駐プロセスかどうかを確かめ、プロセスの起動時刻を設定の更新時刻と比べる。
- 回避策を選ぶときは、守りたいもの（今回は `.env` と認証情報）を先に固定し、それを削る案は候補から外す。
- セキュリティの緩和は、既存の緩和を根拠にせず、単体で実害（誰が・何を・どこまで）を書き出してから判断する。
