<script lang="ts">
  interface Props {
    value: string;
    textColor: string;
    bgColor: string;
    bgColorOnHover: string;
    labelName: string;
  }

  let { value, textColor, bgColor, bgColorOnHover, labelName }: Props = $props();
</script>

<!-- HACK: カスタマイズしやすいボタンコンポーネントを見つけたら差し替える -->
<!-- WHY: flowbite-svelteでは、同コンポーネントで配色のカスタマイズ・拡張が困難だと思われるため -->
<button
  name="submissionStatus"
  {value}
  class="{textColor} {bgColor} {bgColorOnHover} border border-gray-300 font-medium rounded-lg shadow-lg shadow-gray500/50 text-sm px-5 py-2.5 me-2 mb-2 w-full max-w-md md:max-w-xl m-3"
  type="submit"
>
  {labelName}
</button>
