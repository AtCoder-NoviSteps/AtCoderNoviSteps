<script lang="ts">
  import { Tabs, TabItem, Alert } from 'flowbite-svelte';

  import AtCoderUserValidationForm from '$lib/components/AtCoderUserValidationForm.svelte';
  import FormToImportSubmissions from '$lib/components/FormToImportSubmissions.svelte';
  import UserAccountDeletionForm from '$lib/components/UserAccountDeletionForm.svelte';
  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import ReadOnlyLabel from '$lib/components/ReadOnlyLabel.svelte';

  import { Roles } from '$lib/types/user';

  export let data;

  let role = data.role;
  let username = data.username;
  let atcoder_username = data.atcoder_username;
  let atcoder_validationcode = data.atcoder_validationcode;
  let atcoder_account_is_validated = data.is_validated;
  let message = data.message;
  let message_type = data.message_type;

  export let status = 'nothing';
  if (data.is_validated === true) {
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
  <Tabs style="underline" contentClass="bg-white">
    <!-- 基本情報 -->
    <TabItem open>
      <span slot="title" class="text-lg">基本情報</span>
      <ContainerWrapper>
        <FormWrapper action="update">
          <ReadOnlyLabel labelName="ユーザ名" inputValue={username} />
          <ReadOnlyLabel labelName="AtCoder ID" inputValue={atcoder_username} />

          <!-- <SubmissionButton labelName="保存" /> -->
        </FormWrapper>
      </ContainerWrapper>
    </TabItem>

    <!-- AtCoder IDによる認証 (本人確認) -->
    <TabItem>
      <span slot="title" class="text-lg">AtCoder IDを設定</span>
      <AtCoderUserValidationForm {username} {atcoder_username} {atcoder_validationcode} {status} />
    </TabItem>

    <!-- 問題の回答状況をインポート (AtCoder ProblemsのAPIを使用) -->
    <!-- 前提条件: AtCoder IDによる本人確認が済んでいる -->
    <TabItem>
      <span slot="title" class="text-lg">問題の回答状況をインポート</span>
      <FormToImportSubmissions {username} {atcoder_username} {atcoder_account_is_validated} />
    </TabItem>

    <!-- TODO: 回答に関するステータスを編集できるようにする -->
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
        <span slot="title" class="text-lg">アカウント削除</span>
        <UserAccountDeletionForm {username} />
      </TabItem>
    {/if}
  </Tabs>
</div>
