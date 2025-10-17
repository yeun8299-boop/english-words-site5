import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import StudentDashboard from '@/components/student/StudentDashboard'

export default async function StudentDashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/student/login')
  }

  return <StudentDashboard user={user} />
}
