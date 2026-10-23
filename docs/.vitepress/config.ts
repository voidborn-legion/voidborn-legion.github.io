import { defineConfig } from 'vitepress'
import categories from '../../data/categories.json'

export default defineConfig({
  lang: 'de-DE',
  title: 'Voidborn Academy',
  description: 'Die AION 2 Academy der Voidborn-Legion. Guides, Systeme und Orientierung für deinen nächsten Schritt.',
  base: '/',
  cleanUrls: false,
  appearance: 'force-dark',
  lastUpdated: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/crest.svg' }], ['meta', { name: 'theme-color', content: '#0b1017' }]],
  themeConfig: {
    logo: '/crest.svg',
    siteTitle: 'VOIDBORN',
    nav: [
      { text: 'Academy', link: '/guides/' },
      { text: 'Progression', link: '/guides/progression' },
      { text: 'Pets & Spezies', link: '/guides/pets' },
      { text: 'Checklisten', link: '/guides/checklisten' }
    ],
    sidebar: [{ text: 'Die Academy', items: [{ text: 'Übersicht', link: '/guides/' }, ...categories.map(c => ({ text: c.title, link: `/guides/${c.slug}` }))] }],
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
