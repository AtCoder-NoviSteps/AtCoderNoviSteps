<script lang="ts">
  import { Label, Input, Button, P } from 'flowbite-svelte';
  // @ts-ignore
  import ClipboardOutline from 'flowbite-svelte-icons/ClipboardOutline.svelte';
  import { copyToClipboard } from 'stwui/utils/copyToClipboard';
  //import type { ActionForm } from './$types';

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
  <div class="container mx-auto w-5/6 flex flex-col items-center">
    <form method="POST" action="?/generate" class="w-full max-w-md space-y-6">
      <h3 class="text-xl text-center mt-6 font-medium text-gray-900 dark:text-white">
        本人確認の準備中
      </h3>

      <P PsizeType="md" class="mt-6">AtCoder IDを入力し、本人確認用の文字列を生成してください。</P>

      <!-- hiddenでusernameを持つのは共通-->
      <Input size="md" type="hidden" name="username" bind:value={username} />
      <Label class="space-y-2">
        <span>ユーザ名</span>
        <Input size="md" disabled readonly bind:value={username} />
      </Label>
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
      <Button type="submit" class="w-full">文字列を生成</Button>
    </form>
  </div>
{:else if status === 'generated'}
  <div class="container mx-auto w-5/6 flex flex-col items-center">
    <form method="POST" action="?/validate" class="w-full max-w-md space-y-6">
      <h3 class="text-xl text-center mt-6 font-medium text-gray-900 dark:text-white">本人確認中</h3>

      <P PsizeType="md" class="mt-6">
        AtCoderの所属欄に生成した文字列を貼り付けてから、「本人確認」ボタンを押してください。
      </P>

      <!-- hiddenでusernameを持つのは共通-->
      <Input size="md" type="hidden" name="username" bind:value={username} />
      <Label class="space-y-2">
        <span>ユーザ名</span>
        <Input size="md" disabled readonly bind:value={username} />
      </Label>

      <!-- atcoder_usernameとvalidation_code は編集不可-->
      <Input size="md" type="hidden" name="atcoder_username" bind:value={atcoder_username} />
      <Label class="space-y-2">
        <span>AtCoder ID</span>
        <Input size="md" disabled readonly bind:value={atcoder_username} />
      </Label>

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

      <Button type="submit" class="w-full">本人確認</Button>
    </form>

    <form method="POST" action="?/reset" class="w-full max-w-md space-y-6">
      <Input size="md" type="hidden" name="username" bind:value={username} />
      <Input size="md" type="hidden" name="atcoder_username" bind:value={atcoder_username} />
      <Button type="submit" class="w-full">リセット</Button>
    </form>
  </div>
{:else if status === 'validated'}
  <div class="container mx-auto w-5/6 flex flex-col items-center">
    <form method="POST" action="?/reset" class="w-full max-w-md mt-6 space-y-6">
      <h3 class="text-xl text-center font-medium text-gray-900 dark:text-white">本人確認済</h3>

      <!-- hiddenでusernameを持つのは共通-->
      <Input size="md" type="hidden" name="username" bind:value={username} />
      <Label class="space-y-2">
        <span>ユーザ名</span>
        <Input size="md" disabled readonly bind:value={username} />
      </Label>

      <!-- atcoder_usernameを表示（変更不可）-->
      <Input size="md" type="hidden" name="atcoder_username" bind:value={atcoder_username} />
      <Label class="space-y-2">
        <span>AtCoder ID</span>
        <Input size="md" disabled readonly bind:value={atcoder_username} />
      </Label>

      <Button type="submit" class="w-full">リセット</Button>
    </form>
  </div>
{/if}
