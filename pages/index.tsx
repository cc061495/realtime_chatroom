import Chatroom from '@/components/Chatroom'
import LoadingScreen from '@/components/chat/LoadingScreen'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import type { GetStaticProps } from 'next'

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  }
}

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (loading) return <LoadingScreen />
  return <Chatroom />
}