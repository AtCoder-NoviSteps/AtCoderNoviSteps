<script lang="ts">
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';
  import SelectWrapper from '$lib/components/SelectWrapper.svelte';
  import { WorkBookType } from '$lib/types/workbook';

  export let authorId: string;
  export let workBookTitle: string;
  export let description: string;
  export let isPublished: boolean;
  export let isOfficial: boolean;
  export let workBookType: WorkBookType;
  export let isAdmin: boolean;
  export let isEditable: boolean = true;

  let isPublishedOptions = [
    { value: false, name: '非公開' },
    { value: true, name: '公開' },
  ];

  const workBookTypeOptions = (isOfficial: boolean, isAdmin: boolean = false) => {
    const allWorkBookTypes = [
      { value: WorkBookType.TEXTBOOK, name: '教科書' },
      { value: WorkBookType.SOLUTION, name: '解法別' },
      { value: WorkBookType.GENRE, name: 'ジャンル別' },
      { value: WorkBookType.OTHERS, name: 'その他' },
      { value: WorkBookType.CREATED_BY_USER, name: 'ユーザ作成' },
    ];

    if (isOfficial) {
      return allWorkBookTypes.filter((type) => type.value !== WorkBookType.CREATED_BY_USER);
    }

    if (isAdmin) {
      return allWorkBookTypes;
    } else {
      return allWorkBookTypes.filter((type) => type.value === WorkBookType.CREATED_BY_USER);
    }
  };
</script>

<!-- (ユーザには非表示) 作者 -->
<InputFieldWrapper
  inputFieldType="hidden"
  inputFieldName="userId"
  bind:inputValue={authorId}
  isEditable={false}
/>

<!-- タイトル -->
<InputFieldWrapper
  labelName="タイトル"
  inputFieldName="title"
  bind:inputValue={workBookTitle}
  {isEditable}
/>

<!-- 説明 -->
<InputFieldWrapper
  labelName="説明"
  inputFieldName="description"
  bind:inputValue={description}
  {isEditable}
/>

<!-- 一般公開の有無 -->
<SelectWrapper
  labelName="公開状況"
  innerName="isPublished"
  items={isPublishedOptions}
  bind:inputValue={isPublished}
  {isEditable}
/>

<!-- (ユーザには非表示) 管理者 / 一般ユーザ -->
<InputFieldWrapper
  inputFieldType="hidden"
  inputFieldName="isOfficial"
  bind:inputValue={isOfficial}
  isEditable={false}
/>

<!-- 管理者のみ: 問題集の区分を指定-->
<SelectWrapper
  labelName="問題集の区分"
  innerName="workBookType"
  items={workBookTypeOptions(isOfficial, isAdmin)}
  bind:inputValue={workBookType}
  isEditable={isAdmin && isEditable}
/>
