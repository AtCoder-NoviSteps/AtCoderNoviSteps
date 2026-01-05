<script lang="ts">
  import { Label, Input, P } from 'flowbite-svelte';
  import ClipboardCopy from '@lucide/svelte/icons/clipboard-copy';

  // TODO: Use Flowbite's ClipboardCopy component when available
  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Text copied to clipboard successfully');
    } catch (error) {
      // Fallback for older browsers that do not support the Clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        console.log('Text copied fallback method');
      } catch (fallbackError) {
        console.error('Both Clipboard API and fallback failed:', error, fallbackError);
      }

      document.body.removeChild(textArea);
    }
  };

  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import LabelWrapper from '$lib/components/LabelWrapper.svelte';
  import SubmissionButton from '$lib/components/SubmissionButton.svelte';

  interface Props {
    username: string;
    atcoder_username: string;
    atcoder_validationcode: string;
    status: string;
  }

  let {
    username = $bindable(),
    atcoder_username = $bindable(),
    atcoder_validationcode = $bindable(),
    status,
  }: Props = $props();

  // TODO: Add a "Copied!" message when clicking
  // WHY: To provide feedback when the copy operation succeeds
  const handleClick = () => {
    copyToClipboard(atcoder_validationcode);
  };
</script>

{#if status === 'nothing'}
  <ContainerWrapper>
    <FormWrapper action="?/generate" marginTop="">
      <h3 class="text-xl text-center mt-6 font-medium text-gray-900 dark:text-white">
        本人確認の準備中
      </h3>

      <P size="base" class="mt-6">AtCoder IDを入力し、本人確認用の文字列を生成してください。</P>

      <!-- hiddenでusernameを持つのは共通-->
      <Input size="md" type="hidden" name="username" bind:value={username} />
      <LabelWrapper labelName="ユーザ名" inputValue={username} />

      <Label class="space-y-2">
        <!-- AtCoder IDを修正できるのは、notingのステータスの時のみ-->
        <span>AtCoder ID</span>
        <Input
          size="md"
          name="atcoder_username"
          placeholder="chokudai"
          bind:value={atcoder_username}
        />
      </Label>

      <SubmissionButton labelName="文字列を生成" />
    </FormWrapper>
  </ContainerWrapper>
{:else if status === 'generated'}
  <ContainerWrapper>
    <FormWrapper action="?/validate" marginTop="">
      <h3 class="text-xl text-center mt-6 font-medium text-gray-900 dark:text-white">本人確認中</h3>

      <P size="base" class="mt-6">
        AtCoderの所属欄に生成した文字列を貼り付けてから、「本人確認」ボタンを押してください。
      </P>

      <!-- hiddenでusernameを持つのは共通-->
      <Input size="md" type="hidden" name="username" bind:value={username} />
      <LabelWrapper labelName="ユーザ名" inputValue={username} />

      <!-- atcoder_usernameとvalidation_code は編集不可-->
      <Input size="md" type="hidden" name="atcoder_username" bind:value={atcoder_username} />
      <LabelWrapper labelName="AtCoder ID" inputValue={atcoder_username} />

      <Input
        size="md"
        type="hidden"
        name="atcoder_validationcode"
        bind:value={atcoder_validationcode}
      />

      <Label class="space-y-2">
        <span>本人確認用の文字列</span>
        <div>
          <Input size="md" bind:value={atcoder_validationcode}>
            {#snippet right()}
              <ClipboardCopy class="w-5 h-5" onclick={handleClick} />
            {/snippet}
          </Input>
        </div>
      </Label>

      <SubmissionButton labelName="本人確認" />
    </FormWrapper>

    <FormWrapper action="?/reset" marginTop="">
      <Input size="md" type="hidden" name="username" bind:value={username} />
      <Input size="md" type="hidden" name="atcoder_username" bind:value={atcoder_username} />

      <SubmissionButton labelName="リセット" />
    </FormWrapper>
  </ContainerWrapper>
{:else if status === 'validated'}
  <ContainerWrapper>
    <FormWrapper action="?/reset">
      <h3 class="text-xl text-center font-medium text-gray-900 dark:text-white">本人確認済</h3>

      <!-- hiddenでusernameを持つのは共通-->
      <Input size="md" type="hidden" name="username" bind:value={username} />
      <LabelWrapper labelName="ユーザ名" inputValue={username} />

      <!-- atcoder_usernameを表示（変更不可）-->
      <Input size="md" type="hidden" name="atcoder_username" bind:value={atcoder_username} />
      <LabelWrapper labelName="AtCoder ID" inputValue={atcoder_username} />

      <SubmissionButton labelName="リセット" />
    </FormWrapper>
  </ContainerWrapper>
{/if}
