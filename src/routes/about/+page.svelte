<script lang="ts">
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';
  import { Li, List, Heading } from 'flowbite-svelte';

  const features = [
    {
      description:
        '問題の回答状況を自分で記録できる: 「AC」「解説AC」「挑戦中」「未挑戦」から選べます。',
    },
    {
      description:
        '一歩先の問題に挑戦: 17段階で難易度付けされており、自分の実力に合った問題が探せます。',
    },
    {
      description:
        '問題集で得意を伸ばす・苦手を克服: 例題・類題を通して、各トピックの基礎から応用的な方法まで身につけられます。',
    },
  ];

  const members = [
    { name: '@けんちょん', account: 'https://x.com/drken1215' },
    { name: '@hiro', account: 'https://x.com/k_hiro1818' },
    { name: '@ウルズニャー', account: 'https://x.com/uruzunyaa' },
    { name: '@nonon', account: 'https://x.com/nonon_math' },
    { name: '@あべみ', account: 'https://x.com/cats0830v' },
    { name: '@わさせき', account: 'https://x.com/wasaseki' },
    { name: '@toshi201', account: 'https://x.com/toshicon201' },
  ];
</script>

<div class="container mx-auto w-5/6 lg:w-2/3">
  <HeadingOne title="サービスの説明" />

  <div class="mt-5 mb-5">
    <Heading tag="h2" class="text-xl mb-2 text-gray-900 dark:text-white">特長</Heading>
    <List tag="ul" class="text-gray-800 dark:text-gray-300 ml-6 space-y-1">
      {#each features as feature}
        <Li>{feature.description}</Li>
      {/each}
    </List>
  </div>

  <div class="mt-5 mb-5">
    <Heading tag="h2" class="text-xl mb-2 text-gray-900 dark:text-white">予備知識</Heading>
    <List tag="ul" class="text-gray-800 dark:text-gray-300 ml-6 space-y-1">
      <Li>
        <ExternalLinkWrapper
          url="https://atcoder.jp/contests/APG4b"
          description="C++入門 AtCoder Programming Guide for beginners (APG4b)"
        />
        の
        <ExternalLinkWrapper
          url="https://atcoder.jp/contests/APG4b/tasks/APG4b_f"
          description="1.05.実行順序と入力"
        />
        まで、独力でこなせる文章読解力と基礎学力がある。
      </Li>
    </List>
  </div>

  <div class="mt-5 mb-5">
    <Heading tag="h2" class="text-xl mb-2 text-gray-900 dark:text-white">対象ユーザ</Heading>
    <List tag="ul" class="text-gray-800 dark:text-gray-300 ml-6 space-y-1">
      <Li>
        記事
        <ExternalLinkWrapper
          url="https://qiita.com/drken/items/fd4e5e3630d0f5859067"
          description="AtCoder に登録したら次にやること ～ これだけ解けば十分闘える！過去問精選10問 ～"
        />
        を読み、問題集
        <ExternalLinkWrapper
          url="https://atcoder.jp/contests/abs"
          description="AtCoder Beginners Selection"
        />
        を解いた。
      </Li>
      <Li>茶色コーダー (レーティング400 — 799) を目指している。さらに上位を目指したい。</Li>
      <Li>問題の解答状況を自分で記録・確認したい。</Li>
    </List>
  </div>

  <!-- Usage -->
  <div class="mt-5 mb-5">
    <Heading tag="h2" class="text-xl mb-2 text-gray-900 dark:text-white">使い方</Heading>
    <List tag="ol" class="text-gray-800 dark:text-gray-300 ml-6 space-y-1">
      <Li>(初回のみ) ユーザ名とパスワードを入力して、アカウントを作成します。</Li>
      <Li>
        ログインします。お試し用のアカウント (ユーザ名: guest、パスワード: Hell0Guest)
        を利用することもできます。
      </Li>
      <Li>
        問題集や問題一覧で、グレードおよび問題を選び、回答欄の「更新」をクリックもしくはタップします。
      </Li>
      <Li>該当する回答状況 (デフォルトは「未挑戦」)を選択し、「回答を更新」ボタンを押します。</Li>
    </List>
  </div>

  <!-- Glossary -->
  <div class="mt-5 mb-5">
    <Heading tag="h2" customSize="text-xl" class="mb-2 text-xl text-gray-900 dark:text-white">
      用語集
    </Heading>

    <!-- Grade -->
    <Heading tag="h3" customSize="text-md" class="ml-6">グレード (難易度)</Heading>
    <!-- FIXME: もう少しビジュアルを整えましょう -->
    <!-- 注: 難易度の基準は非公開 -->
    <List tag="ul" class="text-gray-800 dark:text-gray-300 ml-12 space-y-1">
      <Li>
        (易しい) 11Q、10Q、9Q、8Q、7Q、6Q、5Q、4Q、3Q、2Q、1Q、1D、2D、3D、4D、5D、6D (難しい)
      </Li>
      <Li>注: 公開後に予告なく修正される場合があります。</Li>
    </List>

    <!-- Submission status -->
    <Heading tag="h3" customSize="text-md" class="ml-6 mt-3">回答状況の例</Heading>
    <List tag="ul" class="text-gray-800 dark:text-gray-300 ml-12 space-y-1">
      <Li>AC：正解した</Li>
      <Li>解説AC：公式もしくは有志の解説を読んで正解した</Li>
      <Li>挑戦中：不正解もしくは考察中</Li>
      <Li>未挑戦：これから問題を解く</Li>
    </List>
  </div>

  <!-- Privacy Policy -->
  <div class="mt-5 mb-5">
    <Heading tag="h2" class="mb-2 text-xl text-gray-900 dark:text-white">
      プライバシーポリシー
    </Heading>
    <div class="text-gray-800 dark:text-gray-300 ml-6">
      <p>
        本サイトでは、アクセス解析ツール
        <ExternalLinkWrapper
          url="https://analytics.google.com/"
          description="Googleアナリティクス"
        />
        を利用しています。
      </p>
      <br />
      <p>
        同ツールでは、トラフィックデータの収集のためにCookieを使用しております。データは匿名で収集されており、個人を特定するものではありません。利用規約、および、プライバシーポリシーに関する説明は、
        <ExternalLinkWrapper
          url="https://policies.google.com/technologies/partner-sites?hl=ja"
          description="こちら"
        />
        をご覧ください。
      </p>
      <br />
      <p>
        また、収集されたデータは、本サイトのサービスを改善する目的以外で利用することはありません。
      </p>
    </div>
  </div>

  <!-- 連絡先 -->

  <!-- Members -->
  <div class="mt-5 mb-5">
    <Heading tag="h2" class="mb-2 text-xl text-gray-900 dark:text-white">
      開発・運営メンバー
    </Heading>
    <List tag="ul" class="text-gray-800 dark:text-gray-300 ml-6 space-y-1">
      {#each members as member}
        <Li>
          <ExternalLinkWrapper url={member.account} description={member.name} />
        </Li>
      {/each}
    </List>
  </div>
</div>
