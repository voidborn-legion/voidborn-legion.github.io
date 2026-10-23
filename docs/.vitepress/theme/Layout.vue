<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import GuideMeta from './components/GuideMeta.vue'
const { page, frontmatter } = useData()
</script>
<template><DefaultTheme.Layout><template #doc-before><template v-if="frontmatter.layout !== 'page'"><a v-if="page.relativePath.startsWith('guides/')" class="guide-breadcrumb" href="/guides/">Alle Guides</a><GuideMeta /></template></template></DefaultTheme.Layout></template>
