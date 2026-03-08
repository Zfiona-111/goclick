import en from './i18n/en.json'
import zh from './i18n/zh.json'

type Lang = 'EN' | 'ZH'
type Translations = typeof en

export function t(lang: Lang, key: keyof Translations): string {
  const dict = lang === 'ZH' ? zh : en
  return (dict as Record<string, string>)[key] ?? key
}

export function getDict(lang: Lang): Translations {
  return (lang === 'ZH' ? zh : en) as Translations
}
