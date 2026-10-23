<script setup lang="ts">
defineProps<{ images: {src:string; alt:string; width:number; height:number; caption?:string}[] }>()
</script>
<template><div v-if="images.length" class="image-gallery"><figure v-for="image in images" :key="image.src"><a :href="image.src" target="_blank" rel="noopener" :aria-label="`${image.alt} – in voller Größe öffnen`"><img :src="image.src" :alt="image.alt" :width="image.width" :height="image.height" loading="lazy"></a><figcaption v-if="image.caption">{{image.caption}}</figcaption></figure></div><p v-else>Für diesen Abschnitt fehlt noch ein Screenshot.</p></template>
