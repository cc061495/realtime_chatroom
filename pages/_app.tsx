import { appWithTranslation } from 'next-i18next'
import { ThemeProvider } from 'next-themes'
import type { AppProps } from 'next/app'
import '../styles/globals.css'

function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class">
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default appWithTranslation(App) 