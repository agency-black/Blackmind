import { createI18n } from 'vue-i18n';
import enUS from '../locales/en/index.json'
import zhCN from '../locales/zh/index.json'
import esES from '../locales/es/index.json'

type AvailableLanguages = 'en-US' | 'zh-CN' | 'es-ES'

// Default to Spanish for this deployment
const getBrowserLanguage = (): AvailableLanguages => {
  return 'es-ES'
}

const getSavedLanguage = (): AvailableLanguages => {
  return (
    (localStorage.getItem('language') as AvailableLanguages) ||
    getBrowserLanguage()
  )
}

const i18n = createI18n({
  legacy: false, // usar Composition API mode
  locale: getSavedLanguage(),
  fallbackLocale: 'es-ES',
  messages: {
    'en-US': enUS,
    'zh-CN': zhCN,
    'es-ES': esES,
  },
})

export const setLanguage = (lang: AvailableLanguages) => {
  i18n.global.locale.value = lang;
  localStorage.setItem('language', lang);
  document.querySelector('html')?.setAttribute('lang', lang);
};

export default i18n;