<script lang="ts">
  import { Input, Button, Alert, Checkbox, Li, List } from 'flowbite-svelte';
  // @ts-ignore
  import InfoCircleSolid from 'flowbite-svelte-icons/InfoCircleSolid.svelte';

  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import ReadOnlyLabel from '$lib/components/ReadOnlyLabel.svelte';

  export let username: string;

  let showDeleteButton = false;

  const toggleDeleteButton = () => {
    showDeleteButton = !showDeleteButton;
  };
</script>

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
