<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import categories from '../../../../data/categories.json'
import AcademyIcon from './AcademyIcon.vue'
const active = ref('all')
const query = ref('')
const ready = ref(false)
const filters = [{id:'all',label:'Alle Themen'},{id:'start',label:'Einstieg'},{id:'growth',label:'Charakter'},{id:'combat',label:'Kampf & Klassen'},{id:'routine',label:'Alltag'}]
const normalize = (value:string) => value.toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
const filtered = computed(() => categories.filter(c => (active.value === 'all' || c.group === active.value) && normalize(query.value.trim()).split(/\s+/).filter(Boolean).every(word => normalize(`${c.title} ${c.description} ${c.keywords}`).includes(word))))
function readLocation() {
  const params = new URLSearchParams(window.location.search)
  const group = params.get('thema') || 'all'
  active.value = filters.some(f => f.id === group) ? group : 'all'
  query.value = params.get('suche') || ''
}
onMounted(() => { readLocation(); ready.value = true; window.addEventListener('popstate',readLocation) })
onUnmounted(() => { if (typeof window !== 'undefined') window.removeEventListener('popstate',readLocation) })
watch([active,query], () => {
  if (!ready.value) return
  const url = new URL(window.location.href)
  active.value === 'all' ? url.searchParams.delete('thema') : url.searchParams.set('thema',active.value)
  query.value.trim() ? url.searchParams.set('suche',query.value.trim()) : url.searchParams.delete('suche')
  window.history.replaceState(window.history.state,'',url)
})
function reset() { query.value = ''; active.value = 'all' }
</script>

<template>
  <div class="academy-home">
    <section class="academy-hero" aria-labelledby="hero-title">
      <img class="hero-art" src="/images/voidborn-citadel.webp" alt="" width="1672" height="941" fetchpriority="high">
      <div class="hero-scrim" aria-hidden="true"></div>
      <div class="hero-content"><h1 id="hero-title">AION 2<br>Academy</h1><p>Hier sammeln wir unsere Guides zu Leveling, Ausrüstung, Dungeons und Pets.</p><a class="button-primary" href="#themen">Guides ansehen <AcademyIcon name="arrow" /></a></div>
    </section>
    <div class="home-content">
      <aside class="preview-note" aria-label="Stand der Website"><p><strong>Die Website ist noch im Aufbau.</strong> Unsere Guides liegen bisher im Discord. Hier kannst du dir schon die neue Struktur ansehen.</p><a href="/ueber.html">Mehr zur Academy</a></aside>
      <section class="entry-section" aria-labelledby="entry-title">
        <div class="section-intro"><h2 id="entry-title">Womit geht’s weiter?</h2><p>Für den Anfang oder wenn dein Charakter gerade feststeckt.</p></div>
        <div class="entry-grid"><a class="entry-link" href="/guides/leveling.html"><AcademyIcon name="compass" /><div><h3>Neu in AION 2</h3><p>Hauptquests, Freischaltungen und Ausrüstung beim Leveln.</p></div><AcademyIcon name="arrow" /></a><a class="entry-link" href="/guides/progression.html"><AcademyIcon name="stairs" /><div><h3>Mehr Gearscore</h3><p>Die nächste GS-Stufe und welche Verbesserungen dafür anstehen.</p></div><AcademyIcon name="arrow" /></a></div>
      </section>
      <section id="themen" class="topic-section" aria-labelledby="topics-title">
        <div class="topic-heading"><h2 id="topics-title">Die Guides</h2><a href="/guides/">Zur Übersicht</a></div>
        <div class="topic-browser"><div class="topic-controls">
          <form class="topic-search" role="search" @submit.prevent><label for="topic-query">Welches Thema suchst du?</label><div class="search-input"><AcademyIcon name="search" /><input id="topic-query" v-model="query" type="search" name="thema-suchen" autocomplete="off" placeholder="Zum Beispiel Arkana oder Pets …" aria-controls="topic-results"></div><p>Du suchst eine Textstelle? Die Lupe oben durchsucht alle Seiten.</p></form>
          <div class="topic-filters" role="group" aria-label="Bereich auswählen"><button v-for="filter in filters" :key="filter.id" :aria-pressed="active === filter.id" @click="active = filter.id">{{filter.label}}</button></div>
          <p class="result-count" role="status">{{filtered.length === 1 ? '1 Thema' : `${filtered.length} Themen`}}</p>
        </div><div id="topic-results" class="topic-list"><a v-for="category in filtered" :key="category.slug" class="topic-row" :href="`/guides/${category.slug}.html`"><div><h3>{{category.title}}</h3><p>{{category.description}}</p></div><AcademyIcon name="arrow" /></a><div v-if="!filtered.length" class="no-results"><h3>Kein passendes Thema gefunden</h3><p>Versuch einen anderen Begriff oder zeig wieder alle Themen an.</p><button class="button-primary" @click="reset">Alle Themen anzeigen</button></div></div></div>
      </section>
      <section class="reading-section" aria-labelledby="reading-title"><div><h2 id="reading-title">So liest sich die Academy</h2><p>Unsere Guides bekommen kurze Abschnitte, Querverweise und Quellen direkt bei den Angaben.</p><a href="/guides/academy-nutzen.html">Beispielseite lesen</a></div><a class="reading-preview" href="/guides/academy-nutzen.html"><h3>Den passenden Guide finden</h3><p>Leveling, Gearscore oder einzelne Spielsysteme: So sind die Themen aufgeteilt.</p><span>Zur Beispielseite <AcademyIcon name="arrow" /></span></a></section>
      <section class="routine-section" aria-labelledby="routine-title"><h2 id="routine-title">Vor dem nächsten Run</h2><div class="routine-index"><a href="/guides/checklisten.html"><h3>Daily & Weekly</h3><p>Aufladungen, Wochenlimits und Reset-Zeiten nachschlagen.</p></a><a href="/guides/tipps.html"><h3>Ressourcen fehlen?</h3><p>Bei Kinah, Steinen oder anderen Engpässen weiterschauen.</p></a><a href="/guides/tools.html"><h3>Karten & Overlays</h3><p>Externe Tools und Hinweise zur Einrichtung.</p></a></div></section>
    </div>
  </div>
</template>
