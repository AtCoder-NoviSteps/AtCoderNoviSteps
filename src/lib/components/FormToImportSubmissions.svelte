<script lang="ts">
  import { Alert, Li, List, Input } from 'flowbite-svelte';
  // @ts-ignore
  import InfoCircleSolid from 'flowbite-svelte-icons/InfoCircleSolid.svelte';
  import { DateInput, localeFromDateFnsLocale } from 'date-picker-svelte';
  import { ja } from 'date-fns/locale';

  import ContainerWrapper from '$lib/components/ContainerWrapper.svelte';
  import FormWrapper from '$lib/components/FormWrapper.svelte';
  import ReadOnlyLabel from '$lib/components/ReadOnlyLabel.svelte';
  import SubmissionButton from '$lib/components/SubmissionButton.svelte';

  import { dateToUnixSecond } from '$lib/utils/time';

  export let username: string;
  export let atcoder_username: string;
  export let atcoder_account_is_validated: boolean;

  // @ts-ignore
  const locale = localeFromDateFnsLocale(ja);

  let startDate: Date | null = new Date();
  $: startDateInUnixSecond = dateToUnixSecond(startDate);
</script>

{#if atcoder_account_is_validated}
  <ContainerWrapper>
    <FormWrapper action="?/fetch">
      <Alert color="blue" class="!items-start">
        <InfoCircleSolid slot="icon" class="w-6 h-6" />
        <span class="font-medium text-lg">お知らせ</span>

        <p class="font-medium">以下の条件・制約に基づいて回答が登録されます</p>

        <List class="mt-1.5 ms-4 list-disc list-inside">
          <Li>更新対象: 本アプリで未回答の問題</Li>
          <Li>登録内容: AtCoder ProblemsのAPIから正解 / 不正解のみ</Li>
          <Li>注1: 同じ問題で複数回答があるときは、最新の結果を登録</Li>
          <Li>注2: 登録済みの回答は上書きしない</Li>
          <Li>注3: 指定した日時から、1回あたり最大500件</Li>
        </List>
      </Alert>
      <ReadOnlyLabel labelName="ユーザ名" inputValue={username} />

      <Input size="md" type="hidden" name="atcoder_username" bind:value={atcoder_username} />
      <ReadOnlyLabel labelName="AtCoder ID" inputValue={atcoder_username} />

      <!-- FIXME: フォーマットを他のコンポーネントと揃える -->
      <!-- See: -->
      <!-- (2024年3月時点) Flowbite系のカレンダーは動作が不安定なため、「Date Picker Svelte」を使用 -->
      <!-- https://github.com/probablykasper/date-picker-svelte -->
      <!-- https://date-fns.org/ -->
      <!-- https://qiita.com/maaaashi/items/904b412a1b14b0d4dccc -->
      <Input
        size="sm"
        type="hidden"
        name="start_date_in_unix_second"
        bind:value={startDateInUnixSecond}
      />
      <div class="text-gray-900 font-medium text-sm space-y-2">
        <span class="">インポートの開始日(任意)</span>
        <DateInput
          placeholder="${startDate}"
          format="yyyy/MM/dd"
          closeOnSelection={true}
          browseWithoutSelecting={true}
          {locale}
          bind:value={startDate}
          class="w-full max-w-md rounded-lg"
        />
      </div>

      <SubmissionButton labelName="インポート" />
    </FormWrapper>
  </ContainerWrapper>
{:else}
  TODO: 本人確認を促すメッセージとボタンを追加する
{/if}
