<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    options: Option[];
    selected: string[];
    onchange: (selected: string[]) => void;
    minSelect?: number;
  }

  let { options, selected, onchange, minSelect = 2 }: Props = $props();

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];

    // 下限制約: minSelect 未満にはさせない
    if (next.length < minSelect) return;

    onchange(next);
  }
</script>

<div class="flex flex-wrap gap-2">
  {#each options as opt}
    <button
      type="button"
      onclick={() => toggle(opt.value)}
      class="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
      class:bg-blue-600={selected.includes(opt.value)}
      class:text-white={selected.includes(opt.value)}
      class:border-blue-600={selected.includes(opt.value)}
      class:bg-white={!selected.includes(opt.value)}
      class:dark:bg-gray-700={!selected.includes(opt.value)}
      class:text-gray-700={!selected.includes(opt.value)}
      class:dark:text-gray-300={!selected.includes(opt.value)}
      class:border-gray-300={!selected.includes(opt.value)}
      class:dark:border-gray-600={!selected.includes(opt.value)}
    >
      {opt.label}
    </button>
  {/each}
</div>
