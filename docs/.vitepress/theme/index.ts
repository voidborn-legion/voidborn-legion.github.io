import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import AcademyHome from './components/VoidbornHome.vue'
import AcademyIcon from './components/AcademyIcon.vue'
import GuideMeta from './components/GuideMeta.vue'
import ImageGallery from './components/ImageGallery.vue'
import PublishedGuides from './components/PublishedGuides.vue'
import '@fontsource/cinzel/latin-600.css'
import '@fontsource/source-sans-3/latin-400.css'
import '@fontsource/source-sans-3/latin-600.css'
import './style.css'
import './voidborn.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('AcademyHome', AcademyHome)
    app.component('AcademyIcon', AcademyIcon)
    app.component('GuideMeta', GuideMeta)
    app.component('ImageGallery', ImageGallery)
    app.component('PublishedGuides', PublishedGuides)
  }
}
