<script lang="ts">
  import HeadingOne from '$lib/components/HeadingOne.svelte';
  import {
    sectionWithTitle,
    coreFeatures,
    requirements,
    targetUsers,
    usage,
    glossary,
    privacyPolicy,
    developmentMembers,
  } from './SectionSnippets.svelte';
</script>

<div class="container mx-auto w-5/6 lg:w-2/3">
  <HeadingOne title="サービスの説明" />

  {@render sectionWithTitle('特長', coreFeatures)}
  {@render sectionWithTitle('予備知識', requirements)}
  {@render sectionWithTitle('対象ユーザ', targetUsers)}
  {@render sectionWithTitle('使い方', usage)}
  {@render sectionWithTitle('用語集', glossary)}
  {@render sectionWithTitle('プライバシーポリシー', privacyPolicy)}
  <!-- TODO: Add contact section. -->
  {@render sectionWithTitle('開発・運営メンバー', developmentMembers)}
</div>
