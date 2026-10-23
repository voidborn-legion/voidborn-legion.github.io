<script setup lang="ts">
import { useData } from 'vitepress'
const { frontmatter } = useData()
</script>
<template><div class="guide-meta"><span>{{frontmatter.author || 'Voidborn Academy'}}</span><span>{{frontmatter.review === 'orientation' ? 'Orientierung · Guide folgt' : 'Technische Vorschau'}}</span><span v-if="frontmatter.updated">Stand: {{frontmatter.updated}}</span></div></template>
