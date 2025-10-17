import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import VocabularyReview from '@/components/student/vocabulary/VocabularyReview'

export default async function VocabularyReviewPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/student/login')
  }

  return <VocabularyReview user={user} />
}
