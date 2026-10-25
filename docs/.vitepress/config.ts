import { defineConfig } from 'vitepress'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import site from '../../data/site.json'

const docsRoot = fileURLToPath(new URL('../', import.meta.url))
const redesignPreview = process.env.ACADEMY_REDESIGN_PREVIEW === '1'
function findDrafts(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.')) return []
    const path = join(folder,entry.name)
    if (entry.isDirectory()) return findDrafts(path)
    if (!entry.name.endsWith('.md')) return []
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(path,'utf8'))?.[1] || ''
    const relative = path.slice(docsRoot.length).replaceAll('\\','/')
    return /^status:\s*['"]?draft['"]?\s*$/m.test(frontmatter) && !(redesignPreview && relative === 'redaktion/ausruestung.md') ? [relative] : []
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
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/voidborn-mark.svg' }], ['meta', { name: 'theme-color', content: '#0b0c0e' }]],
  themeConfig: {
    redesignPreview,
    site,
    logo: '/voidborn-mark.svg',
    siteTitle: site.brand,
    nav: site.navigation,
    sidebar: false,
    search: { provider: 'local', options: { locales: { root: { translations: { button: { buttonText: 'Academy durchsuchen', buttonAriaLabel: 'Academy durchsuchen' }, modal: { noResultsText: 'Keine passenden Guides gefunden.', resetButtonTitle: 'Suche zurücksetzen', backButtonTitle: 'Suche schließen', displayDetails: 'Details anzeigen', footer: { selectText: 'öffnen', navigateText: 'navigieren', closeText: 'schließen' } } } } } } },
    outline: { label: 'Auf dieser Seite', level: [2, 3] },
    docFooter: { prev: 'Vorheriger Guide', next: 'Nächster Guide' },
    sidebarMenuLabel: 'Themen öffnen',
    returnToTopLabel: 'Nach oben',
    darkModeSwitchLabel: 'Darstellung',
    lastUpdated: { text: 'Aktualisiert' },
    footer: site.footer
  },
  transformPageData(page) {
    if (page.frontmatter.status === 'draft' && !(redesignPreview && page.relativePath === 'redaktion/ausruestung.md')) throw new Error(`Unveröffentlichter Entwurf im öffentlichen Build: ${page.relativePath}`)
  }
})
