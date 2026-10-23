<script setup lang="ts">
import { computed, ref } from 'vue'
import categories from '../../../../data/categories.json'
import AcademyIcon from './AcademyIcon.vue'
const active = ref('all')
const filters = [{id:'all',label:'Alle Themen'},{id:'start',label:'Loslegen'},{id:'growth',label:'Charakter entwickeln'},{id:'combat',label:'Kampf & Klassen'},{id:'routine',label:'Dein Alltag'}]
const filtered = computed(() => categories.filter(c => active.value === 'all' || c.group === active.value))
</script>

<template>
  <div class="academy-home">
    <section class="academy-hero" aria-labelledby="hero-title">
      <div class="hero-art" role="presentation"></div>
      <div class="hero-content">
        <h1 id="hero-title">Dein Wissen.<br>Dein Fortschritt.<br><span>Deine Legion.</span></h1>
        <p>Die AION 2 Academy von Voidborn. Finde deinen nächsten Schritt – vom ersten Abenteuer bis zum nächsten großen Upgrade.</p>
        <div class="hero-actions"><a class="button-primary" href="/guides/einstieg.html">Dein Einstieg in AION 2 <AcademyIcon name="arrow" /></a><a class="button-text" href="#themen">Guides entdecken <span aria-hidden="true">↓</span></a></div>
        <div class="hero-footnote"><span class="small-crest" aria-hidden="true">V</span><span>Von der Legion. Für deinen nächsten Run.</span></div>
      </div>
      <div class="hero-caption">VOIDBORN <span>·</span> AION 2 ACADEMY</div>
    </section>

    <div class="home-content">
      <div class="preview-note"><span class="note-symbol" aria-hidden="true">i</span><p><strong>Die Academy entsteht.</strong> Du siehst die erste Website-Version. Unsere Discord-Guides werden später mit Quellen, Screenshots und Prüfstatus übernommen.</p><a href="/ueber.html">Über das Projekt <span aria-hidden="true">↗</span></a></div>

      <section class="featured-paths" aria-labelledby="paths-title">
        <div class="section-intro"><h2 id="paths-title">Wo stehst du gerade?</h2><p>Wähle den Weg, der zu deinem Charakter passt.</p></div>
        <div class="path-grid">
          <a class="path path-start" href="/guides/leveling.html"><AcademyIcon name="compass" /><div><h3>Dein Abenteuer beginnt</h3><p>Story, Grundlagen & erste Schritte</p></div><AcademyIcon class="path-arrow" name="arrow" /></a>
          <a class="path path-progress" href="/guides/progression.html"><AcademyIcon name="stairs" /><div><h3>Bereit für den nächsten Schritt</h3><p>Gearscore, Ausrüstung & Prioritäten</p></div><AcademyIcon class="path-arrow" name="arrow" /></a>
        </div>
      </section>

      <section id="themen" class="topic-section" aria-labelledby="topics-title">
        <div class="section-intro topics-intro"><div><h2 id="topics-title">Die Academy entdecken</h2><p>Das Wissen für deinen Weg durch AION 2.</p></div><a class="text-link" href="/guides/">Zur Guide-Übersicht <span aria-hidden="true">↗</span></a></div>
        <div class="topic-filters" role="group" aria-label="Themen filtern"><button v-for="filter in filters" :key="filter.id" :aria-pressed="active === filter.id" @click="active = filter.id">{{filter.label}}</button></div>
        <p class="sr-only" aria-live="polite">{{filtered.length}} Themen</p>
        <div class="topic-grid">
          <a v-for="category in filtered" :key="category.slug" class="topic-card" :href="`/guides/${category.slug}.html`"><AcademyIcon :name="category.icon" /><h3>{{category.title}}</h3><p>{{category.description}}</p><span class="card-link">Thema öffnen <AcademyIcon name="arrow" /></span></a>
        </div>
      </section>

      <section class="routine-section" aria-labelledby="routine-title"><div><h2 id="routine-title">Weniger suchen.<br>Mehr gemeinsam erreichen.</h2><p>Daily- und Weekly-Aufgaben, Ressourcen und wiederkehrende Aktivitäten: Ein klarer Plan schafft Platz für den nächsten gemeinsamen Run.</p><a class="button-primary" href="/guides/checklisten.html">Zu den Checklisten <AcademyIcon name="arrow" /></a></div><div class="routine-index"><a href="/guides/checklisten.html"><span>Tägliche Routine</span><span>Daily-Aufgaben <span aria-hidden="true">↗</span></span></a><a href="/guides/checklisten.html#wochentliche-routine"><span>Die Woche planen</span><span>Weekly-Aufgaben <span aria-hidden="true">↗</span></span></a><a href="/guides/tipps.html"><span>Wenn du feststeckst</span><span>Engpässe verstehen <span aria-hidden="true">↗</span></span></a></div></section>
    </div>
  </div>
</template>
