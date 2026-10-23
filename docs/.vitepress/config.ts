import { defineConfig } from 'vitepress'
import categories from '../../data/categories.json'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const docsRoot = fileURLToPath(new URL('../', import.meta.url))
function findDrafts(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.')) return []
    const path = join(folder,entry.name)
    if (entry.isDirectory()) return findDrafts(path)
    if (!entry.name.endsWith('.md')) return []
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(path,'utf8'))?.[1] || ''
    return /^status:\s*['"]?draft['"]?\s*$/m.test(frontmatter) ? [path.slice(docsRoot.length).replaceAll('\\','/')] : []
  })
}

export default defineConfig({
  lang: 'de-DE',
  title: 'Voidborn Academy',
  description: 'AION 2 Guides der Voidborn-Legion zu Leveling, Gearscore, Ausrüstung, Dungeons und Pets.',
  base: '/',
  cleanUrls: false,
  appearance: 'force-dark',
  lastUpdated: true,
  srcExclude: findDrafts(docsRoot),
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/crest.svg' }], ['meta', { name: 'theme-color', content: '#0b1017' }]],
  themeConfig: {
    logo: '/crest.svg',
    siteTitle: 'VOIDBORN',
    nav: [
      { text: 'Academy', link: '/guides/' },
      { text: 'Progression', link: '/guides/progression' },
      { text: 'Pets & Spezies', link: '/guides/pets' },
      { text: 'Checklisten', link: '/guides/checklisten' },
      { text: 'Studio', link: 'https://voidborn-legion.github.io/studio/', target: '_blank', rel: 'noopener' }
    ],
    sidebar: [{ text: 'Guides', items: [{ text: 'Übersicht', link: '/guides/' }, { text: 'So nutzt du die Academy', link: '/guides/academy-nutzen' }, ...categories.map(c => ({ text: c.title, link: `/guides/${c.slug}` }))] }],
    search: { provider: 'local', options: { locales: { root: { translations: { button: { buttonText: 'Academy durchsuchen', buttonAriaLabel: 'Academy durchsuchen' }, modal: { noResultsText: 'Keine passenden Guides gefunden.', resetButtonTitle: 'Suche zurücksetzen', backButtonTitle: 'Suche schließen', displayDetails: 'Details anzeigen', footer: { selectText: 'öffnen', navigateText: 'navigieren', closeText: 'schließen' } } } } } } },
    outline: { label: 'Auf dieser Seite', level: [2, 3] },
    docFooter: { prev: 'Vorheriger Guide', next: 'Nächster Guide' },
    sidebarMenuLabel: 'Themen öffnen',
    returnToTopLabel: 'Nach oben',
    darkModeSwitchLabel: 'Darstellung',
    lastUpdated: { text: 'Aktualisiert' },
    footer: { message: 'Ein unabhängiges Fanprojekt der Voidborn-Legion. Nicht mit NCSOFT verbunden.', copyright: 'AION 2 und zugehörige Marken gehören ihren jeweiligen Rechteinhabern.' }
  },
  transformPageData(page) {
    if (page.frontmatter.status === 'draft') throw new Error(`Unveröffentlichter Entwurf im öffentlichen Build: ${page.relativePath}`)
  }
})
