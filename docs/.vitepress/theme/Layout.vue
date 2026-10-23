<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import GuideMeta from './components/GuideMeta.vue'
import PetValues from './components/PetValues.vue'
const { page, frontmatter } = useData()
</script>
<template><DefaultTheme.Layout><template #doc-before><template v-if="frontmatter.layout !== 'page'"><a v-if="page.relativePath.startsWith('guides/')" class="guide-breadcrumb" href="/guides/">Alle Guides</a><GuideMeta /></template></template><template #doc-after><PetValues v-if="frontmatter.gameData === 'pets' && frontmatter.status === 'published'" /></template></DefaultTheme.Layout></template>
