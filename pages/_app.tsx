import { appWithTranslation } from 'next-i18next'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import '../styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  // Initialize theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(savedTheme)
  }, [])

  return <Component {...pageProps} />
}

// Wrap with translation HOC
export default appWithTranslation(MyApp) 