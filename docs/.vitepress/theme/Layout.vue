<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
const { page, frontmatter } = useData()
</script>
<template><DefaultTheme.Layout><template #doc-before><a v-if="frontmatter.layout !== 'page' && page.relativePath.startsWith('guides/')" class="guide-breadcrumb" href="/guides/">Alle Guides</a></template></DefaultTheme.Layout></template>
