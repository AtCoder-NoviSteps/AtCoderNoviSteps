<script lang="ts">
  import { Tabs, TabItem, Input, Button, Alert, Checkbox, Li, List } from 'flowbite-svelte';
  // @ts-ignore
  import InfoCircleSolid from 'flowbite-svelte-icons/InfoCircleSolid.svelte';

  import AtCoderUserValidationForm from '$lib/components/AtCoderUserValidationForm.svelte';
  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import ReadOnlyLabel from '$lib/components/ReadOnlyLabel.svelte';
  import SubmissionButton from '$lib/components/SubmissionButton.svelte';

  import { Roles } from '$lib/types/user';
  //import type { ActionForm } from './$types';
  export let data;
  //export let form;

  let role = data.role;
  let username = data.username;
  let atcoder_username = data.atcoder_username;
  let atcoder_validationcode = data.atcoder_validationcode;
  let atcoder_is_validated = data.is_validated;
  let message = data.message;
  let message_type = data.message_type;

  let showDeleteButton = false;

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

  const toggleDeleteButton = () => {
    showDeleteButton = !showDeleteButton;
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

          <SubmissionButton labelName="保存" />
        </FormWrapper>
      </ContainerWrapper>
    </TabItem>

    <!-- ステータス -->
    <TabItem disabled>
      <span slot="title" class="text-lg text-gray-400 dark:text-gray-500">ステータス編集</span>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        <b>Settings:</b>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua.
      </p>
    </TabItem>

    <!-- AtCoder IDを利用した認証 -->
    <TabItem>
      <span slot="title" class="text-lg">AtCoder IDを設定</span>
      <AtCoderUserValidationForm {username} {atcoder_username} {atcoder_validationcode} {status} />
    </TabItem>

    <!-- 問題の回答状況をインポート (AtCoder ProblemsのAPIを使用) -->
    {#if atcoder_is_validated === true}
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
    {/if}

    <!-- アカウント削除 (ゲストを除いた一般ユーザのみ) -->
    {#if isGeneralUser(role, username)}
      <TabItem>
        <span slot="title" class="text-lg">アカウント削除</span>
        <!-- TODO: コンポーネントとして切り出す -->
        <ContainerWrapper>
          <FormWrapper action="?/delete">
            <Alert color="red" class="!items-start">
              <InfoCircleSolid slot="icon" class="w-6 h-6" />
              <span class="font-medium text-lg">警告</span>
              <p class="font-medium">以下の内容が削除されます</p>

              <List class="mt-1.5 ms-4 list-disc list-inside">
                <Li>アカウント</Li>
                <Li>登録した回答状況</Li>
                <Li>AtCoder IDとの連携</Li>
              </List>
            </Alert>

            <!-- hiddenでusernameを持つのは共通 -->
            <Input size="sm" type="hidden" name="username" bind:value={username} />

            <ReadOnlyLabel labelName="ユーザ名" inputValue={username} />
            <Checkbox on:click={toggleDeleteButton}>同意する</Checkbox>

            {#if showDeleteButton}
              <Button readonly type="submit" class="w-full">アカウントを削除</Button>
            {/if}
          </FormWrapper>
        </ContainerWrapper>
      </TabItem>
    {/if}
  </Tabs>
</div>
