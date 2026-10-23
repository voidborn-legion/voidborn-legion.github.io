<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'
const { frontmatter } = useData()
const dateLabel = computed(() => {
  const raw = frontmatter.value.updated
  if (!raw) return ''
  const normalized = /^\d{2}\.\d{2}\.\d{4}$/.test(raw) ? raw.split('.').reverse().join('-') : raw
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('de-DE',{ dateStyle:'medium',timeZone:'UTC' }).format(date)
})
</script>
<template><div class="guide-meta"><span>{{frontmatter.author || 'Voidborn Academy'}}</span><span class="guide-status">{{frontmatter.review === 'orientation' ? 'Guide folgt' : 'Website-Hilfe'}}</span><time v-if="dateLabel" :datetime="String(frontmatter.updated)">{{dateLabel}}</time></div></template>
