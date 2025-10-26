<script lang="ts">
  import { Input, Button, Alert, Checkbox, Modal, uiHelpers } from 'svelte-5-ui-lib';
  import Info from '@lucide/svelte/icons/info';

  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import LabelWrapper from '$lib/components/LabelWrapper.svelte';
  import WarningMessageOnDeletingAccount from '$lib/components/WarningMessageOnDeletingAccount.svelte';

  interface Props {
    username: string;
  }

  let { username = $bindable() }: Props = $props();

  let showDeleteButton = $state(false);

  const toggleDeleteButton = () => {
    showDeleteButton = !showDeleteButton;
  };

  // For modal
  // See:
  // https://svelte-5-ui-lib.codewithshin.com/components/modal
  const modal = uiHelpers();
  let modalStatus = $state(false);
  const openModal = modal.open;
  const closeModal = modal.close;

  $effect(() => {
    modalStatus = modal.isOpen;
  });
</script>

<ContainerWrapper>
  <FormWrapper action="">
    <Alert color="red" class="!items-start">
      {#snippet icon()}
        <Info class="w-6 h-6" />
      {/snippet}
      <span class="font-medium text-lg">警告</span>
      <WarningMessageOnDeletingAccount />
    </Alert>

    <LabelWrapper labelName="ユーザ名" inputValue={username} />
    <Checkbox onclick={toggleDeleteButton}>同意する</Checkbox>

    {#if showDeleteButton}
      <Button onclick={openModal} class="w-full">アカウントを削除</Button>

      <Modal size="xs" {modalStatus} {closeModal} outsideClose>
        <p class="font-medium text-lg text-center">{username}さん、本当に削除しますか?</p>
        <WarningMessageOnDeletingAccount />

        <FormWrapper action="?/delete">
          <!-- hiddenでusernameを持つのは共通 -->
          <Input size="sm" type="hidden" name="username" bind:value={username} />
          <Button type="submit" class="w-full">読んで理解したので、アカウントを削除</Button>
        </FormWrapper>
      </Modal>
    {/if}
  </FormWrapper>
</ContainerWrapper>
