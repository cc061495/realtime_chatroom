import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Chatroom from '../components/Chatroom'

export default function Home() {
  return <Chatroom />
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}