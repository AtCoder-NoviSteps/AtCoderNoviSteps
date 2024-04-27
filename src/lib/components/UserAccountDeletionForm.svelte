<script lang="ts">
  import { Input, Button, Alert, Checkbox, Modal } from 'flowbite-svelte';
  // @ts-ignore
  import InfoCircleSolid from 'flowbite-svelte-icons/InfoCircleSolid.svelte';

  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import LabelWrapper from '$lib/components/LabelWrapper.svelte';
  import WarningMessageOnDeletingAccount from '$lib/components/WarningMessageOnDeletingAccount.svelte';

  export let username: string;

  let showDeleteButton = false;
  let defaultModal = false;

  const toggleDeleteButton = () => {
    showDeleteButton = !showDeleteButton;
  };

  const openModal = () => {
    defaultModal = true;
  };
</script>

<ContainerWrapper>
  <FormWrapper action="">
    <Alert color="red" class="!items-start">
      <InfoCircleSolid slot="icon" class="w-6 h-6" />
      <span class="font-medium text-lg">警告</span>
      <WarningMessageOnDeletingAccount />
    </Alert>

    <LabelWrapper labelName="ユーザ名" inputValue={username} />
    <Checkbox on:click={toggleDeleteButton}>同意する</Checkbox>

    {#if showDeleteButton}
      <Button on:click={openModal} class="w-full">アカウントを削除</Button>

      <Modal size="xs" bind:open={defaultModal} outsideclose>
        <p class="font-medium text-lg text-center">{username}さん、本当に削除しますか?</p>
        <WarningMessageOnDeletingAccount />

        <FormWrapper action="?/delete">
          <!-- hiddenでusernameを持つのは共通 -->
          <Input size="sm" type="hidden" name="username" bind:value={username} />
          <Button readonly type="submit" class="w-full">
            読んで理解したので、アカウントを削除
          </Button>
        </FormWrapper>
      </Modal>
    {/if}
  </FormWrapper>
</ContainerWrapper>
