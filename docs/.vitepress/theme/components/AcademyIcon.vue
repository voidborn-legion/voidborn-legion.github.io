<script setup lang="ts">
defineProps<{ name: string }>()
const paths: Record<string,string> = {
 search: 'M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm5.3 12.8L22 22',
 compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM16 8l-2.5 5.5L8 16l2.5-5.5L16 8Z',
 route: 'M5 5h9a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h10M5 2v6m11 10 3 3-3 3',
 stairs: 'M3 20h6v-6h6V8h6M3 9l6-6m-6 0h6v6',
 gate: 'M4 21V8l8-5 8 5v13M9 21V11h6v10M2 21h20M7 5V2m10 3V2',
 shield: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm0 4v10M8 12h8',
 spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z',
 swords: 'm4 3 13 13m0-13L4 16M3 3l1 6 5-5-6-1Zm18 0-1 6-5-5 6-1ZM2 15l7 7m6-7 7 7M5 18l-3 3m16-3 3 3',
 flag: 'M5 22V3m0 1c5-4 9 4 15 0v10c-6 4-10-4-15 0',
 check: 'M8 5H4v16h16V5h-4M8 3h8v4H8V3Zm0 11 3 3 5-6',
 tool: 'M14 4a6 6 0 0 0-7 7L2 16a3 3 0 0 0 4 4l5-5a6 6 0 0 0 7-7l-4 4-3-3 3-5Z',
 light: 'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9l-1-2Z',
 arrow: 'M4 12h16m-6-6 6 6-6 6'
}
</script>
<template><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.compass" /></svg></template>
