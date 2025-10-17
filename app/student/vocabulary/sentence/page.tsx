import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SentencePractice from '@/components/student/vocabulary/SentencePractice'

export default async function SentencePracticePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/student/login')
  }

  return <SentencePractice user={user} />
}
