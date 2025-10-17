'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  BookmarkPlus,
  AlertCircle,
  Trophy,
  Target,
} from 'lucide-react'

interface Vocabulary {
  id: number
  word: string
  meanings: string[]
  partOfSpeech: string | null
  pronunciation: string | null
  exampleSentence: string | null
  sentenceTranslation: string | null
  problemNumber: number | null
}

interface TestQuestion {
  vocabulary: Vocabulary
  userAnswer: string
  isCorrect: boolean | null
  isBookmarked: boolean
}

interface SubjectiveTestProps {
  user: {
    id: number
    name: string
    level: number
  }
}

export default function SubjectiveTest({ user }: SubjectiveTestProps) {
  const router = useRouter()
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([])
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    totalPoints: 0,
  })
  const [wrongAnswers, setWrongAnswers] = useState<TestQuestion[]>([])

  useEffect(() => {
    fetchVocabulary()
  }, [user.id])

  const fetchVocabulary = async () => {
    try {
      const response = await fetch(`/api/vocabulary?studentId=${user.id}&limit=15`)
      if (response.ok) {
        const data = await response.json()
        const words = data.vocabulary || []
        setVocabulary(words)

        // 문제 초기화
        const initialQuestions: TestQuestion[] = words.map((vocab: Vocabulary) => ({
          vocabulary: vocab,
          userAnswer: '',
          isCorrect: null,
          isBookmarked: false,
        }))
        setQuestions(initialQuestions)
      }
    } catch (error) {
      console.error('Failed to fetch vocabulary:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (index: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[index].userAnswer = value
    setQuestions(newQuestions)
  }

  const handleBookmark = (index: number) => {
    const newQuestions = [...questions]
    newQuestions[index].isBookmarked = !newQuestions[index].isBookmarked
    setQuestions(newQuestions)
  }

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // 여러 공백을 하나로
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // 특수문자 제거
  }

  const checkAnswer = (userAnswer: string, correctMeanings: string[]): boolean => {
    const normalizedUser = normalizeText(userAnswer)

    // 정답 의미 중 하나라도 일치하면 정답
    return correctMeanings.some((meaning) => {
      const normalizedCorrect = normalizeText(meaning)

      // 완전 일치
      if (normalizedUser === normalizedCorrect) return true

      // 부분 일치 (80% 이상)
      const similarity = calculateSimilarity(normalizedUser, normalizedCorrect)
      return similarity >= 0.8
    })
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const editDistance = getEditDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  const getEditDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  const handleSubmit = async () => {
    // 채점
    const gradedQuestions = questions.map((q) => {
      const isCorrect = checkAnswer(q.userAnswer, q.vocabulary.meanings)
      return {
        ...q,
        isCorrect,
      }
    })

    setQuestions(gradedQuestions)

    // 통계 계산
    const correctCount = gradedQuestions.filter((q) => q.isCorrect).length
    const incorrectCount = gradedQuestions.length - correctCount
    const points = correctCount * 15 // 주관식은 정답당 15점

    setStats({
      correct: correctCount,
      incorrect: incorrectCount,
      totalPoints: points,
    })

    // 오답 노트
    const wrong = gradedQuestions.filter((q) => !q.isCorrect && q.userAnswer.trim() !== '')
    setWrongAnswers(wrong)

    setIsSubmitted(true)

    // 서버에 결과 저장
    try {
      await fetch('/api/vocabulary/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          quizType: 'subjective',
          score: Math.round((correctCount / questions.length) * 100),
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          pointsEarned: points,
        }),
      })

      // 정답 맞힌 단어는 mastered로 업데이트
      for (const q of gradedQuestions) {
        if (q.isCorrect) {
          await fetch('/api/vocabulary/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: user.id,
              vocabularyId: q.vocabulary.id,
              status: 'mastered',
            }),
          })
        }
      }

      // 북마크한 단어 저장
      for (const q of gradedQuestions) {
        if (q.isBookmarked) {
          await fetch('/api/vocabulary/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: user.id,
              vocabularyId: q.vocabulary.id,
              isBookmarked: true,
            }),
          })
        }
      }
    } catch (error) {
      console.error('Failed to save test results:', error)
    }
  }

  const handleRetry = () => {
    // 오답만 다시 풀기
    const retryQuestions = wrongAnswers.map((q) => ({
      ...q,
      userAnswer: '',
      isCorrect: null,
    }))
    setQuestions(retryQuestions)
    setIsSubmitted(false)
    setStats({ correct: 0, incorrect: 0, totalPoints: 0 })
    setWrongAnswers([])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">테스트를 준비하는 중...</p>
        </div>
      </div>
    )
  }

  if (vocabulary.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <nav className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4 flex items-center">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-purple-600">✍️ 주관식 테스트</h1>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">📚</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              학습할 단어가 없습니다
            </h2>
            <p className="text-gray-600 mb-8">
              선생님께서 과제를 할당하면 여기서 주관식 테스트를 볼 수 있습니다.
            </p>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (isSubmitted) {
    const accuracy = Math.round((stats.correct / questions.length) * 100)
    const grade =
      accuracy >= 90 ? 'S' : accuracy >= 80 ? 'A' : accuracy >= 70 ? 'B' : accuracy >= 60 ? 'C' : 'D'
    const gradeColor =
      accuracy >= 90
        ? 'text-purple-600'
        : accuracy >= 80
        ? 'text-blue-600'
        : accuracy >= 70
        ? 'text-green-600'
        : accuracy >= 60
        ? 'text-yellow-600'
        : 'text-red-600'

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* 결과 요약 */}
            <div className="bg-white rounded-2xl shadow-xl p-12 mb-6 text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">주관식 테스트 완료!</h2>
              <p className="text-gray-600 mb-8">수고하셨습니다!</p>

              {/* 등급 */}
              <div className="mb-8">
                <div className={`text-8xl font-bold ${gradeColor} mb-2`}>{grade}</div>
                <div className="text-2xl text-gray-700">{accuracy}% 정답률</div>
              </div>

              {/* 통계 */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-green-50 p-6 rounded-xl">
                  <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
                  <div className="text-3xl font-bold text-green-600">{stats.correct}</div>
                  <div className="text-sm text-green-800">정답</div>
                </div>
                <div className="bg-red-50 p-6 rounded-xl">
                  <XCircle className="mx-auto mb-2 text-red-600" size={32} />
                  <div className="text-3xl font-bold text-red-600">{stats.incorrect}</div>
                  <div className="text-sm text-red-800">오답</div>
                </div>
                <div className="bg-yellow-50 p-6 rounded-xl">
                  <Trophy className="mx-auto mb-2 text-yellow-600" size={32} />
                  <div className="text-3xl font-bold text-yellow-600">{stats.totalPoints}</div>
                  <div className="text-sm text-yellow-800">획득 포인트</div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => router.push('/student/dashboard')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  대시보드로 돌아가기
                </button>
                {wrongAnswers.length > 0 && (
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    오답만 다시 풀기 ({wrongAnswers.length}문제)
                  </button>
                )}
              </div>
            </div>

            {/* 오답 노트 */}
            {wrongAnswers.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <AlertCircle className="mr-2 text-red-600" size={28} />
                  오답 노트
                </h3>

                <div className="space-y-4">
                  {wrongAnswers.map((q, index) => (
                    <div key={index} className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-800 mb-2">
                            {q.vocabulary.word}
                          </h4>
                          {q.vocabulary.pronunciation && (
                            <p className="text-gray-500 mb-2">[{q.vocabulary.pronunciation}]</p>
                          )}
                        </div>
                        {q.isBookmarked && (
                          <BookmarkPlus className="text-purple-600" size={24} />
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="font-semibold text-red-800">내 답안:</span>
                          <span className="ml-2 text-red-700">
                            {q.userAnswer || '(답변 안 함)'}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-green-800">정답:</span>
                          <span className="ml-2 text-green-700">
                            {q.vocabulary.meanings.join(', ')}
                          </span>
                        </div>
                      </div>

                      {q.vocabulary.exampleSentence && (
                        <div className="mt-4 pt-4 border-t border-red-200">
                          <p className="text-sm text-gray-700 mb-1">
                            {q.vocabulary.exampleSentence}
                          </p>
                          {q.vocabulary.sentenceTranslation && (
                            <p className="text-sm text-gray-600">
                              {q.vocabulary.sentenceTranslation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* 헤더 */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/student/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-purple-600">✍️ 주관식 테스트</h1>
                <p className="text-sm text-gray-600">총 {questions.length}문제</p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={questions.every((q) => q.userAnswer.trim() === '')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              제출하기
            </button>
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 안내 */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
            <h4 className="font-bold text-blue-800 mb-2">📝 테스트 안내</h4>
            <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
              <li>각 단어의 뜻을 한글로 입력하세요</li>
              <li>여러 뜻 중 하나만 맞춰도 정답으로 인정됩니다</li>
              <li>어려운 단어는 북마크해두고 나중에 다시 복습하세요</li>
              <li>오답은 오답 노트에 자동으로 저장됩니다</li>
            </ul>
          </div>

          {/* 문제 목록 */}
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {index + 1}번
                      </span>
                      {question.vocabulary.problemNumber && (
                        <span className="text-xs text-gray-500">
                          문제 {question.vocabulary.problemNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-2">
                      {question.vocabulary.word}
                    </h3>
                    {question.vocabulary.pronunciation && (
                      <p className="text-gray-500 mb-2">
                        [{question.vocabulary.pronunciation}]
                      </p>
                    )}
                    {question.vocabulary.partOfSpeech && (
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {question.vocabulary.partOfSpeech}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleBookmark(index)}
                    className={`p-2 rounded-lg transition-colors ${
                      question.isBookmarked
                        ? 'bg-purple-100 text-purple-600'
                        : 'hover:bg-gray-100 text-gray-400'
                    }`}
                    title="북마크"
                  >
                    <BookmarkPlus size={24} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    뜻을 입력하세요:
                  </label>
                  <input
                    type="text"
                    value={question.userAnswer}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  />
                </div>

                {question.vocabulary.exampleSentence && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-1">예문:</p>
                    <p className="text-gray-700">{question.vocabulary.exampleSentence}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 제출 버튼 (하단) */}
          <div className="mt-8 text-center">
            <button
              onClick={handleSubmit}
              disabled={questions.every((q) => q.userAnswer.trim() === '')}
              className="px-12 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg shadow-lg"
            >
              📝 제출하기
            </button>
            <p className="text-sm text-gray-600 mt-3">
              답변한 문제: {questions.filter((q) => q.userAnswer.trim() !== '').length} /{' '}
              {questions.length}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
