<script lang="ts">
  import { Input, Button, Alert, Checkbox, Modal } from 'flowbite-svelte';
  import Info from '@lucide/svelte/icons/info';

  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import LabelWrapper from '$lib/components/LabelWrapper.svelte';
  import WarningMessageOnDeletingAccount from '$lib/components/WarningMessageOnDeletingAccount.svelte';

  interface Props {
    username: string;
  }

  let { username = $bindable() }: Props = $props();

  let isShownButtonForDelete = $state(false);
  let isOpenModalForDelete = $state(false);
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
    <Checkbox bind:checked={isShownButtonForDelete}>同意する</Checkbox>

    {#if isShownButtonForDelete}
      <Button onclick={() => (isOpenModalForDelete = true)} class="w-full">アカウントを削除</Button>

      <Modal bind:open={isOpenModalForDelete} size="xs" outsideclose={true}>
        <p class="font-medium text-lg text-center">{username}さん、本当に削除しますか?</p>
        <WarningMessageOnDeletingAccount />

        <FormWrapper action="?/delete">
          <!-- hiddenでusernameを持つのは共通 -->
          <Input type="hidden" name="username" bind:value={username} />
          <Button type="submit" class="w-full">読んで理解したので、アカウントを削除</Button>
        </FormWrapper>
      </Modal>
    {/if}
  </FormWrapper>
</ContainerWrapper>
