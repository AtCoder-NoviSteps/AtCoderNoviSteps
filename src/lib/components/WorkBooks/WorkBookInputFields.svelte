<script lang="ts">
  import MessageHelperWrapper from '$lib/components/MessageHelperWrapper.svelte';
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';
  import SelectWrapper from '$lib/components/SelectWrapper.svelte';
  import { WorkBookType } from '$lib/types/workbook';

  // FIXME: 引数がとても多いので、コンポーネントに渡す引数を減らす方法を調べて実装。
  export let authorId: string;
  export let workBookTitle: string;
  export let description: string;
  export let isPublished: boolean;
  export let isOfficial: boolean;
  export let isReplenished: boolean;
  export let workBookType: WorkBookType;
  export let isAdmin: boolean;
  export let isEditable: boolean = true;
  export let message: string = '';
  export let errors: Record<string, unknown> = {};

  let isPublishedOptions = [
    { value: false, name: '非公開' },
    { value: true, name: '公開' },
  ];

  let isReplenishedOptions = [
    { value: false, name: '本編' },
    { value: true, name: '補充' },
  ];

  const workBookTypeOptions = (isOfficial: boolean, isAdmin: boolean = false) => {
    // Note: カリキュラムは、旧 教科書。スキーマの属性を変更していないのは、名称の変更の可能性があるため。
    const allWorkBookTypes = [
      { value: WorkBookType.TEXTBOOK, name: 'カリキュラム' },
      { value: WorkBookType.SOLUTION, name: '解法別' },
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

  $: isCurriculum = workBookType === WorkBookType.TEXTBOOK;
</script>

<MessageHelperWrapper {message} />

<!-- (ユーザには非表示) 作者 -->
<InputFieldWrapper
  inputFieldType="hidden"
  inputFieldName="userId"
  bind:inputValue={authorId}
  isEditable={false}
/>

<!-- タイトル -->
<InputFieldWrapper
  labelName="タイトル（3〜200文字）"
  inputFieldName="title"
  bind:inputValue={workBookTitle}
  {isEditable}
  message={errors.title}
/>

<!-- 問題集の概要 -->
<InputFieldWrapper
  labelName="概要（300文字以下）"
  inputFieldName="description"
  bind:inputValue={description}
  {isEditable}
  message={errors.description}
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

<!-- 管理者のみ: 問題集の種類を指定-->
<SelectWrapper
  labelName="問題集の種類"
  innerName="workBookType"
  items={workBookTypeOptions(isOfficial, isAdmin)}
  bind:inputValue={workBookType}
  isEditable={isAdmin && isEditable}
/>

<!-- HACK: 表記については修正の余地がある -->
<!-- 管理者のみ: 問題集が本編 / 補充か -->
<SelectWrapper
  labelName="問題集の位置付け"
  innerName="isReplenished"
  items={isReplenishedOptions}
  bind:inputValue={isReplenished}
  isEditable={isAdmin && isEditable && isCurriculum}
/>
