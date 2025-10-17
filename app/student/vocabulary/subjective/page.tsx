import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SubjectiveTest from '@/components/student/vocabulary/SubjectiveTest'

export default async function SubjectiveTestPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/student/login')
  }

  return <SubjectiveTest user={user} />
}
