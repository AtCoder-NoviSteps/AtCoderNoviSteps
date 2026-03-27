<script lang="ts">
  import { Tabs, TabItem, Alert } from 'flowbite-svelte';

  import AtCoderUserValidationForm from '$lib/components/AtCoderUserValidationForm.svelte';
  import UserAccountDeletionForm from '$lib/components/UserAccountDeletionForm.svelte';
  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import LabelWrapper from '$lib/components/LabelWrapper.svelte';

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
    form: Record<string, unknown> | null;
  }

  let { data, form }: Props = $props();

  let role = data.role;
  let username = data.username;
  let message = data.message;
  let message_type = data.message_type;

  // Status is derived exclusively from server-authoritative data.
  // After each form action, SvelteKit re-runs load(), so data reflects the latest DB state.
  const status = $derived(
    data.is_validated
      ? 'validated'
      : data.atcoder_username.length > 0 && data.atcoder_validationcode.length > 0
        ? 'generated'
        : 'nothing',
  );

  // Open the AtCoder tab when the user is in any step of the verification flow.
  // Also check form?.is_tab_atcoder as extra safety in case load() hasn't reflected the action yet.
  const shouldOpenAtCoderTab = $derived(
    data.is_validated ||
      (data.atcoder_username.length > 0 && data.atcoder_validationcode.length > 0) ||
      form?.is_tab_atcoder === true,
  );

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
    <TabItem open={!shouldOpenAtCoderTab}>
      {#snippet titleSlot()}
        <span class="text-lg">基本情報</span>
      {/snippet}

      <ContainerWrapper>
        <FormWrapper action="update">
          <LabelWrapper labelName="ユーザ名" inputValue={username} />
        </FormWrapper>
      </ContainerWrapper>
    </TabItem>

    <!-- AtCoder IDを利用した認証 -->
    <TabItem open={shouldOpenAtCoderTab}>
      {#snippet titleSlot()}
        <span class="text-lg">AtCoder IDを設定</span>
      {/snippet}

      <AtCoderUserValidationForm
        {username}
        atcoder_username={data.atcoder_username}
        atcoder_validationcode={data.atcoder_validationcode}
        {status}
      />
    </TabItem>

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
