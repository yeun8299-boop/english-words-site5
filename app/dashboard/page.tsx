import { redirect } from 'next/navigation'
import { getSession, getCurrentUser } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  // 관리자면 관리자 대시보드로, 학생이면 학생 대시보드로 리다이렉트
  if (session.role === 'admin') {
    redirect('/admin/dashboard')
  } else {
    redirect('/student/dashboard')
  }
}
