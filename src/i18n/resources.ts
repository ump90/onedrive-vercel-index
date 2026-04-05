import deCommon from '../../public/locales/de-DE/common.json'
import enCommon from '../../public/locales/en/common.json'
import esCommon from '../../public/locales/es/common.json'
import hiCommon from '../../public/locales/hi/common.json'
import idCommon from '../../public/locales/id/common.json'
import trCommon from '../../public/locales/tr-TR/common.json'
import zhCnCommon from '../../public/locales/zh-CN/common.json'
import zhTwCommon from '../../public/locales/zh-TW/common.json'

export const resources = {
  'de-DE': { common: deCommon },
  en: { common: enCommon },
  es: { common: esCommon },
  hi: { common: hiCommon },
  id: { common: idCommon },
  'tr-TR': { common: trCommon },
  'zh-CN': { common: zhCnCommon },
  'zh-TW': { common: zhTwCommon },
} as const
