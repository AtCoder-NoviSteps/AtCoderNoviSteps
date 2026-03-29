<script lang="ts">
  import { Tabs, TabItem, Alert } from 'flowbite-svelte';

  import AtCoderVerificationForm from '$features/account/components/settings/AtCoderVerificationForm.svelte';
  import AccountDeletionForm from '$features/account/components/delete/AccountDeletionForm.svelte';
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
      atCoderAccount: {
        handle: string;
        validationCode: string;
        isValidated: boolean;
      };
      message_type: string;
      message: string;
      openAtCoderTab: boolean;
    };
    form: Record<string, unknown> | null;
  }

  let { data, form }: Props = $props();

  const role = $derived(data.role);
  const username = $derived(data.username);
  const message = $derived(data.message);
  const message_type = $derived(data.message_type);

  const atCoderAccount = $derived(data.atCoderAccount);

  // Open the AtCoder tab when:
  // - navigated here via ?tab=atcoder (e.g. from the unverified-user prompt)
  // - the user is already in any step of the verification flow
  // - form?.isTabAtcoder is set (extra safety in case load() hasn't reflected the action yet)
  const shouldOpenAtCoderTab = $derived(
    data.openAtCoderTab ||
      atCoderAccount.isValidated ||
      (atCoderAccount.handle.length > 0 && atCoderAccount.validationCode.length > 0) ||
      form?.isTabAtcoder === true,
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

      <AtCoderVerificationForm {username} {atCoderAccount} />
    </TabItem>

    <!-- アカウント削除 (ゲストを除いた一般ユーザのみ) -->
    {#if isGeneralUser(role, username)}
      <TabItem>
        {#snippet titleSlot()}
          <span class="text-lg">アカウント削除</span>
        {/snippet}

        <AccountDeletionForm {username} />
      </TabItem>
    {/if}
  </Tabs>
</div>
