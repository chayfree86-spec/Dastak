import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dastak_customer_theme') || 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    const isDarkMode = theme === 'dark'
    const themeColor = isDarkMode ? '#0f172a' : '#ffffff'

    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Dynamic Mobile Notification / Status Bar theme-color
    let metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.name = 'theme-color'
      document.head.appendChild(metaThemeColor)
    }
    metaThemeColor.setAttribute('content', themeColor)

    // iOS Status Bar Style
    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (appleStatusBar) {
      appleStatusBar.setAttribute('content', isDarkMode ? 'black-translucent' : 'default')
    }

    localStorage.setItem('dastak_customer_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export default ThemeContext
