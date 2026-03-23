<script lang="ts">
  import { resolve } from '$app/paths';

  interface Props {
    workBookId: number;
    title: string;
  }

  let { workBookId, title }: Props = $props();
</script>

<a
  href={resolve('/workbooks/[slug]', { slug: String(workBookId) })}
  class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
  onclick={(e) => e.stopPropagation()}
  onpointerdown={(e) => e.stopPropagation()}
>
  {title}
</a>
