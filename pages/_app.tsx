import { useEffect } from 'react'
import { appWithTranslation } from 'next-i18next'
import type { AppProps } from 'next/app'
import '../styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark'
    
    // Remove both classes first
    document.documentElement.classList.remove('dark', 'light')
    // Add the saved theme class
    document.documentElement.classList.add(savedTheme)
  }, [])

  return <Component {...pageProps} />
}

export default appWithTranslation(MyApp) 