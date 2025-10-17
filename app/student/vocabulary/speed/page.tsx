import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SpeedQuiz from '@/components/student/vocabulary/SpeedQuiz'

export default async function SpeedQuizPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/student/login')
  }

  return <SpeedQuiz user={user} />
}
