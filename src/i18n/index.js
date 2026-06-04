import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import cs from './cs'
import en from './en'
import de from './de'
import sk from './sk'

i18n.use(initReactI18next).init({
  resources: { cs: { translation: cs }, en: { translation: en }, de: { translation: de }, sk: { translation: sk } },
  lng: localStorage.getItem('lang') || 'cs',
  fallbackLng: 'cs',
  interpolation: { escapeValue: false },
})

export default i18n
