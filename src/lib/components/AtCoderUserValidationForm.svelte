<script lang="ts">
  import { Label, Input, P } from 'flowbite-svelte';
  // @ts-ignore
  import ClipboardOutline from 'flowbite-svelte-icons/ClipboardOutline.svelte';
  import { copyToClipboard } from 'stwui/utils/copyToClipboard';
  //import type { ActionForm } from './$types';

  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import LabelWrapper from '$lib/components/LabelWrapper.svelte';
  import SubmissionButton from '$lib/components/SubmissionButton.svelte';

  export let username: string;
  export let atcoder_username: string;
  export let atcoder_validationcode: string;

  // status = notiong : username = "hogehoge" and atcoder_username = "" and atcoder_validationcode = "" and atcoder_validated = false
  // status = generated : username = "hogehoge" and atcoder_username = "fugafuga" and atcoder_validationcode = "xxxxxx" and validated = false
  // status = validated =  username = "hogehoge" and atcoder_username = "fugafuga" and atcoder_validationcode = "" and validated = true
  // for noting -> generated, push "generate" button (only "generate" button is aveilable)
  // for generated -> validated, push "validate" button ( "validate" and "edit" button is available )

  // for generated/validated -> notiong, push "edit" button ( "edit" is available)
  export let status: string;

  // TODO: クリックしたときに、Copied!といったメッセージを表示できるようにしたい。
  // WHY: コピーができているか、確認できるようにするため
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

      <P PsizeType="md" class="mt-6">AtCoder IDを入力し、本人確認用の文字列を生成してください。</P>

      <!-- hiddenでusernameを持つのは共通-->
      <Input size="md" type="hidden" name="username" bind:value={username} />
      <LabelWrapper labelName="ユーザ名" inputValue={username} />

      <Label class="space-y-2">
        <!-- AtCoder IDを修正できるのは、notingのステータスの時のみ-->
        <span>AtCoder ID</span>
        <Input
          size="md"
          label="atcoder_username"
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

      <P PsizeType="md" class="mt-6">
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
        name="usernatcoder_validationcodeame"
        bind:value={atcoder_validationcode}
      />

      <Label class="space-y-2">
        <span>本人確認用の文字列</span>
        <div>
          <Input size="md" bind:value={atcoder_validationcode}>
            <ClipboardOutline slot="right" class="w-5 h-5" on:click={handleClick} />
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
