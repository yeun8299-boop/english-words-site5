'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
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

interface QuizQuestion {
  word: Vocabulary
  correctAnswer: string
  options: string[]
}

interface SpeedQuizProps {
  user: {
    id: number
    name: string
    level: number
  }
}

export default function SpeedQuiz({ user }: SpeedQuizProps) {
  const router = useRouter()
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([])
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(15) // 15초 타이머
  const [stats, setStats] = useState({
    correct: 0,
    incorrect: 0,
    combo: 0,
    maxCombo: 0,
    totalPoints: 0,
    timeBonus: 0,
  })
  const [showResult, setShowResult] = useState(false)

  // 단어 데이터 가져오기
  useEffect(() => {
    fetchVocabularyAndGenerateQuiz()
  }, [user.id])

  const fetchVocabularyAndGenerateQuiz = async () => {
    try {
      const response = await fetch(`/api/vocabulary?studentId=${user.id}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        const words = data.vocabulary || []
        setVocabulary(words)

        if (words.length >= 4) {
          generateQuestions(words)
        }
      }
    } catch (error) {
      console.error('Failed to fetch vocabulary:', error)
    } finally {
      setLoading(false)
    }
  }

  // 퀴즈 문제 생성
  const generateQuestions = (words: Vocabulary[]) => {
    const quizQuestions: QuizQuestion[] = []

    // 최대 20문제 생성
    const numQuestions = Math.min(20, words.length)
    const shuffledWords = [...words].sort(() => Math.random() - 0.5)

    for (let i = 0; i < numQuestions; i++) {
      const word = shuffledWords[i]
      const correctAnswer = word.meanings[0] // 첫 번째 의미를 정답으로

      // 오답 선택지 생성
      const wrongAnswers: string[] = []
      const otherWords = words.filter(w => w.id !== word.id)

      while (wrongAnswers.length < 3 && otherWords.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherWords.length)
        const wrongWord = otherWords.splice(randomIndex, 1)[0]
        const wrongMeaning = wrongWord.meanings[0]

        if (!wrongAnswers.includes(wrongMeaning) && wrongMeaning !== correctAnswer) {
          wrongAnswers.push(wrongMeaning)
        }
      }

      // 선택지 섞기
      const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)

      quizQuestions.push({
        word,
        correctAnswer,
        options,
      })
    }

    setQuestions(quizQuestions)
  }

  // 타이머
  useEffect(() => {
    if (!loading && !isAnswered && !showResult && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)

      return () => clearTimeout(timer)
    }

    // 시간 초과
    if (timeLeft === 0 && !isAnswered) {
      handleTimeout()
    }
  }, [timeLeft, isAnswered, loading, showResult])

  const handleTimeout = () => {
    setIsAnswered(true)
    setIsCorrect(false)
    setStats({
      ...stats,
      incorrect: stats.incorrect + 1,
      combo: 0, // 콤보 리셋
    })

    setTimeout(() => {
      nextQuestion()
    }, 1500)
  }

  const handleAnswerSelect = async (answer: string) => {
    if (isAnswered) return

    setSelectedAnswer(answer)
    setIsAnswered(true)

    const currentQuestion = questions[currentQuestionIndex]
    const correct = answer === currentQuestion.correctAnswer

    setIsCorrect(correct)

    if (correct) {
      const newCombo = stats.combo + 1
      const comboBonus = newCombo * 2 // 콤보마다 +2점씩 추가
      const timeBonus = Math.floor(timeLeft / 3) // 남은 시간 / 3 = 보너스 포인트
      const totalQuestionPoints = 10 + comboBonus + timeBonus

      setStats({
        ...stats,
        correct: stats.correct + 1,
        combo: newCombo,
        maxCombo: Math.max(stats.maxCombo, newCombo),
        totalPoints: stats.totalPoints + totalQuestionPoints,
        timeBonus: stats.timeBonus + timeBonus,
      })

      // 서버에 진도 저장
      try {
        await fetch('/api/vocabulary/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: user.id,
            vocabularyId: currentQuestion.word.id,
            status: 'mastered',
          }),
        })
      } catch (error) {
        console.error('Failed to save progress:', error)
      }
    } else {
      setStats({
        ...stats,
        incorrect: stats.incorrect + 1,
        combo: 0, // 콤보 리셋
      })
    }

    // 1.5초 후 다음 문제
    setTimeout(() => {
      nextQuestion()
    }, 1500)
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
      setTimeLeft(15) // 타이머 리셋
    } else {
      // 퀴즈 완료
      finishQuiz()
    }
  }

  const finishQuiz = async () => {
    setShowResult(true)

    // 퀴즈 결과 저장
    try {
      await fetch('/api/vocabulary/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          quizType: 'speed',
          score: Math.round((stats.correct / questions.length) * 100),
          totalQuestions: questions.length,
          correctAnswers: stats.correct,
          comboMax: stats.maxCombo,
          timeTaken: questions.length * 15 - timeLeft, // 총 소요 시간
          pointsEarned: stats.totalPoints,
        }),
      })
    } catch (error) {
      console.error('Failed to save quiz result:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">퀴즈를 준비하는 중...</p>
        </div>
      </div>
    )
  }

  if (vocabulary.length < 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <nav className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4 flex items-center">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-orange-600">⚡ 스피드 퀴즈</h1>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">📚</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              단어가 부족합니다
            </h2>
            <p className="text-gray-600 mb-8">
              스피드 퀴즈를 시작하려면 최소 4개 이상의 단어가 필요합니다.
            </p>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (showResult) {
    const accuracy = Math.round((stats.correct / questions.length) * 100)
    const grade = accuracy >= 90 ? 'S' : accuracy >= 80 ? 'A' : accuracy >= 70 ? 'B' : accuracy >= 60 ? 'C' : 'D'
    const gradeColor = accuracy >= 90 ? 'text-purple-600' : accuracy >= 80 ? 'text-blue-600' : accuracy >= 70 ? 'text-green-600' : accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              스피드 퀴즈 완료!
            </h2>
            <p className="text-gray-600 mb-8">수고하셨습니다!</p>

            {/* 등급 */}
            <div className="mb-8">
              <div className={`text-8xl font-bold ${gradeColor} mb-2`}>{grade}</div>
              <div className="text-2xl text-gray-700">{accuracy}% 정답률</div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
              <div className="bg-purple-50 p-6 rounded-xl">
                <Zap className="mx-auto mb-2 text-purple-600" size={32} />
                <div className="text-3xl font-bold text-purple-600">{stats.maxCombo}</div>
                <div className="text-sm text-purple-800">최대 콤보</div>
              </div>
              <div className="bg-yellow-50 p-6 rounded-xl">
                <Trophy className="mx-auto mb-2 text-yellow-600" size={32} />
                <div className="text-3xl font-bold text-yellow-600">{stats.totalPoints}</div>
                <div className="text-sm text-yellow-800">획득 포인트</div>
              </div>
            </div>

            {/* 보너스 정보 */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-8 text-left">
              <h4 className="font-bold text-blue-800 mb-3">💎 포인트 내역</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>기본 포인트 (정답 x 10)</span>
                  <span className="font-semibold">{stats.correct * 10}pt</span>
                </div>
                <div className="flex justify-between">
                  <span>콤보 보너스</span>
                  <span className="font-semibold">+{stats.totalPoints - (stats.correct * 10) - stats.timeBonus}pt</span>
                </div>
                <div className="flex justify-between">
                  <span>시간 보너스</span>
                  <span className="font-semibold">+{stats.timeBonus}pt</span>
                </div>
                <div className="border-t border-blue-300 pt-2 flex justify-between text-base font-bold">
                  <span>총 획득 포인트</span>
                  <span>{stats.totalPoints}pt</span>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/student/dashboard')}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                대시보드로 돌아가기
              </button>
              <button
                onClick={() => {
                  setCurrentQuestionIndex(0)
                  setShowResult(false)
                  setStats({
                    correct: 0,
                    incorrect: 0,
                    combo: 0,
                    maxCombo: 0,
                    totalPoints: 0,
                    timeBonus: 0,
                  })
                  setTimeLeft(15)
                  fetchVocabularyAndGenerateQuiz()
                }}
                className="px-6 py-3 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
              >
                다시 도전하기
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
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
                <h1 className="text-2xl font-bold text-orange-600">⚡ 스피드 퀴즈</h1>
                <p className="text-sm text-gray-600">
                  {currentQuestionIndex + 1} / {questions.length}
                </p>
              </div>
            </div>

            {/* 타이머 */}
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeLeft <= 5 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock size={20} />
                <span className="text-xl font-bold">{timeLeft}s</span>
              </div>

              {/* 콤보 */}
              {stats.combo > 0 && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg">
                  <Zap size={20} />
                  <span className="text-xl font-bold">{stats.combo} 콤보!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 진행 바 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="h-2 bg-gray-200">
            <div
              className="h-2 bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 통계 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <Target className="mx-auto mb-2 text-orange-600" size={24} />
              <div className="text-2xl font-bold text-orange-600">{stats.totalPoints}</div>
              <div className="text-sm text-gray-600">포인트</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <CheckCircle className="mx-auto mb-2 text-green-600" size={24} />
              <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
              <div className="text-sm text-gray-600">정답</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <Zap className="mx-auto mb-2 text-purple-600" size={24} />
              <div className="text-2xl font-bold text-purple-600">{stats.combo}</div>
              <div className="text-sm text-gray-600">콤보</div>
            </div>
          </div>

          {/* 문제 카드 */}
          <div className="bg-white rounded-2xl shadow-2xl p-12 mb-6">
            {currentQuestion.word.problemNumber && (
              <div className="mb-4 text-center">
                <span className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                  문제 {currentQuestion.word.problemNumber}
                </span>
              </div>
            )}

            {/* 단어 */}
            <div className="text-center mb-12">
              <h2 className="text-6xl font-bold text-gray-800 mb-4">
                {currentQuestion.word.word}
              </h2>
              {currentQuestion.word.pronunciation && (
                <p className="text-2xl text-gray-500">
                  [{currentQuestion.word.pronunciation}]
                </p>
              )}
            </div>

            {/* 선택지 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === option
                const isCorrectAnswer = option === currentQuestion.correctAnswer

                let buttonClass = 'bg-white hover:bg-gray-50 border-2 border-gray-300'

                if (isAnswered) {
                  if (isSelected && isCorrect) {
                    buttonClass = 'bg-green-100 border-4 border-green-500'
                  } else if (isSelected && !isCorrect) {
                    buttonClass = 'bg-red-100 border-4 border-red-500'
                  } else if (isCorrectAnswer) {
                    buttonClass = 'bg-green-50 border-2 border-green-300'
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isAnswered}
                    className={`p-6 rounded-xl transition-all text-left text-lg font-semibold ${buttonClass} ${
                      isAnswered ? 'cursor-not-allowed' : 'hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">{option}</span>
                      {isAnswered && isSelected && (
                        <span>
                          {isCorrect ? (
                            <CheckCircle className="text-green-600" size={32} />
                          ) : (
                            <XCircle className="text-red-600" size={32} />
                          )}
                        </span>
                      )}
                      {isAnswered && !isSelected && isCorrectAnswer && (
                        <CheckCircle className="text-green-600" size={32} />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* 피드백 */}
            {isAnswered && (
              <div className="mt-6 text-center">
                {isCorrect ? (
                  <div className="animate-bounce">
                    <p className="text-3xl font-bold text-green-600">정답입니다! 🎉</p>
                    {stats.combo > 1 && (
                      <p className="text-xl text-purple-600 mt-2">
                        🔥 {stats.combo} 콤보! +{stats.combo * 2} 보너스!
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl font-bold text-red-600">틀렸습니다</p>
                    <p className="text-lg text-gray-600 mt-2">
                      정답: {currentQuestion.correctAnswer}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 단축키 안내 */}
          <div className="text-center text-sm text-gray-600">
            <p>⏱️ 15초 안에 답을 선택하세요!</p>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce {
          animation: bounce 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
