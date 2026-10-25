<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import categories from '../../../../data/categories.json'
import AcademyIcon from './AcademyIcon.vue'
const {theme}=useData()
const home=computed(()=>theme.value.site.home)
const active=ref('all'),query=ref(''),ready=ref(false)
const filters=[{id:'all',label:'Alle Themen'},{id:'start',label:'Ich levele noch'},{id:'growth',label:'Ausrüstung & Fortschritt'},{id:'combat',label:'Klassen & Dungeons'},{id:'routine',label:'Daily & Weekly'}]
const normalize=(value:string)=>value.toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
const filtered=computed(()=>categories.filter(c=>(active.value==='all'||c.group===active.value)&&normalize(query.value.trim()).split(/\s+/).filter(Boolean).every(word=>normalize(`${c.title} ${c.description} ${c.keywords}`).includes(word))))
const equipmentLink=computed(()=>theme.value.redesignPreview?'/redaktion/ausruestung.html':home.value.featureLink)
function readLocation(){const p=new URLSearchParams(location.search);const group=p.get('thema')||'all';active.value=filters.some(f=>f.id===group)?group:'all';query.value=p.get('suche')||''}
onMounted(()=>{readLocation();ready.value=true;window.addEventListener('popstate',readLocation)})
onUnmounted(()=>{if(typeof window!=='undefined')window.removeEventListener('popstate',readLocation)})
watch([active,query],()=>{if(!ready.value)return;const url=new URL(location.href);active.value==='all'?url.searchParams.delete('thema'):url.searchParams.set('thema',active.value);query.value.trim()?url.searchParams.set('suche',query.value.trim()):url.searchParams.delete('suche');history.replaceState(history.state,'',url)})
function reset(){query.value='';active.value='all'}
</script>
<template>
<div class="vbh">
 <section class="vbh-hero"><img :src="home.image" class="vbh-art" :alt="home.imageAlt" width="1672" height="941" fetchpriority="high"><div class="vbh-hero-copy"><h1>{{home.title}}<br><em>{{home.emphasis}}</em></h1><p>{{home.intro}}</p><a href="#themen" class="vbh-hero-link">{{home.actionText}} <AcademyIcon name="arrow"/></a></div><p class="vbh-caption">{{theme.site.brand}} · AION 2 ACADEMY</p></section>
 <section id="themen" class="vbh-discovery"><div class="vbh-section-heading"><h2>{{home.topicsTitle}}</h2><a href="/guides/">Zur Themenübersicht <AcademyIcon name="arrow"/></a></div><form role="search" @submit.prevent><label class="vbh-search" for="topic-query"><AcademyIcon name="search"/><input id="topic-query" v-model="query" type="search" autocomplete="off" :placeholder="home.searchPlaceholder" aria-controls="topic-results"><span class="sr-only">Themen durchsuchen</span></label></form><div class="vbh-filters" role="group" aria-label="Bereich auswählen"><button v-for="f in filters" :key="f.id" :aria-pressed="active===f.id" @click="active=f.id">{{f.label}}</button></div>
 <p class="vbh-work-note">{{home.workNote}}</p><p class="vbh-count" role="status">{{filtered.length}} {{filtered.length===1?'Thema':'Themen'}}</p>
 <div class="vbh-collection"><div id="topic-results" class="vbh-list"><a v-for="c in filtered" :key="c.slug" :href="`/guides/${c.slug}.html`" class="vbh-row"><span><h3>{{c.title}}</h3><p>{{c.description}}</p></span><AcademyIcon name="arrow"/></a><div v-if="!filtered.length" class="vbh-empty"><p>Kein Thema gefunden. Versuch einen anderen Begriff oder entferne den Filter.</p><button @click="reset">Alle Themen anzeigen <AcademyIcon name="arrow"/></button></div></div><aside class="vbh-feature"><span aria-hidden="true" class="vbh-v">V</span><h2>{{home.featureTitle}}</h2><p>{{home.featureText}}</p><a :href="equipmentLink">{{home.featureLabel}} <AcademyIcon name="arrow"/></a><small v-if="theme.redesignPreview">Redaktionsvorschau · noch ungeprüft</small><small v-else>{{home.featureNote}}</small></aside></div>
 </section><section class="vbh-bottom"><div><h2>{{home.bottomTitle}}</h2><p>{{home.bottomText}}</p></div><a v-for="link in home.bottomLinks" :key="link.link" :href="link.link">{{link.text}} <AcademyIcon name="arrow"/></a></section>
</div>
</template>
