# 本プロジェクトへの参加方法・ガイドライン

本サービスの開発・運営には、皆さまのご協力が不可欠です。

また、[Git](https://git-scm.com/)や[GitHub](https://github.com)を利用した共同開発の経験を積むための場所にもしたいと考えています(可能な限りサポートいたします)。

## 本プロジェクトへの参加方法

- [GitHubで:star:を付ける](https://github.com/KATO-Hiro/AtCoderNovisteps/stargazers)
- [機能追加の要望や不具合を報告する](https://github.com/KATO-Hiro/AtCoderNovisteps/issues)
- [ソースコードやドキュメントを修正する](https://github.com/KATO-Hiro/AtCoderNovisteps/pulls) - 詳細は、後述の「プルリクエストの作成方法」を参照してください。
- [GitHub スポンサーで寄付する](https://github.com/sponsors/KATO-Hiro)

なお、GitやGitHubの利用が困難な場合は、[@KATO-Hiro](https://twitter.com/k_hiro1818)までDMをお願いいたします。

## 開発環境

### バックエンド

- [Supabase](https://supabase.com/): BaaS

### フロントエンド

- [Node.js](https://nodejs.org): JavaScriptのランタイム
- [TypeScript](https://www.typescriptlang.org/): 開発言語
- [SvelteKit](https://kit.svelte.dev/): 汎用フレームワーク
- [Flowbite Svelte](https://flowbite-svelte.com/): UIライブラリ
- [Prisma](https://www.prisma.io/): ORM
- [Lucia](https://lucia-auth.com/): 認証ライブラリ
- [Superforms](https://superforms.rocks/)、[Zod](https://zod.dev/): バリデーション
- [pnpm](https://pnpm.io/ja/): パッケージマネージャ
- [ESLint](https://eslint.org/)、[Prettier](https://prettier.io/): 文法およびフォーマットチェッカー

### インフラ

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [PostgreSQL](https://www.postgresql.org/): Relational DB

### エディタと拡張機能

- [Visual Studio Code (VS Code)](https://code.visualstudio.com/)
- [Visual Studio Code Dev Containers](https://code.visualstudio.com/docs/remote/containers)

### ホスティング、CI・CD関連

- [Vercel](https://vercel.com/)
- [GitHub Actions](https://docs.github.com/en/actions)

## プルリクエストの作成方法

<details>
  <summary>
    <a href="https://github.com/join">GitHub</a>アカウントを持っていない場合は?
  </summary>
  <p>有効なメールアドレス・ユーザ名・パスワードを用意して、<a href="https://www.google.co.jp/search?q=github+%E7%99%BB%E9%8C%B2">アカウントの登録</a>と<a href="https://qiita.com/shizuma/items/2b2f873a0034839e47ce">GitHubでssh接続</a>をしましょう</p>
</details>

### (初回のみ) 本レポジトリの内容をローカル環境にダウンロード

0. [AtCoder NoviSteps](https://github.com/AtCoder-NoviSteps)にメンバー申請をします。[@KATO-Hiro](https://twitter.com/k_hiro1818)にDMなどでご連絡いただければ、GitHubで登録しているメールアドレスに招待メールが届きますので、承認してください。
1. [本レポジトリ](https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps)の画面右上にある「Fork」ボタンを押します。
2. ターミナルなどを利用して、本レポジトリの内容をローカル環境にダウンロードします。

   `git clone https://github.com/<your-account>/AtCoderNovisteps.git`

   例:
   `git clone https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps.git`

3. 作業ディレクトリを`../AtCoderNovisteps`に変更します。

4. 本レポジトリの最新情報を反映できるように、ご自身のリモートレポジトリに登録します。`git remote -v`で登録状況を確認できます。

   `git remote add root_branch https://github.com/<your-account>/AtCoderNovisteps.git`

   例:
   `git remote add root_branch https://github.com/AtCoder-NoviSteps/AtCoderNoviSteps.git`

### (Dockerのみ利用するユーザ向け) 開発環境のインストールとローカルの開発サーバを起動

<details>
  <summary>手順</summary>

- Docker Composeのバージョンを確認します (動作チェックも兼ねています)。

  `docker compose --version`

- コンテナの利用状況を確認します。

  `docker compose ps`

- もしコンテナが起動している場合は、一度停止させます。

  `docker compose down`

- コンテナを起動し、webコンテナとdbコンテナが起動しているか確認します。

  `docker compose up - d`

  `docker compose ps`

- 関連するパッケージのインストールとDBの初期設定を行います。

  `docker compose exec web pnpm install`

  `docker compose exec web pnpm exec playwright install`

  `docker compose exec web pnpm exec playwright install-deps`

  `docker compose exec -e DATABASE_URL=postgresql://db_user:db_password@db:5432/test_db web pnpm prisma db push`

  `docker compose exec web pnpm prisma generate`

- 開発サーバ(port番号: 5173)を起動します。その後、以下のリンクを順番にクリックしてください。

  - Note: リンクのアドレス・ポート番号は、環境によって変わる可能性もあります。

  `docker compose exec web pnpm dev --host`

  http://172.18.0.3:5173
  http://127.0.0.1:5173/

- ホーム画面が起動し、ユーザの登録・ログインができれば、環境構築は完了です。

- Note: 後述の「(共通) ローカルの開発サーバを起動」の操作を実行したい場合は、該当コマンドの前に`docker compose exec web `を追加してください。

</details>

### (共通) 開発環境のインストール

ローカルサーバを起動するための準備をします。[公式ドキュメント](https://code.visualstudio.com/docs/remote/containers#_quick-start-open-an-existing-folder-in-a-container)も併せてご参照ください。

1. DockerとVS Codeを起動します。
2. コマンドパレットから、**Dev Containers: Open Folder in Container...**を選択し、`AtCoderNovisteps`フォルダを開きます。
   - Mac: `Cmd + Shift + P`
   - Windows: `Ctrl + Shift + P`
3. ローカルサーバを動作させるために必要な環境が自動的に構築され、VS Codeの拡張機能もインストールされます。

### (共通) ローカルの開発サーバを起動

- 新しいターミナルを開いてください。
- 依存関係にあるライブラリのインストールとデータベースの初期化を行い、開発サーバを起動します。

  `pnpm install`
  `pnpm exec playwright install`
  `pnpm exec playwright install-deps`

  `pnpm dlx prisma db push`

  `pnpm dev`

- 以下のリンクをクリックしてください。

  <http://127.0.0.1:5173/>

- また、開発サーバの起動と同時に新しいブラウザタブでアプリを開くこともできます。

  `pnpm dev -- --open`

- 先ほどとは異なるターミナルで以下のコマンドをそれぞれ実行すると、データベースの初期データ投入やローカル環境でのテーブル・サンプルデータが閲覧できます。

  `pnpm db:seed`

  `pnpm db:studio`

- 以下のリンクをクリックしてください。

  <http://localhost:5555/>

### (共通) ソースコードやドキュメントの加筆・修正

<details>
  <summary>本レポジトリの最新の状態を反映させる方法</summary>

1. 本レポジトリの最新の内容を取得します。

   `git fetch root_branch`

2. 取得した内容をご自身のローカル上のブランチにマージします。`main`の部分を変えれば、別のブランチにすることも可能です。

   `git merge root_branch/main`

3. ご自身のリモートブランチを更新します。

   `git push origin main`

</details>

#### 作業用のブランチ作成からプルリクエスト作成まで

1. 作業用のブランチを作成します。

   `git checkout -b <your-new-branch-for-working>`

   例: GitHubのIssue番号や機能名・ドキュメントやバグの種類などを表すキーワードを使います。

   `git checkout -b "#998244353"`

   `git checkout -b "feature/feature-name"`

   `git checkout -b "docs/docs-name"`

   `git checkout -b "bugfix/bug-name"`

2. ソースコードやドキュメントの加筆・修正を行います。以下のコマンドを実行し、アプリが意図した通りに動作するか確認してください。

- 文法・フォーマットの確認および自動修正

  `pnpm lint`

  `pnpm format`

- アプリの製品バージョンの作成と動作確認

  `pnpm build`

  `pnpm preview`

3. 2.の内容をレポジトリに反映します。コミットメッセージは、加筆・修正した内容を端的に表したものであることが望ましいです。

   `git add .`

   `git commit -m "your-commit-message (#IssueID)"`

   例:

   `git commit -m ":sparkles: Add hoge feature (#998244353)"`

   `git commit -m ":books: Update README (#1333)"`

   `git commit -m ":pencil2: Fix typo (#10007)"`

4. プルリクエストを作成する前に、加筆・修正した内容を確認します。

   `git diff origin <your-current-branch>`

5. ご自身のリモートブランチを更新します。

   `git push origin <your-current-branch>`

6. プルリクエストを作成します。
