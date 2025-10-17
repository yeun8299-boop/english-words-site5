'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Volume2,
  Lightbulb,
  Trophy,
  RefreshCw,
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

interface SentenceQuestion {
  vocabulary: Vocabulary
  userTranslation: string
  isCorrect: boolean | null
  showHint: boolean
}

interface SentencePracticeProps {
  user: {
    id: number
    name: string
    level: number
  }
}

export default function SentencePractice({ user }: SentencePracticeProps) {
  const router = useRouter()
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([])
  const [questions, setQuestions] = useState<SentenceQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    totalPoints: 0,
  })
  const [wrongAnswers, setWrongAnswers] = useState<SentenceQuestion[]>([])

  useEffect(() => {
    fetchVocabulary()
  }, [user.id])

  const fetchVocabulary = async () => {
    try {
      const response = await fetch(`/api/vocabulary?studentId=${user.id}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        const words = data.vocabulary || []

        // 예문이 있는 단어만 필터링
        const wordsWithSentences = words.filter(
          (vocab: Vocabulary) => vocab.exampleSentence && vocab.sentenceTranslation
        )
        setVocabulary(wordsWithSentences)

        // 문제 초기화
        const initialQuestions: SentenceQuestion[] = wordsWithSentences.map(
          (vocab: Vocabulary) => ({
            vocabulary: vocab,
            userTranslation: '',
            isCorrect: null,
            showHint: false,
          })
        )
        setQuestions(initialQuestions)
      }
    } catch (error) {
      console.error('Failed to fetch vocabulary:', error)
    } finally {
      setLoading(false)
    }
  }

  const speakSentence = (sentence: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(sentence)
      utterance.lang = 'en-US'
      utterance.rate = 0.7
      utterance.pitch = 1
      utterance.volume = 1
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleTranslationChange = (index: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[index].userTranslation = value
    setQuestions(newQuestions)
  }

  const toggleHint = (index: number) => {
    const newQuestions = [...questions]
    newQuestions[index].showHint = !newQuestions[index].showHint
    setQuestions(newQuestions)
  }

  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
  }

  const checkTranslation = (
    userTranslation: string,
    correctTranslation: string | null
  ): boolean => {
    if (!correctTranslation) return false

    const normalizedUser = normalizeText(userTranslation)
    const normalizedCorrect = normalizeText(correctTranslation)

    // 완전 일치
    if (normalizedUser === normalizedCorrect) return true

    // 부분 일치 (70% 이상) - 문장은 좀 더 관대하게
    const similarity = calculateSimilarity(normalizedUser, normalizedCorrect)
    return similarity >= 0.7
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
      const isCorrect = checkTranslation(
        q.userTranslation,
        q.vocabulary.sentenceTranslation
      )
      return {
        ...q,
        isCorrect,
      }
    })

    setQuestions(gradedQuestions)

    // 통계 계산
    const correctCount = gradedQuestions.filter((q) => q.isCorrect).length
    const incorrectCount = gradedQuestions.length - correctCount
    const points = correctCount * 5 // 문장 해석은 정답당 5점

    setStats({
      correct: correctCount,
      incorrect: incorrectCount,
      totalPoints: points,
    })

    // 오답 노트
    const wrong = gradedQuestions.filter(
      (q) => !q.isCorrect && q.userTranslation.trim() !== ''
    )
    setWrongAnswers(wrong)

    setIsSubmitted(true)

    // 서버에 결과 저장
    try {
      await fetch('/api/vocabulary/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          quizType: 'sentence',
          score: Math.round((correctCount / questions.length) * 100),
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          pointsEarned: points,
        }),
      })

      // 정답 맞힌 문장의 단어는 복습 상태로 업데이트
      for (const q of gradedQuestions) {
        if (q.isCorrect) {
          await fetch('/api/vocabulary/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: user.id,
              vocabularyId: q.vocabulary.id,
              status: 'learning',
            }),
          })
        }
      }
    } catch (error) {
      console.error('Failed to save sentence practice results:', error)
    }
  }

  const handleRetry = () => {
    // 오답만 다시 풀기
    const retryQuestions = wrongAnswers.map((q) => ({
      ...q,
      userTranslation: '',
      isCorrect: null,
      showHint: false,
    }))
    setQuestions(retryQuestions)
    setIsSubmitted(false)
    setStats({ correct: 0, incorrect: 0, totalPoints: 0 })
    setWrongAnswers([])
  }

  const handleNewPractice = () => {
    fetchVocabulary()
    setIsSubmitted(false)
    setStats({ correct: 0, incorrect: 0, totalPoints: 0 })
    setWrongAnswers([])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">문장 연습을 준비하는 중...</p>
        </div>
      </div>
    )
  }

  if (vocabulary.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <nav className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4 flex items-center">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-green-600">💬 문장 해석 연습</h1>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">📚</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              예문이 있는 단어가 없습니다
            </h2>
            <p className="text-gray-600 mb-8">
              선생님께서 예문이 포함된 단어를 할당하면 여기서 문장 해석 연습을 할 수 있습니다.
            </p>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* 결과 요약 */}
            <div className="bg-white rounded-2xl shadow-xl p-12 mb-6 text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">문장 해석 연습 완료!</h2>
              <p className="text-gray-600 mb-8">수고하셨습니다!</p>

              {/* 정답률 */}
              <div className="mb-8">
                <div className="text-6xl font-bold text-green-600 mb-2">{accuracy}%</div>
                <div className="text-xl text-gray-700">정답률</div>
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
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  대시보드로 돌아가기
                </button>
                <button
                  onClick={handleNewPractice}
                  className="px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <RefreshCw className="inline mr-2" size={18} />
                  새로운 연습
                </button>
                {wrongAnswers.length > 0 && (
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
                  <XCircle className="mr-2 text-red-600" size={28} />
                  오답 노트
                </h3>

                <div className="space-y-6">
                  {wrongAnswers.map((q, index) => (
                    <div key={index} className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                      <div className="mb-4">
                        <h4 className="text-xl font-bold text-gray-800 mb-2">
                          {q.vocabulary.word}
                          {q.vocabulary.pronunciation && (
                            <span className="ml-2 text-gray-500 text-base">
                              [{q.vocabulary.pronunciation}]
                            </span>
                          )}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          뜻: {q.vocabulary.meanings.join(', ')}
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded-lg mb-4">
                        <p className="font-semibold text-gray-800 mb-2 flex items-center">
                          <Volume2 className="mr-2 text-blue-600" size={18} />
                          영어 문장:
                        </p>
                        <p className="text-gray-700">{q.vocabulary.exampleSentence}</p>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-red-100 p-4 rounded-lg">
                          <span className="font-semibold text-red-800 block mb-2">
                            내 답안:
                          </span>
                          <span className="text-red-700">
                            {q.userTranslation || '(답변 안 함)'}
                          </span>
                        </div>
                        <div className="bg-green-100 p-4 rounded-lg">
                          <span className="font-semibold text-green-800 block mb-2">
                            모범 답안:
                          </span>
                          <span className="text-green-700">
                            {q.vocabulary.sentenceTranslation}
                          </span>
                        </div>
                      </div>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
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
                <h1 className="text-2xl font-bold text-green-600">💬 문장 해석 연습</h1>
                <p className="text-sm text-gray-600">총 {questions.length}문제</p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={questions.every((q) => q.userTranslation.trim() === '')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
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
            <h4 className="font-bold text-blue-800 mb-2">📝 연습 안내</h4>
            <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
              <li>영어 문장을 한글로 해석하세요</li>
              <li>🔊 버튼을 클릭하면 문장을 들을 수 있습니다</li>
              <li>💡 힌트 버튼으로 단어의 뜻을 확인할 수 있습니다</li>
              <li>완벽하지 않아도 의미가 비슷하면 정답으로 인정됩니다</li>
            </ul>
          </div>

          {/* 문제 목록 */}
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    {index + 1}번
                  </span>
                  {question.vocabulary.problemNumber && (
                    <span className="text-xs text-gray-500">
                      문제 {question.vocabulary.problemNumber}
                    </span>
                  )}
                </div>

                {/* 영어 문장 */}
                <div className="bg-gray-50 p-6 rounded-lg mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xl font-medium text-gray-800 flex-1">
                      {question.vocabulary.exampleSentence}
                    </p>
                    <button
                      onClick={() =>
                        speakSentence(question.vocabulary.exampleSentence || '')
                      }
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors ml-3"
                      title="문장 듣기"
                    >
                      <Volume2 size={24} className="text-blue-600" />
                    </button>
                  </div>

                  {/* 힌트 버튼 */}
                  <button
                    onClick={() => toggleHint(index)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    <Lightbulb size={16} className="mr-1" />
                    {question.showHint ? '힌트 숨기기' : '힌트 보기'}
                  </button>

                  {question.showHint && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">{question.vocabulary.word}:</span>{' '}
                        {question.vocabulary.meanings.join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                {/* 답안 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    한글 해석을 입력하세요:
                  </label>
                  <textarea
                    value={question.userTranslation}
                    onChange={(e) => handleTranslationChange(index, e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg resize-none"
                    placeholder="문장의 의미를 한글로 입력하세요..."
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 제출 버튼 (하단) */}
          <div className="mt-8 text-center">
            <button
              onClick={handleSubmit}
              disabled={questions.every((q) => q.userTranslation.trim() === '')}
              className="px-12 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg shadow-lg"
            >
              💬 제출하기
            </button>
            <p className="text-sm text-gray-600 mt-3">
              답변한 문제:{' '}
              {questions.filter((q) => q.userTranslation.trim() !== '').length} /{' '}
              {questions.length}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
