import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext(null)

export const LanguageProvider = ({ children }) => {
  // Default to English as per design rules, but user can toggle to Hindi
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('dastak_customer_lang') || 'en'
  })

  useEffect(() => {
    localStorage.setItem('dastak_customer_lang', lang)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
      if (lang === 'hi') {
        document.documentElement.classList.add('lang-hi')
      } else {
        document.documentElement.classList.remove('lang-hi')
      }
    }
  }, [lang])

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'))
  }

  const t = translations[lang] || translations.en

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export default LanguageContext
