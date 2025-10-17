'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Users, ClipboardList, TrendingUp, Activity, Award } from 'lucide-react'

interface DashboardMetrics {
  overview: {
    totalStudents: number
    totalTextbooks: number
    totalAssignments: number
    totalVocabulary: number
    activeTodayCount: number
    completionRate: number
  }
  recentActivity: Array<{
    id: number
    studentName: string
    activityType: string
    pointsEarned: number
    createdAt: string
  }>
  topStudents: Array<{
    id: number
    name: string
    level: number
    totalPoints: number
    currentStreak: number
  }>
  assignmentStats: {
    assigned: number
    inProgress: number
    completed: number
  }
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/dashboard/metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 관리자 대시보드</h1>
        <p className="text-gray-600">학습 현황과 통계를 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="text-blue-600" size={32} />}
          title="전체 학생"
          value={metrics?.overview.totalStudents || 0}
          subtitle={`오늘 ${metrics?.overview.activeTodayCount || 0}명 활동`}
          color="blue"
        />
        <StatCard
          icon={<BookOpen className="text-purple-600" size={32} />}
          title="교재"
          value={metrics?.overview.totalTextbooks || 0}
          subtitle={`${metrics?.overview.totalVocabulary || 0}개 단어`}
          color="purple"
        />
        <StatCard
          icon={<ClipboardList className="text-green-600" size={32} />}
          title="과제"
          value={metrics?.overview.totalAssignments || 0}
          subtitle={`완료율 ${metrics?.overview.completionRate || 0}%`}
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="text-orange-600" size={32} />}
          title="완료율"
          value={`${metrics?.overview.completionRate || 0}%`}
          subtitle="평균 과제 달성률"
          color="orange"
        />
      </div>

      {/* 과제 현황 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Activity className="mr-2" size={24} />
          과제 현황
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600">
              {metrics?.assignmentStats.assigned || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">할당됨</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">
              {metrics?.assignmentStats.inProgress || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">진행 중</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">
              {metrics?.assignmentStats.completed || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">완료</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 상위 학생 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Award className="mr-2 text-yellow-500" size={24} />
            상위 학생
          </h2>
          {metrics?.topStudents && metrics.topStudents.length > 0 ? (
            <div className="space-y-3">
              {metrics.topStudents.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0
                          ? 'bg-yellow-400 text-white'
                          : index === 1
                          ? 'bg-gray-300 text-white'
                          : index === 2
                          ? 'bg-orange-400 text-white'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{student.name}</div>
                      <div className="text-sm text-gray-500">
                        Lv.{student.level} • 🔥 {student.currentStreak}일 연속
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{student.totalPoints}pt</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">학생 데이터가 없습니다</p>
          )}
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Activity className="mr-2 text-green-500" size={24} />
            최근 활동
          </h2>
          {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {metrics.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                >
                  <div>
                    <span className="font-semibold text-gray-800">{activity.studentName}</span>
                    <span className="text-gray-600"> • {activity.activityType}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-blue-600">+{activity.pointsEarned}pt</span>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">최근 활동이 없습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle: string
  color: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
  }

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} border rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        {icon}
        <div className="text-3xl font-bold text-gray-800">{value}</div>
      </div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  )
}
