import Login from '@/components/Login'
import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import type { GetStaticProps } from 'next'

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  }
}

export default function LoginPage() {
  const router = useRouter()

  return (
    <Login onLogin={(user) => {
      router.push('/') // Redirect to chat after successful login
    }} />
  )
} 