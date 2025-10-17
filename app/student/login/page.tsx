'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StudentLoginPage() {
  const [learningCode, setLearningCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learningCode }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(data.error || '로그인에 실패했습니다.')
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📚 VocabQuest
          </h1>
          <p className="text-gray-600">학습을 시작하려면 학습 코드를 입력하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              학습 코드
            </label>
            <input
              type="text"
              id="code"
              value={learningCode}
              onChange={(e) => setLearningCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-bold transition-all"
              placeholder="0115"
              required
              disabled={loading}
              maxLength={8}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '로그인 중...' : '학습 시작하기'}
          </button>

          <p className="text-sm text-center text-gray-500">
            💡 학습 코드는 선생님께서 알려주셨어요
          </p>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← 메인으로 돌아가기
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 샘플 학습 코드: <code className="bg-gray-100 px-2 py-1 rounded">0115</code> (김철수)
            또는 <code className="bg-gray-100 px-2 py-1 rounded">0218</code> (이영희)
          </p>
        </div>
      </div>
    </div>
  )
}
