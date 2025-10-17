'use client'

import { useRouter } from 'next/navigation'

interface StudentDashboardProps {
  user: {
    id: number
    name: string
    level: number
    totalPoints: number
    currentStreak: number
    longestStreak: number
  }
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/student/login')
    router.refresh()
  }

  // 레벨에 따른 칭호
  const getLevelTitle = (level: number) => {
    if (level === 1) return 'Beginner'
    if (level === 2) return 'Learner'
    if (level === 3) return 'Scholar'
    if (level === 4) return 'Expert'
    if (level === 5) return 'Master'
    return 'Grand Master'
  }

  // 다음 레벨까지 필요한 XP
  const getNextLevelXP = (level: number) => {
    const thresholds = [0, 100, 300, 600, 1000, 1500]
    return thresholds[level] || 2000
  }

  const nextLevelXP = getNextLevelXP(user.level)
  const progressPercent = (user.totalPoints / nextLevelXP) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-green-600">📚 VocabQuest</h1>
            <p className="text-sm text-gray-600">{user.name}님 환영합니다!</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                👤 {user.name}
              </h2>
              <div className="flex items-center space-x-4">
                <span className="px-4 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                  🏆 Level {user.level}: {getLevelTitle(user.level)}
                </span>
                <span className="text-gray-600">
                  💎 {user.totalPoints} XP
                </span>
              </div>
            </div>
          </div>

          {/* 레벨 진행바 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>다음 레벨까지</span>
              <span>{nextLevelXP - user.totalPoints} XP 남음</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 p-4 rounded-xl">
              <div className="text-3xl mb-1">🔥</div>
              <div className="text-2xl font-bold text-orange-800">
                {user.currentStreak}일
              </div>
              <div className="text-sm text-orange-600">연속 학습</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl">
              <div className="text-3xl mb-1">🏅</div>
              <div className="text-2xl font-bold text-blue-800">
                {user.longestStreak}일
              </div>
              <div className="text-sm text-blue-600">최장 기록</div>
            </div>
          </div>
        </div>

        {/* 학습 모드 선택 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">
            📚 단어 학습 모드
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 단어 복습 */}
            <button
              onClick={() => router.push('/student/vocabulary/review')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-105"
            >
              <div className="text-4xl mb-3">🎧</div>
              <h4 className="text-xl font-bold mb-2">단어 복습</h4>
              <p className="text-blue-100 text-sm">
                TTS 발음과 함께 단어를 복습하세요
              </p>
              <div className="mt-4 text-xs text-blue-200">
                ⌨️ Space: 의미 보기 · ←: 알고 있어요 · →: 학습 중
              </div>
            </button>

            {/* 스피드 퀴즈 */}
            <button
              onClick={() => router.push('/student/vocabulary/speed')}
              className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-6 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-105"
            >
              <div className="text-4xl mb-3">⚡</div>
              <h4 className="text-xl font-bold mb-2">스피드 퀴즈</h4>
              <p className="text-orange-100 text-sm">
                빠르게 4지선다 문제를 풀어보세요
              </p>
              <div className="mt-4 text-xs text-orange-200">
                🏆 콤보 시스템 · ⏱️ 타이머 · 🎯 즉시 피드백
              </div>
            </button>

            {/* 주관식 테스트 */}
            <button
              onClick={() => router.push('/student/vocabulary/subjective')}
              className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-6 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-105"
            >
              <div className="text-4xl mb-3">✍️</div>
              <h4 className="text-xl font-bold mb-2">주관식 테스트</h4>
              <p className="text-purple-100 text-sm">
                단어를 직접 입력하여 실력을 테스트하세요
              </p>
              <div className="mt-4 text-xs text-purple-200">
                📝 빈칸 채우기 · ✅ 자동 채점 · 📋 오답 노트
              </div>
            </button>

            {/* 문장 해석 연습 */}
            <button
              onClick={() => router.push('/student/vocabulary/sentence')}
              className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-6 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-105"
            >
              <div className="text-4xl mb-3">💬</div>
              <h4 className="text-xl font-bold mb-2">문장 해석 연습</h4>
              <p className="text-green-100 text-sm">
                예문을 보고 한글로 해석해보세요
              </p>
              <div className="mt-4 text-xs text-green-200">
                📖 예문 번역 · 💡 모범 답안 비교
              </div>
            </button>
          </div>
        </div>

        {/* 오늘의 목표 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">
            🎯 오늘의 학습 목표
          </h3>

          <div className="space-y-4">
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-purple-800">단어 복습</span>
                <span className="text-purple-600">0/10</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-orange-800">스피드 퀴즈</span>
                <span className="text-orange-600">0/20</span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>

            <div className="text-center text-gray-500 text-sm mt-6">
              💡 매일 학습하면 연속 학습 보너스를 받을 수 있어요!
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
