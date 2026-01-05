<script lang="ts">
  import { Heading, Card, Alert, Button, List, Li } from 'flowbite-svelte';

  import HeadingOne from '$lib/components/HeadingOne.svelte';

  import ExternalLinkWrapper from '$lib/components/ExternalLinkWrapper.svelte';

  import { X_OFFICIAL_ACCOUNT_URL } from '$lib/constants/product-info';
  import { LOGIN_PAGE } from '$lib/constants/navbar-links';
  import { LOGIN_LABEL } from '$lib/constants/forms';
</script>

<!-- See: -->
<!-- https://github.com/lucia-auth/example-sveltekit-email-password-2fa/blob/main/src/routes/forgot-password/%2Bpage.svelte -->
<!-- https://svelte-5-ui-lib.codewithshin.com/components/card -->
<div class="container mx-auto md:w-4/5 lg:w-2/3 py-4 md:py-8 px-3 md:px-0">
  <HeadingOne title="パスワードを忘れた場合の対応について" />

  {@render passwordResetSection()}
  {@render accountMigrationGuideSection()}
</div>

{#snippet passwordResetSection()}
  <Card size="xl" class="mb-5 p-4">
    <Heading tag="h2" class="text-xl mb-2 text-gray-900 dark:text-white">
      パスワードリセット機能
    </Heading>

    <p class="mb-3 dark:text-gray-300">
      パスワードリセット機能は開発中です。しばらくお待ちください。
    </p>
  </Card>
{/snippet}

{#snippet accountMigrationGuideSection()}
  <Card size="xl" class="p-4">
    <!-- Header -->
    <Heading tag="h2" class="text-xl mb-2 text-gray-900 dark:text-white">
      アカウント移行のご案内
    </Heading>

    <p class="mb-3 dark:text-gray-300">
      お急ぎの場合は、<strong>回答履歴を新しいアカウントに移行</strong>することができます。
    </p>

    <!-- Guide -->
    <Heading tag="h3" class="text-lg mb-2 text-gray-800 dark:text-gray-200">手順</Heading>

    <List tag="ol" class="mb-5 pl-5 list-decimal dark:text-gray-300">
      <Li>
        <strong class="text-red-600">回答履歴を含まない</strong>新しいアカウントを用意してください
      </Li>
      <Li>
        以下の情報を準備してください：
        <List tag="ul" class="ml-5 mt-1 list-disc">
          <Li><strong>現在のアカウント名</strong>（パスワードを忘れたアカウント）</Li>
          <Li><strong>新しいアカウント名</strong>（移行先となるアカウント）</Li>
        </List>
      </Li>
      <Li>
        開発・運営チームの
        <ExternalLinkWrapper
          url={X_OFFICIAL_ACCOUNT_URL}
          description="公式アカウント"
          ariaLabel="Open official X account as a new tab"
        />
        にダイレクトメッセージでご連絡ください
      </Li>
      <Li class="dark:text-gray-300">
        メッセージには「アカウント移行希望」と記載し、2. の情報をお伝えください</Li
      >
    </List>

    <!-- Warnings -->
    <Alert color="red" class="mb-5">
      <Heading tag="h3" class="text-lg mb-2 text-red-500 dark:text-red-500">注意</Heading>

      <List tag="ul" class="pl-5 list-disc">
        <Li>移行処理には1〜3日ほどかかる場合があります</Li>
        <Li>移行が完了しても、元のアカウントは削除されません</Li>
        <Li>移行後は新しいアカウントでログインしてください</Li>
      </List>
    </Alert>

    <p class="dark:text-gray-300">
      ご不便をおかけして申し訳ござませんが、ご理解とご協力をお願いいたします。
    </p>

    <!-- Back to login page -->
    <div class="flex justify-center mt-6">
      <Button href={LOGIN_PAGE} color="primary" class="px-6">
        {LOGIN_LABEL}ページに戻る
      </Button>
    </div>
  </Card>
{/snippet}
