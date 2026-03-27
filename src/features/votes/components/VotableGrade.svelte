<script lang="ts">
  import { tick } from 'svelte';
  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';

  import { Dropdown, DropdownItem, DropdownDivider } from 'flowbite-svelte';
  import Check from '@lucide/svelte/icons/check';

  import { TaskGrade, getTaskGrade, type TaskResult } from '$lib/types/task';
  import { getTaskGradeLabel } from '$lib/utils/task';
  import { nonPendingGrades } from '$features/votes/utils/grade_options';
  import { SIGNUP_PAGE, LOGIN_PAGE, EDIT_PROFILE_PAGE } from '$lib/constants/navbar-links';
  import { errorMessageStore } from '$lib/stores/error_message';

  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';

  interface Props {
    taskResult: TaskResult;
    isLoggedIn: boolean;
    // undefined means the prop was not passed — treat as verified to maintain backward compatibility.
    isAtCoderVerified?: boolean;
    estimatedGrade?: string;
  }

  let { taskResult, isLoggedIn, isAtCoderVerified, estimatedGrade }: Props = $props();

  // 表示用のグレード（投票後に画面リロードなしで差し替えるためのローカル状態）
  // PENDING かつ estimatedGrade（集計済み中央値）があればそれを優先表示。
  // DBグレード付与済みの場合はそちらを優先。
  const initialGrade =
    taskResult.grade === TaskGrade.PENDING
      ? (estimatedGrade ?? taskResult.grade)
      : taskResult.grade;
  let displayGrade = $state<TaskGrade | string>(initialGrade);

  // Use task_id as a deterministic component ID to avoid SSR/hydration mismatches.
  const componentId = taskResult.task_id;

  // @ts-expect-error svelte-check TS2554: AppTypes declaration merging causes RouteId to resolve as string, requiring params. Runtime behavior is correct.
  const editProfileHref = resolve(EDIT_PROFILE_PAGE);

  let selectedVoteGrade = $state<TaskGrade>();
  let showForm = $state(false);
  let formElement = $state<HTMLFormElement | undefined>(undefined);

  let isOpening = $state(false);
  let votedGrade = $state<TaskGrade | null>(null);

  async function onTriggerClick() {
    if (!isLoggedIn || isAtCoderVerified === false || isOpening) return;
    isOpening = true;
    try {
      const res = await fetch(
        `/problems/getMyVote?taskId=${encodeURIComponent(taskResult.task_id)}`,
        {
          headers: { Accept: 'application/json' },
        },
      );
      if (res.ok) {
        const data = await res.json();
        votedGrade = data.grade;
      }
    } catch (err) {
      console.error(err);
    } finally {
      isOpening = false;
    }
  }

  async function handleClick(voteGrade: string): Promise<void> {
    selectedVoteGrade = getTaskGrade(voteGrade);
    showForm = true;
    // Wait for Svelte to render the form, then submit via the enhance directive.
    await tick();
    formElement?.requestSubmit();
  }

  type EnhanceForVote = {
    formData: FormData;
    action: URL;
    cancel: () => void;
  };

  const FAILED_TO_UPDATE_VOTE_STATUS = '投票状況の更新に失敗しました。もう一度試してください。';

  const handleSubmit = () => {
    return ({ formData, action, cancel }: EnhanceForVote) => {
      // Cancel the default form submission.
      cancel();

      // Submit data manually using fetch API.
      fetch(action, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error('vote failed');

          // 投票したグレードをローカル状態に反映（チェックマーク更新）
          votedGrade = selectedVoteGrade ?? null;

          // 成功したらサーバから最新の中央値を取得して表示を更新
          try {
            const taskId = formData.get('taskId') as string;
            const medianRes = await fetch(
              `/problems/getMedianVote?taskId=${encodeURIComponent(taskId)}`,
              { headers: { Accept: 'application/json' } },
            );
            if (medianRes.ok) {
              const data = await medianRes.json();
              // DBグレード付与済みはそちらを優先表示するため更新しない
              if (data?.grade && taskResult.grade === TaskGrade.PENDING) displayGrade = data.grade;
            }
          } catch (err) {
            console.error('Failed to fetch median after vote', err);
          }
        })
        .catch((error) => {
          console.error('Failed to update submission status: ', error);
          errorMessageStore.setAndClearAfterTimeout(FAILED_TO_UPDATE_VOTE_STATUS, 10000);
        })
        .finally(() => {
          resetDropdown();
        });

      // Do not change anything in SvelteKit.
      return () => {};
    };
  };

  function resetDropdown(): void {
    showForm = false;
  }
</script>

<!-- Grade Icon（全問題で投票ドロップダウンを表示） -->
<button
  id={`update-grade-dropdown-trigger-${componentId}`}
  class="relative group shrink-0 cursor-pointer"
  type="button"
  tabindex="0"
  aria-label="Vote grade"
  onclick={() => onTriggerClick()}
>
  <GradeLabel taskGrade={displayGrade} defaultPadding={0.25} defaultWidth={6} reducedWidth={6} />

  <!-- Overlay -->
  <span
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 rounded-lg bg-gray-200 dark:bg-gray-700 mix-blend-multiply opacity-0 transition-opacity duration-150 group-hover:opacity-100"
  ></span>
</button>

<!-- Dropdown Menu -->
{#if isLoggedIn && isAtCoderVerified !== false}
  <Dropdown
    triggeredBy={`#update-grade-dropdown-trigger-${componentId}`}
    simple
    class="h-48 w-25 z-50 border border-gray-200 dark:border-gray-100 overflow-y-auto"
  >
    {#each nonPendingGrades as grade (grade)}
      <DropdownItem onclick={() => handleClick(grade)} class="rounded-md">
        <div
          class="flex items-center justify-between w-full text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <span>{getTaskGradeLabel(grade)}</span>
          {#if votedGrade === grade}
            <Check class="w-4 h-4 text-primary-600 dark:text-gray-300" strokeWidth={3} />
          {/if}
        </div>
      </DropdownItem>
    {/each}
    <DropdownDivider />
    <DropdownItem href={resolve('/votes/[slug]', { slug: taskResult.task_id })} class="rounded-md"
      >詳細</DropdownItem
    >
  </Dropdown>
{:else if isLoggedIn}
  <!-- Logged in but not AtCoder-verified: prompt user to complete verification -->
  <Dropdown
    triggeredBy={`#update-grade-dropdown-trigger-${componentId}`}
    simple
    class="w-40 z-50 border border-gray-200 dark:border-gray-100"
  >
    <DropdownItem
      href={editProfileHref}
      class="rounded-md text-sm text-yellow-700 dark:text-yellow-300"
    >
      AtCoder認証が必要です
    </DropdownItem>
  </Dropdown>
{:else}
  <Dropdown
    triggeredBy={`#update-grade-dropdown-trigger-${componentId}`}
    simple
    class="w-32 z-50 border border-gray-200 dark:border-gray-100"
  >
    <DropdownItem href={SIGNUP_PAGE} class="rounded-md">アカウント作成</DropdownItem>
    <DropdownDivider />
    <DropdownItem href={LOGIN_PAGE} class="rounded-md">ログイン</DropdownItem>
  </Dropdown>
{/if}

{#if showForm && selectedVoteGrade}
  {@render voteGradeForm(taskResult, selectedVoteGrade)}
{/if}

{#snippet voteGradeForm(selectedTaskResult: TaskResult, voteGrade: TaskGrade)}
  <form
    bind:this={formElement}
    method="POST"
    action="?/voteAbsoluteGrade"
    style="display:none;"
    use:enhance={handleSubmit()}
  >
    <!-- Task id -->
    <InputFieldWrapper
      inputFieldType="hidden"
      inputFieldName="taskId"
      inputValue={selectedTaskResult.task_id}
    />

    <!-- Submission status -->
    <InputFieldWrapper inputFieldType="hidden" inputFieldName="grade" inputValue={voteGrade} />

    <button type="submit">Submit</button>
  </form>
{/snippet}
