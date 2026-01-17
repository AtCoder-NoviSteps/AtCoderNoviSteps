<script lang="ts">
  import { Li, List } from 'flowbite-svelte';
</script>

<p class="font-medium">以下の内容が削除されます (データの復元は困難です)</p>

<!-- FIXME: レスポンシブデザインになるように修正 -->
<List class="mt-1.5 ms-4 list-disc list-inside">
  <Li>アカウント</Li>
  <Li>登録した回答状況</Li>
  <!-- TODO: AtCoderアカウントと連携できるようになったら表示する -->
  <!-- <Li>AtCoder IDとの連携</Li> -->
</List>
