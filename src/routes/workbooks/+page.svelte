<script lang="ts">
  import { Button, Tabs } from 'flowbite-svelte';

  export let data;

  $: workbooks = data.workbooks;
  let loggedInUser = data.loggedInUser;

  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import TabItemWrapper from '$lib/components/TabItemWrapper.svelte';
  import WorkBookList from '$lib/components/WorkBooks/WorkBookList.svelte';
  import { type WorkbookList, type WorkbooksList, WorkBookType } from '$lib/types/workbook';

  const getWorkBooksByType = (workbooks: WorkbooksList, workBookType: WorkBookType) => {
    const filteredWorkbooks = workbooks.filter(
      (workbook: WorkbookList) => workbook.workBookType === workBookType,
    );
    return filteredWorkbooks;
  };

  // FIXME: 各問題集の説明文を推敲
  const workBookTabs = [
    {
      title: '教科書',
      workBookType: WorkBookType.TEXTBOOK,
      isOpen: true,
      tooltipContent: '特定のグレードの問題を挑戦するのに必要な基礎知識が学べます',
    },
    {
      title: '解法別',
      workBookType: WorkBookType.SOLUTION,
      isOpen: false,
      tooltipContent: '特定の解法を応用する力が身につけられます',
    },
    {
      title: 'ジャンル別',
      workBookType: WorkBookType.GENRE,
      isOpen: false,
      tooltipContent: '特定のジャンル (グラフ理論・文字列など) を重点的に練習できます',
    },
    {
      title: 'その他',
      workBookType: WorkBookType.OTHERS,
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
  <HeadingOne title="問題集" />

  <Button href="/workbooks/create" type="submit" class="mt-4 mb-4">新規作成</Button>

  <!-- TODO: 教科書のみグレード単位で表示 -->
  <!-- TODO: 回答状況を実際のデータに置き換える -->
  <!-- TODO: ページネーションを追加 -->
  <Tabs tabStyle="underline" contentClass="bg-white">
    {#each workBookTabs as workBookTab}
      <TabItemWrapper
        isOpen={workBookTab.isOpen}
        title={workBookTab.title}
        tooltipContent={workBookTab.tooltipContent}
      >
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
