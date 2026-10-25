<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import GuideMeta from './components/GuideMeta.vue'
import PetValues from './components/PetValues.vue'
import PublishedGuides from './components/PublishedGuides.vue'
const { page, frontmatter, theme } = useData()
</script>
<template><DefaultTheme.Layout><template #layout-top><div v-if="theme.redesignPreview" class="redesign-preview-notice">Lokale Redaktionsvorschau · Entwürfe sind noch nicht veröffentlicht</div></template><template #doc-before><template v-if="frontmatter.layout !== 'page'"><a class="guide-breadcrumb" href="/guides/">← Alle Guides</a><GuideMeta /></template></template><template #doc-after><PetValues v-if="frontmatter.gameData === 'pets' && frontmatter.status === 'published'" /><PublishedGuides v-if="page.relativePath.startsWith('guides/')&&page.relativePath!=='guides/index.md'" related /></template></DefaultTheme.Layout></template>
