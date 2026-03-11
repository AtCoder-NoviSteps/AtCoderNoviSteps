<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    options: Option[];
    selected: string[];
    onchange: (selected: string[]) => void;
    minRequired?: number;
  }

  // DnD requires at least 2 panels as movement destinations; fewer would trap all cards in one column
  let { options, selected, onchange, minRequired = 2 }: Props = $props();

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];

    if (next.length < minRequired) {
      return;
    }

    onchange(next);
  }
</script>

<div class="flex flex-wrap gap-2">
  {#each options as option}
    {@const isSelected = selected.includes(option.value)}

    <button
      type="button"
      onclick={() => toggle(option.value)}
      class="px-3 py-1 rounded-full text-sm font-medium border transition-colors {isSelected
        ? 'bg-primary-600 hover:bg-primary-700 text-white border-primary-600'
        : 'bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}"
    >
      {option.label}
    </button>
  {/each}
</div>
