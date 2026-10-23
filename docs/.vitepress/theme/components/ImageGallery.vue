<script setup lang="ts">
defineProps<{ images: {src:string; alt:string; caption?:string}[] }>()
</script>
<template><div class="image-gallery"><figure v-for="image in images" :key="image.src"><a :href="image.src" target="_blank" rel="noopener" :aria-label="`${image.alt} – in voller Größe öffnen`"><img :src="image.src" :alt="image.alt" loading="lazy"></a><figcaption v-if="image.caption">{{image.caption}}</figcaption></figure></div></template>
