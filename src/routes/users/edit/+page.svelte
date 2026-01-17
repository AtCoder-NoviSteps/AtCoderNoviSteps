<script lang="ts">
  import { Tabs, TabItem, Alert } from 'flowbite-svelte';

  // import AtCoderUserValidationForm from '$lib/components/AtCoderUserValidationForm.svelte';
  import UserAccountDeletionForm from '$lib/components/UserAccountDeletionForm.svelte';
  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import LabelWrapper from '$lib/components/LabelWrapper.svelte';
  // import SubmissionButton from '$lib/components/SubmissionButton.svelte';

  import { Roles } from '$lib/types/user';

  interface Props {
    data: {
      userId: string;
      username: string;
      role: Roles;
      isLoggedIn: boolean;
      atcoder_username: string;
      atcoder_validationcode: string;
      is_validated: boolean;
      message_type: string;
      message: string;
    };
    status?: string;
  }

  let { data, status = $bindable('nothing') }: Props = $props();

  let role = data.role;
  let username = data.username;
  // let atcoder_username = data.atcoder_username;
  // let atcoder_validationcode = data.atcoder_validationcode;
  // let atcoder_is_validated = data.is_validated;
  let message = data.message;
  let message_type = data.message_type;

  if (data.is_validated) {
    status = 'validated';
  }
  if (data.atcoder_username.length > 0 && data.atcoder_validationcode.length > 0) {
    status = 'generated';
  }

  const isGeneralUser = (userRole: Roles, userName: string) => {
    return userRole === Roles.USER && userName !== 'guest';
  };
</script>

{#if message_type === 'default'}
  <Alert>
    <span class="font-medium">Message:</span>
    {message}
  </Alert>
{:else if message_type === 'green'}
  <Alert color="green">
    <span class="font-medium">Success alert!</span>
    Change a few things up and try submitting again.
  </Alert>
{/if}

<div class="container mx-auto w-5/6 lg:w-3/4">
  <Tabs
    tabStyle="underline"
    contentClass="bg-white dark:bg-gray-800"
    ulClass="flex flex-wrap md:flex-nowrap md:gap-2 rtl:space-x-reverse items-start"
  >
    <!-- 基本情報 -->
    <TabItem open>
      {#snippet titleSlot()}
        <span class="text-lg">基本情報</span>
      {/snippet}

      <ContainerWrapper>
        <FormWrapper action="update">
          <LabelWrapper labelName="ユーザ名" inputValue={username} />
          <!-- <LabelWrapper labelName="AtCoder ID" inputValue={atcoder_username} /> -->

          <!-- <SubmissionButton labelName="保存" /> -->
        </FormWrapper>
      </ContainerWrapper>
    </TabItem>

    <!-- FIXME: フォーム送信時に、基本情報ページが表示されてしまう不具合が修正されるまでは非公開 -->
    <!-- AtCoder IDを利用した認証 -->
    <!-- <TabItem>
      <span slot="title" class="text-lg">AtCoder IDを設定</span>
      <AtCoderUserValidationForm {username} {atcoder_username} {atcoder_validationcode} {status} />
    </TabItem> -->

    <!-- FIXME: 回答状況が正しく取得されないバグが修正されるまでは非公開 -->
    <!-- 問題の回答状況をインポート (AtCoder ProblemsのAPIを使用) -->
    <!-- {#if atcoder_is_validated === true}
      <TabItem>
        <span slot="title" class="text-lg text-gray-400 dark:text-gray-500">インポート</span>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          <b>TODO:Taskのインポートボタンを作成する</b>
        </p>
      </TabItem>
    {:else}
      <TabItem disabled>
        <span slot="title" class="text-lg text-gray-400 dark:text-gray-500">インポート</span>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          <b>Disabled:</b>
        </p>
      </TabItem>
    {/if} -->

    <!-- TODO: 実装できるまで非公開 -->
    <!-- ステータス -->
    <!-- <TabItem disabled>
      <span slot="title" class="text-lg text-gray-400 dark:text-gray-500">ステータス編集</span>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        <b>Settings:</b>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </p>
    </TabItem> -->

    <!-- アカウント削除 (ゲストを除いた一般ユーザのみ) -->
    {#if isGeneralUser(role, username)}
      <TabItem>
        {#snippet titleSlot()}
          <span class="text-lg">アカウント削除</span>
        {/snippet}

        <UserAccountDeletionForm {username} />
      </TabItem>
    {/if}
  </Tabs>
</div>
