import DefaultTheme from 'vitepress/theme'
import AcademyHome from './components/AcademyHome.vue'
import AcademyIcon from './components/AcademyIcon.vue'
import GuideMeta from './components/GuideMeta.vue'
import ImageGallery from './components/ImageGallery.vue'
import '@fontsource/cinzel/latin-600.css'
import '@fontsource/source-sans-3/latin-400.css'
import '@fontsource/source-sans-3/latin-600.css'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('AcademyHome', AcademyHome)
    app.component('AcademyIcon', AcademyIcon)
    app.component('GuideMeta', GuideMeta)
    app.component('ImageGallery', ImageGallery)
  }
}
