<script lang="ts">
  import { Input } from 'flowbite-svelte';

  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import ReadOnlyLabel from '$lib/components/ReadOnlyLabel.svelte';
  import SubmissionButton from '$lib/components/SubmissionButton.svelte';

  export let username: string;
  export let atcoder_username: string;
  export let atcoder_account_is_validated: boolean;
</script>

<!-- FIXME: 体裁を修正 -->
{#if atcoder_account_is_validated}
  <ContainerWrapper>
    <FormWrapper action="?/fetch">
      <Input size="sm" type="hidden" name="username" bind:value={username} />
      <ReadOnlyLabel labelName="ユーザ名" inputValue={username} />

      <Input size="md" type="hidden" name="atcoder_username" bind:value={atcoder_username} />
      <ReadOnlyLabel labelName="AtCoder ID" inputValue={atcoder_username} />

      <!-- TODO: 日時をコンポーネントから指定できるようにする -->
      <!-- <Input size="sm" type="hidden" name="" bind:value={} /> -->

      <SubmissionButton labelName="インポート" />
    </FormWrapper>
  </ContainerWrapper>
{:else}
  TODO: 本人確認を促すメッセージとボタンを追加する
{/if}
