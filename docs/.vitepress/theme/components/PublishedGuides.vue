<script setup lang="ts">
import {computed} from 'vue'
import {useData} from 'vitepress'
import {data as guides} from '../guides.data'
import categories from '../../../../data/categories.json'
import catalog from '../../../../.academy/studio/catalog.json'
const props=defineProps<{related?:boolean}>(),{page,frontmatter}=useData()
const category=computed(()=>frontmatter.value.category||catalog.categories.find(c=>c.id===catalog.guides.find(g=>g.path==='docs/'+page.value.relativePath)?.categoryId)?.slug)
const groups=computed(()=>categories.map(c=>({...c,guides:guides.filter(g=>g.category===c.slug&&(!props.related||(c.slug===category.value&&g.url!==('/'+page.value.relativePath.replace(/\.md$/,'.html')))))})).filter(c=>c.guides.length))
</script>
<template><section v-if="groups.length" class="published-guides"><h2 v-if="related">Weitere Beiträge zu diesem Thema</h2><div v-for="group in groups" :key="group.slug"><h2 v-if="!related">{{group.title}}</h2><ul><li v-for="guide in group.guides" :key="guide.url"><a :href="guide.url">{{guide.title}}</a></li></ul></div></section></template>
