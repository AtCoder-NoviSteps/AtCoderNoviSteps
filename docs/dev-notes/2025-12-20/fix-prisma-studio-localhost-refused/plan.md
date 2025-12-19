# Prisma Studio: Docker compose で localhost refused になる原因と対処方法

## 概要

Docker Compose（devcontainer なし）で `pnpm db:studio`（= `prisma studio`）を起動すると、ホストのブラウザで `http://localhost:5555` が `localhost refused to connect` になる。

本件は **Prisma Studio 自体の不具合ではなく、コンテナのポート公開（publish）と VS Code のポート転送（port forward）の違い**によって発生する。

## 結論

- Prisma Studio は `web` コンテナ内では起動している。
- しかし `compose.yaml` の `web.ports` に `5555` が無いため、ホストの `localhost:5555` に到達できない。
- VS Code Dev Containers では port forward が効くため、`compose.yaml` に `5555` の publish が無くてもアクセスできて「動いているように見える」。

## 背景（今回の構成）

- `package.json`
  - `db:studio`: `pnpm exec prisma studio`
- `compose.yaml`
  - `web.ports`: `5173:5173` のみ（Studio の `5555` は公開されていない）
- `.devcontainer/devcontainer.json`
  - port forward を使える（VS Code がコンテナ内ポートをローカルへ転送可能）

## 症状と切り分け

### 1) コンテナ内では起動しているか

```bash
# コンテナ内の待受確認
docker compose exec -T web sh -lc "ss -ltnp | grep ':5555' || true"

# コンテナ内から疎通
docker compose exec -T web curl -I http://localhost:5555
```

コンテナ内疎通が成功するなら、Studio は起動している。

### 2) ホストへ公開されているか（主原因）

```bash
# ホストに publish されているか
docker compose port web 5555

# ホストから疎通
curl -I http://localhost:5555
```

- `docker compose port web 5555` が `no port 5555/tcp ...` の場合、ホストからは繋がらない。
- その状態でブラウザを開くと `localhost refused to connect` になり得る。

## VS Code / devcontainer で動く理由

VS Code Dev Containers は、Dockerの `ports:` で publish していなくても、VS Code 側の **port forward** でローカルに転送できる。

- そのため devcontainer では `http://localhost:5555` が開ける。
- 同じ `compose.yaml` でも、「Dockerのみ（VS Codeなし）」だと port forward が無いので開けない。

## 再実行時に 5556 / 5557 のようにポート番号がインクリメントされる問題

### 原因

`pnpm db:studio` を複数回実行すると、既に `:5555` が使用中のため Prisma が空きポートに退避し、`5556`, `5557` で起動する。

よくあるパターン：

- `docker compose exec web ...` で起動した Studio がコンテナ内に残る
- ホスト側のターミナルを閉じても、コンテナ内プロセスは継続
- 次回起動で `EADDRINUSE` → 別ポートを選択

### 回避策（推奨：常に 5555 固定）

起動前に既存 Studio を止め、`--port 5555` を明示して起動する。

```bash
# 1) 既存Studioが居たら止める（居なくてもOK）
docker compose exec -T web sh -lc "pkill -f 'prisma.*studio' || true"

# 2) 5555 が空いていることを確認
docker compose exec -T web sh -lc "ss -ltnp | grep ':5555' || true"

# 3) Studio起動（ポート固定）
docker compose exec web pnpm exec prisma studio --port 5555
```

## Prisma Studio の停止方法（Docker内）

### ざっくり止める（推奨）

```bash
docker compose exec -T web sh -lc "pkill -f 'prisma.*studio' || true"
```

- 終了コード `143`（SIGTERM）は正常系のことが多い。

### 状態確認

```bash
docker compose exec -T web sh -lc "ss -ltnp | grep ':555[5-9]' || true"
docker compose exec -T web sh -lc "ps aux | grep -E 'prisma.*studio' | grep -v grep || true"
```

## 運用方針メモ（Dockerのみでブラウザから開きたい）

- Dockerのみ運用でホストのブラウザから開くなら、`compose.yaml` の `web.ports` に `5555:5555` を publish する必要がある。
- publish するとホストの `:5555` を占有するため、ホスト上で別アプリが `:5555` を使っている場合はポート競合に注意。

## Q&A

### Q. `compose.yaml` に `5555:5555` を追加すれば良い？

A. Dockerのみ（devcontainerなし）でホストブラウザから `localhost:5555` を開きたいなら妥当。

### Q. devcontainer でも明示した方が良い？

A. 必須ではない（VS Code の port forward で動く）。ただし、Dockerのみ運用と挙動を揃えたい／VS Code 以外からもアクセスしたい場合は明示しておくと再現性が上がる。

### Q. publish すると VS Code 利用に悪影響は？

A. 基本的に大きな悪影響は無い。注意点は「ホストの `:5555` 競合」だけ。
