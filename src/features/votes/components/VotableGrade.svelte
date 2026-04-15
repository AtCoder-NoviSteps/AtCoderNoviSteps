<script lang="ts">
  import { tick } from 'svelte';
  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';

  import { Dropdown, DropdownItem, DropdownDivider, Tooltip } from 'flowbite-svelte';
  import Check from '@lucide/svelte/icons/check';
  import FlaskConical from '@lucide/svelte/icons/flask-conical';

  import { TaskGrade, getTaskGrade, type TaskResult } from '$lib/types/task';
  import { errorMessageStore } from '$lib/stores/error_message';
  import {
    fetchMyVote,
    submitVote,
    fetchMedianVote,
  } from '$features/votes/internal_clients/vote_grade';

  import { getTaskGradeLabel } from '$lib/utils/task';
  import { nonPendingGrades, resolveDisplayGrade } from '$features/votes/utils/grade_options';
  import {
    calcGradeDiff,
    getRelativeEvaluationLabel,
  } from '$features/votes/utils/relative_evaluation';
  import { SIGNUP_PAGE, LOGIN_PAGE, EDIT_PROFILE_PAGE } from '$lib/constants/navbar-links';

  import GradeLabel from '$lib/components/GradeLabel.svelte';
  import InputFieldWrapper from '$lib/components/InputFieldWrapper.svelte';

  interface Props {
    taskResult: TaskResult;
    isLoggedIn: boolean;
    // undefined means the prop was not passed — treat as verified to maintain backward compatibility.
    isAtCoderVerified?: boolean;
    estimatedGrade?: TaskGrade | null;
  }

  let { taskResult, isLoggedIn, isAtCoderVerified, estimatedGrade }: Props = $props();

  // 表示用のグレード（投票後に画面リロードなしで差し替えるためのローカル状態）
  // PENDING かつ estimatedGrade（集計済み中央値）があればそれを優先表示。
  // DBグレード付与済みの場合はそちらを優先。
  const initialGrade = resolveDisplayGrade(taskResult.grade, estimatedGrade);
  let displayGrade = $state<TaskGrade | string>(initialGrade);

  // Use task_id as a deterministic component ID to avoid SSR/hydration mismatches.
  const componentId = taskResult.task_id;

  // @ts-expect-error svelte-check TS2554: AppTypes declaration merging causes RouteId to resolve as string, requiring params. Runtime behavior is correct.
  const editProfileHref = `${resolve(EDIT_PROFILE_PAGE)}?tab=atcoder`;

  let selectedVoteGrade = $state<TaskGrade>();
  let showForm = $state(false);
  let formElement = $state<HTMLFormElement | undefined>(undefined);

  const isProvisional = $derived(
    taskResult.grade === TaskGrade.PENDING && displayGrade !== TaskGrade.PENDING,
  );

  // Relative evaluation badge: shown only when grade is confirmed and a median vote exists.
  const relativeEvaluationLabel = $derived.by(() => {
    if (taskResult.grade === TaskGrade.PENDING || !estimatedGrade) {
      return '';
    }
    return getRelativeEvaluationLabel(calcGradeDiff(taskResult.grade, estimatedGrade));
  });

  let isOpening = $state(false);
  let votedGrade = $state<TaskGrade | null>(null);
  let voteAbortController: AbortController | null = null;

  async function onTriggerClick() {
    if (!isLoggedIn || isAtCoderVerified === false || isOpening) {
      return;
    }
    isOpening = true;
    try {
      votedGrade = await fetchMyVote(taskResult.task_id);
    } catch (err) {
      console.error(err);
    } finally {
      isOpening = false;
    }
  }

  async function handleClick(voteGrade: string): Promise<void> {
    // Cancel any in-flight vote request before starting a new one.
    voteAbortController?.abort();
    voteAbortController = new AbortController();
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

      const signal = voteAbortController?.signal;

      submitVote(action, formData, signal)
        .then(async (succeeded) => {
          if (signal?.aborted) {
            return; // Intentional abort — user selected a different grade
          }

          if (!succeeded) {
            throw new Error('vote failed');
          }

          // Reflect the voted grade in local state (to update the checkmark in the dropdown), even though the server response may later indicate a different median grade due to other voters or admin overrides.
          votedGrade = selectedVoteGrade ?? null;

          // Update the displayed grade to the latest median from the server, which may differ from the just-submitted vote due to other voters or admin overrides.
          const taskId = formData.get('taskId') as string;
          const medianGrade = await fetchMedianVote(taskId, signal);

          if (medianGrade !== null && taskResult.grade === TaskGrade.PENDING) {
            displayGrade = medianGrade;
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
<div class="inline-flex items-center gap-1">
  {#if isProvisional}
    <FlaskConical
      id={`provisional-flask-${componentId}`}
      class="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500"
      aria-label="非公式グレード（投票に基づく）"
    />
    <Tooltip triggeredBy={`#provisional-flask-${componentId}`} placement="bottom">
      非公式グレード（投票に基づく）
    </Tooltip>
  {/if}

  <button
    id={`update-grade-dropdown-trigger-${componentId}`}
    class="relative group shrink-0 cursor-pointer"
    type="button"
    tabindex="0"
    onclick={() => onTriggerClick()}
  >
    <span class="sr-only">
      Voted grade: {getTaskGradeLabel(displayGrade)}{relativeEvaluationLabel
        ? `, relative evaluation: ${relativeEvaluationLabel}`
        : ''}{isProvisional ? ', provisional' : ''}
    </span>

    <GradeLabel taskGrade={displayGrade} defaultPadding={0.25} defaultWidth={6} reducedWidth={6} />

    {#if relativeEvaluationLabel}
      {@const isHarder = relativeEvaluationLabel.startsWith('+')}
      <span
        aria-hidden="true"
        class="pointer-events-none absolute -top-2 -right-2 z-10 rounded-full px-1 py-px text-[0.6rem] font-bold leading-none shadow-sm
          {isHarder
          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300'
          : 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300'}"
      >
        {relativeEvaluationLabel}
      </span>
    {/if}

    <!-- Overlay -->
    <span
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 rounded-lg bg-gray-200 dark:bg-gray-700 mix-blend-multiply opacity-0 transition-opacity duration-150 group-hover:opacity-100"
    ></span>
  </button>
</div>

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
    class="w-48 z-50 border border-gray-200 dark:border-gray-100"
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
