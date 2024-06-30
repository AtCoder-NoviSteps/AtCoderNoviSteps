<script lang="ts">
  import { Button, Tabs } from 'flowbite-svelte';

  export let data;

  $: workbooks = data.workbooks;
  let loggedInUser = data.loggedInUser;

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TabItemWrapper from '$lib/components/TabItemWrapper.svelte';
  import WorkBookList from '$lib/components/WorkBooks/WorkBookList.svelte';
  import {
    type WorkbooksWithAuthorNames,
    type WorkbookWithAuthorName,
    WorkBookType,
  } from '$lib/types/workbook';

  const getWorkBooksByType = (workbooks: WorkbooksWithAuthorNames, workBookType: WorkBookType) => {
    const filteredWorkbooks = workbooks.filter(
      (workbook: WorkbookWithAuthorName) => workbook.workBookType === workBookType,
    );
    return filteredWorkbooks;
  };

  const workBookTabs = [
    {
      title: '教科書',
      workBookType: WorkBookType.TEXTBOOK,
      isOpen: true,
    },
    {
      title: '解法別',
      workBookType: WorkBookType.SOLUTION,
      isOpen: false,
    },
    {
      title: 'ジャンル別',
      workBookType: WorkBookType.GENRE,
      isOpen: false,
    },
    {
      // TODO: その他に書き換え
      title: 'テーマ別',
      workBookType: WorkBookType.THEME,
      isOpen: false,
    },
    {
      title: 'ユーザ作成',
      workBookType: WorkBookType.CREATED_BY_USER,
      isOpen: false,
    },
  ];
</script>

<div class="container mx-auto w-5/6">
  <HeadingOne title="問題集一覧" />

  <Button href="/workbooks/create" type="submit" class="mt-4 mb-4">新規作成</Button>

  <!-- TODO: 教科書のみグレード単位で表示 -->
  <!-- TODO: 回答状況を実際のデータに置き換える -->
  <!-- TODO: タブに各問題集の説明をtooltipsの形で追加 -->
  <!-- TODO: ページネーションを追加 -->
  <Tabs tabStyle="underline" contentClass="bg-white">
    {#each workBookTabs as workBookTab}
      <TabItemWrapper isOpen={workBookTab.isOpen} title={workBookTab.title}>
        <div class="mt-6">
          <WorkBookList
            workbooks={getWorkBooksByType(workbooks, workBookTab.workBookType)}
            {loggedInUser}
          />
        </div>
      </TabItemWrapper>
    {/each}
  </Tabs>
</div>
