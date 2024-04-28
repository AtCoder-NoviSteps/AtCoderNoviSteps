<script lang="ts">
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';
  import SelectWrapper from '$lib/components/SelectWrapper.svelte';
  import { WorkBookType } from '$lib/types/workbook';

  export let authorId: string;
  export let title: string;
  export let isPublished: boolean;
  export let isOfficial: boolean;
  export let workBookType: WorkBookType;

  let isPublishedOptions = [
    { value: false, name: '非公開' },
    { value: true, name: '公開' },
  ];

  const workBookTypeOptions = (isOfficial: boolean) => {
    if (isOfficial) {
      const types = [
        { value: WorkBookType.TEXTBOOK, name: '教科書' },
        { value: WorkBookType.SOLUTION, name: '解法別' },
        { value: WorkBookType.GENRE, name: 'ジャンル別' },
        { value: WorkBookType.THEME, name: 'テーマ別' },
      ];

      return types;
    } else {
      const types = [{ value: WorkBookType.CREATED_BY_USER, name: 'ユーザ作成' }];

      return types;
    }
  };
</script>

<!-- (ユーザには非表示) 作者 -->
<InputFieldWrapper inputFieldType="hidden" inputFieldName="authorId" inputValue={authorId} />

<!-- タイトル -->
<InputFieldWrapper labelName="タイトル" inputFieldName="title" inputValue={title} />

<!-- 一般公開の有無 -->
<SelectWrapper
  labelName="公開状況"
  innerName="isPublished"
  items={isPublishedOptions}
  inputValue={isPublished}
/>

<!-- (ユーザには非表示) 管理者 / 一般ユーザ -->
<InputFieldWrapper inputFieldType="hidden" inputFieldName="isOfficial" inputValue={isOfficial} />

<!-- 管理者のみ: 問題集の区分を指定-->
<SelectWrapper
  labelName="問題集の区分"
  innerName="workBookType"
  items={workBookTypeOptions(isOfficial)}
  inputValue={workBookType}
/>
