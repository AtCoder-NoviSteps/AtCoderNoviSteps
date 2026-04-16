# replace-erd-generator 意思決定記録

## 置き換え理由

| パッケージ                        | 問題                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `prisma-erd-generator@2.4.2`      | `@mermaid-js/mermaid-cli` 経由で Puppeteer（Chromium）を同梱。重い・メンテ停滞                      |
| `@mermaid-js/mermaid-cli@11.12.0` | `prisma-erd-generator` 専用。メンテ停滞。postcss-load-config 経由で tsx peer dep を引き込んでいた   |
| `@popperjs/core@2.11.8`           | ソースコードでの直接 import なし。`flowbite` の依存として推移的にインストール済みのため直接宣言不要 |

## 採用候補と却下理由

| 候補                    | 判断                                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `prisma-markdown@1.0.9` | ✅ **採用**。依存1個（`@prisma/generator-helper`）、Puppeteer/mermaid-cli 不使用、Prisma v5 対応、schema.prisma から直接生成 |
| `prisma-markdown@3.x`   | ❌ Prisma >= 6.0 要求                                                                                                        |
| `prisma-markdown@4.x`   | ❌ Prisma >= 7.0 要求                                                                                                        |
| `mermerd`               | ❌ 今回は見送り。Go バイナリで npm 依存ゼロだが DB 直接接続が必要（CI でコンテナ前提になる）                                 |
| `tbls`                  | ❌ 今回は見送り。多機能だが直接依存 43 個と重い                                                                              |

## 注意: 将来の移行パス

Prisma v7 へアップグレードするタイミングで `prisma-markdown@4.x` へ移行する（peer 依存が >= 7.0.0 に変更されたため）。

## 注意: ERD.md への手動記述について

`.claude/rules/prisma-db.md` に「CHECK 制約を `prisma/ERD.md` に `%%` コメントで記録する」ルールがある。
`prisma generate` を実行するたびに ERD.md は上書きされるため、手動コメントは消える（現行ツールでも同様）。
このルールの運用方針（上書き受け入れ or 別ファイルへ移動）は本タスクのスコープ外とし、別途検討する。
