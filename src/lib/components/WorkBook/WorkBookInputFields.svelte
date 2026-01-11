<script lang="ts">
  import MessageHelperWrapper from '$lib/components/MessageHelperWrapper.svelte';
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';
  import SelectWrapper from '$lib/components/SelectWrapper.svelte';
  import { WorkBookType } from '$lib/types/workbook';

  interface Props {
    // FIXME: 引数がとても多いので、コンポーネントに渡す引数を減らす方法を調べて実装。
    authorId: string;
    workBookTitle: string;
    description: string;
    editorialUrl: string;
    isPublished: boolean;
    isOfficial: boolean;
    isReplenished: boolean;
    urlSlug?: string | null;
    workBookType: WorkBookType;
    isAdmin: boolean;
    isEditable?: boolean;
    message?: string;
    errors?: Record<string, unknown>;
  }

  let {
    authorId = $bindable(),
    workBookTitle = $bindable(),
    description = $bindable(),
    editorialUrl = $bindable(),
    isPublished = $bindable(),
    isOfficial = $bindable(),
    isReplenished = $bindable(),
    urlSlug = $bindable(undefined),
    workBookType = $bindable(),
    isAdmin,
    isEditable = true,
    message = '',
    errors = {},
  }: Props = $props();

  let isPublishedOptions = [
    { value: false, name: '非公開' },
    { value: true, name: '公開' },
  ];

  let isReplenishedOptions = [
    { value: false, name: '手引き' },
    { value: true, name: '補充' },
  ];

  const workBookTypeOptions = (isOfficial: boolean, isAdmin: boolean = false) => {
    const allWorkBookTypes = [
      { value: WorkBookType.CURRICULUM, name: 'カリキュラム' },
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

  let isCurriculum = $derived(workBookType === WorkBookType.CURRICULUM);
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

<!-- カリキュラムのトピック解説用のURL -->
<!-- HACK: 「ユーザ作成」の場合も利用できるようにするかは要検討。 -->
<InputFieldWrapper
  labelName="本問題集におけるトピックの解説URL（300文字以下）"
  inputFieldName="editorialUrl"
  bind:inputValue={editorialUrl}
  {isEditable}
  message={errors.editorialUrl}
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

<div class="flex flex-col md:flex-row items-start md:items-center justify-between md:gap-4">
  <!-- 管理者のみ: 問題集の種類を指定-->
  <div class="w-full md:w-1/2 mb-2 md:mb-0">
    <SelectWrapper
      labelName="問題集の種類"
      innerName="workBookType"
      items={workBookTypeOptions(isOfficial, isAdmin)}
      bind:inputValue={workBookType}
      isEditable={isAdmin && isEditable}
    />
  </div>

  <!-- 管理者のみ: 問題集が手引き / 補充か -->
  <div class="w-full md:w-1/2">
    <SelectWrapper
      labelName="問題集の位置付け"
      innerName="isReplenished"
      items={isReplenishedOptions}
      bind:inputValue={isReplenished}
      isEditable={isAdmin && isEditable && isCurriculum}
    />
  </div>
</div>

<!-- 管理者のみ: 問題集のカスタムURL (一般ユーザには非表示) -->
<InputFieldWrapper
  inputFieldType={isAdmin ? null : 'hidden'}
  labelName={isAdmin
    ? '問題集のカスタムURL（30文字以下、半角英小文字・半角数字・ハイフンのみ。ただし、数字のみは不可）'
    : ''}
  inputFieldName="urlSlug"
  bind:inputValue={urlSlug}
  isEditable={isAdmin && isEditable}
  message={errors.urlSlug}
/>
