'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Volume2,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  SkipForward,
  Play,
  Pause,
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

interface VocabularyReviewProps {
  user: {
    id: number
    name: string
    level: number
  }
}

export default function VocabularyReview({ user }: VocabularyReviewProps) {
  const router = useRouter()
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [autoPlay, setAutoPlay] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [stats, setStats] = useState({
    reviewed: 0,
    mastered: 0,
    learning: 0,
  })

  // 단어 데이터 가져오기
  useEffect(() => {
    fetchVocabulary()
  }, [user.id])

  const fetchVocabulary = async () => {
    try {
      // TODO: 학생의 과제에 할당된 단어만 가져오도록 수정 필요
      const response = await fetch(`/api/vocabulary?studentId=${user.id}&status=learning`)
      if (response.ok) {
        const data = await response.json()
        setVocabulary(data.vocabulary || [])
      }
    } catch (error) {
      console.error('Failed to fetch vocabulary:', error)
    } finally {
      setLoading(false)
    }
  }

  // TTS 발음
  const speakWord = useCallback((word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.65 // 천천히 발음
      utterance.pitch = 1
      utterance.volume = 1
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  // 현재 단어 가져오기
  const currentWord = vocabulary[currentIndex]

  // 자동 재생 모드
  useEffect(() => {
    if (autoPlay && currentWord && !isPlaying) {
      setIsPlaying(true)
      speakWord(currentWord.word)

      const timer = setTimeout(() => {
        setIsPlaying(false)
        if (currentIndex < vocabulary.length - 1) {
          nextWord()
        } else {
          setAutoPlay(false)
        }
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [autoPlay, currentIndex, currentWord, isPlaying, speakWord])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentWord) return

      switch (e.key) {
        case ' ': // Space
          e.preventDefault()
          toggleMeaning()
          break
        case 'ArrowLeft': // ← 알고 있어요
          e.preventDefault()
          markAsMastered()
          break
        case 'ArrowRight': // → 학습 중
          e.preventDefault()
          markAsLearning()
          break
        case 'Enter': // 다음으로
          e.preventDefault()
          nextWord()
          break
        case 'r':
        case 'R':
          e.preventDefault()
          speakWord(currentWord.word)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentWord])

  const toggleMeaning = () => {
    setShowMeaning(!showMeaning)
  }

  const nextWord = () => {
    setShowMeaning(false)
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setStats({ ...stats, reviewed: stats.reviewed + 1 })
    }
  }

  const markAsMastered = async () => {
    if (!currentWord) return

    try {
      await fetch('/api/vocabulary/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          vocabularyId: currentWord.id,
          status: 'mastered',
        }),
      })

      setStats({
        ...stats,
        mastered: stats.mastered + 1,
        reviewed: stats.reviewed + 1,
      })
      nextWord()
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const markAsLearning = async () => {
    if (!currentWord) return

    try {
      await fetch('/api/vocabulary/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          vocabularyId: currentWord.id,
          status: 'learning',
        }),
      })

      setStats({
        ...stats,
        learning: stats.learning + 1,
        reviewed: stats.reviewed + 1,
      })
      nextWord()
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">단어 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (vocabulary.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <nav className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4 flex items-center">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-blue-600">🎧 단어 복습</h1>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">📚</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              학습할 단어가 없습니다
            </h2>
            <p className="text-gray-600 mb-8">
              선생님께서 과제를 할당하면 여기서 단어를 복습할 수 있습니다.
            </p>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (currentIndex >= vocabulary.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              모든 단어 복습 완료!
            </h2>
            <p className="text-gray-600 mb-8">수고하셨습니다!</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">{stats.reviewed}</div>
                <div className="text-sm text-blue-800">복습한 단어</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <div className="text-3xl font-bold text-green-600">{stats.mastered}</div>
                <div className="text-sm text-green-800">알고 있어요</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl">
                <div className="text-3xl font-bold text-orange-600">{stats.learning}</div>
                <div className="text-sm text-orange-800">학습 중</div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/student/dashboard')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                대시보드로 돌아가기
              </button>
              <button
                onClick={() => {
                  setCurrentIndex(0)
                  setStats({ reviewed: 0, mastered: 0, learning: 0 })
                  fetchVocabulary()
                }}
                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                다시 복습하기
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
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
                <h1 className="text-2xl font-bold text-blue-600">🎧 단어 복습</h1>
                <p className="text-sm text-gray-600">
                  {currentIndex + 1} / {vocabulary.length}
                </p>
              </div>
            </div>

            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                autoPlay
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {autoPlay ? <Pause size={20} /> : <Play size={20} />}
              <span>{autoPlay ? '자동 재생 중' : '자동 재생'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 진행 바 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="h-2 bg-gray-200">
            <div
              className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / vocabulary.length) * 100}%` }}
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
              <div className="text-2xl font-bold text-blue-600">{stats.reviewed}</div>
              <div className="text-sm text-gray-600">복습</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <div className="text-2xl font-bold text-green-600">{stats.mastered}</div>
              <div className="text-sm text-gray-600">알고 있어요</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.learning}</div>
              <div className="text-sm text-gray-600">학습 중</div>
            </div>
          </div>

          {/* 단어 카드 */}
          <div className="bg-white rounded-2xl shadow-2xl p-12 mb-6 text-center">
            {currentWord.problemNumber && (
              <div className="mb-4">
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  문제 {currentWord.problemNumber}
                </span>
              </div>
            )}

            {/* 단어 */}
            <div className="mb-8">
              <h2 className="text-6xl font-bold text-gray-800 mb-4">
                {currentWord.word}
              </h2>
              {currentWord.pronunciation && (
                <p className="text-2xl text-gray-500 mb-4">
                  [{currentWord.pronunciation}]
                </p>
              )}
              {currentWord.partOfSpeech && (
                <span className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  {currentWord.partOfSpeech}
                </span>
              )}
            </div>

            {/* 발음 버튼 */}
            <button
              onClick={() => speakWord(currentWord.word)}
              className="mb-8 inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              <Volume2 size={24} />
              <span>발음 듣기 (R)</span>
            </button>

            {/* 의미 토글 */}
            <div className="mb-8">
              <button
                onClick={toggleMeaning}
                className="inline-flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showMeaning ? <EyeOff size={20} /> : <Eye size={20} />}
                <span>{showMeaning ? '의미 숨기기' : '의미 보기 (Space)'}</span>
              </button>
            </div>

            {/* 의미 표시 */}
            {showMeaning && (
              <div className="animate-fadeIn">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-6">
                  <div className="text-2xl font-semibold text-gray-800 mb-2">
                    {currentWord.meanings.join(', ')}
                  </div>
                </div>

                {currentWord.exampleSentence && (
                  <div className="bg-gray-50 p-6 rounded-lg text-left">
                    <p className="text-lg text-gray-800 mb-2">
                      {currentWord.exampleSentence}
                    </p>
                    {currentWord.sentenceTranslation && (
                      <p className="text-gray-600">
                        {currentWord.sentenceTranslation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={markAsLearning}
              className="flex flex-col items-center justify-center p-6 bg-white hover:bg-orange-50 border-2 border-orange-300 rounded-xl transition-all hover:shadow-lg"
            >
              <ArrowRight className="text-orange-600 mb-2" size={32} />
              <span className="font-semibold text-orange-800">학습 중</span>
              <span className="text-xs text-orange-600 mt-1">→ 키</span>
            </button>

            <button
              onClick={nextWord}
              className="flex flex-col items-center justify-center p-6 bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-xl transition-all hover:shadow-lg"
            >
              <SkipForward className="text-gray-600 mb-2" size={32} />
              <span className="font-semibold text-gray-800">건너뛰기</span>
              <span className="text-xs text-gray-600 mt-1">Enter 키</span>
            </button>

            <button
              onClick={markAsMastered}
              className="flex flex-col items-center justify-center p-6 bg-white hover:bg-green-50 border-2 border-green-300 rounded-xl transition-all hover:shadow-lg"
            >
              <CheckCircle className="text-green-600 mb-2" size={32} />
              <span className="font-semibold text-green-800">알고 있어요</span>
              <span className="text-xs text-green-600 mt-1">← 키</span>
            </button>
          </div>

          {/* 키보드 단축키 안내 */}
          <div className="mt-6 bg-white rounded-lg p-4 text-center text-sm text-gray-600">
            <p className="font-semibold mb-2">⌨️ 키보드 단축키</p>
            <div className="flex justify-center space-x-6">
              <span>Space: 의미 보기</span>
              <span>R: 발음 재생</span>
              <span>←: 알고 있어요</span>
              <span>→: 학습 중</span>
              <span>Enter: 건너뛰기</span>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
