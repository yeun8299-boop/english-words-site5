'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Upload,
  FileText,
  Edit,
  Trash2,
  BookOpen,
} from 'lucide-react'
import CSVUploader from '@/components/admin/CSVUploader'
import TextInputUploader from '@/components/admin/TextInputUploader'
import ReadingPassageUploader from '@/components/admin/ReadingPassageUploader'

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

interface ReadingLine {
  lineIndex: number
  english: string
  korean: string
}

interface ReadingPassage {
  id: number
  problemNumber: number
  title: string | null
  fullText: string
  lines: ReadingLine[]
  createdAt: string
}

interface Unit {
  id: number
  unitNumber: number
  title: string
  description: string | null
  textbook: {
    id: number
    title: string
  }
}

export default function VocabularyManagementPage() {
  const router = useRouter()
  const params = useParams()
  const textbookId = params.id as string
  const unitId = params.unitId as string

  const [activeTab, setActiveTab] = useState<'vocabulary' | 'reading'>('vocabulary')
  const [unit, setUnit] = useState<Unit | null>(null)
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([])
  const [readingPassages, setReadingPassages] = useState<ReadingPassage[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  const [showCSVUploader, setShowCSVUploader] = useState(false)
  const [showTextUploader, setShowTextUploader] = useState(false)
  const [showReadingUploader, setShowReadingUploader] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null)
  const [formData, setFormData] = useState({
    word: '',
    meanings: [''],
    partOfSpeech: '',
    pronunciation: '',
    exampleSentence: '',
    sentenceTranslation: '',
    problemNumber: '',
  })

  useEffect(() => {
    if (unitId) {
      fetchData()
    }
  }, [unitId, activeTab])

  const fetchData = async () => {
    try {
      if (activeTab === 'vocabulary') {
        const response = await fetch(`/api/vocabulary?unitId=${unitId}`)
        if (response.ok) {
          const data = await response.json()
          setVocabulary(data.vocabulary)
        }
      } else {
        const response = await fetch(`/api/reading?unitId=${unitId}`)
        if (response.ok) {
          const data = await response.json()
          setReadingPassages(data.passages)
        }
      }

      // 단원 정보 조회
      const unitResponse = await fetch(`/api/textbooks/${textbookId}/units/${unitId}`)
      if (unitResponse.ok) {
        const unitData = await unitResponse.json()
        setUnit(unitData.unit)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReading = async (passageId: number, title: string) => {
    if (!confirm(`"${title || '독해 지문'}"을(를) 정말 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(`/api/reading/${passageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData()
      } else {
        alert('독해 지문 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Delete reading passage error:', error)
      alert('독해 지문 삭제 중 오류가 발생했습니다.')
    }
  }

  const openCreateModal = () => {
    setEditingVocab(null)
    setFormData({
      word: '',
      meanings: [''],
      partOfSpeech: '',
      pronunciation: '',
      exampleSentence: '',
      sentenceTranslation: '',
      problemNumber: '',
    })
    setShowCreateModal(true)
  }

  const openEditModal = (vocab: Vocabulary) => {
    setEditingVocab(vocab)
    setFormData({
      word: vocab.word,
      meanings: vocab.meanings,
      partOfSpeech: vocab.partOfSpeech || '',
      pronunciation: vocab.pronunciation || '',
      exampleSentence: vocab.exampleSentence || '',
      sentenceTranslation: vocab.sentenceTranslation || '',
      problemNumber: vocab.problemNumber?.toString() || '',
    })
    setShowCreateModal(true)
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingVocab(null)
  }

  const addMeaning = () => {
    setFormData({ ...formData, meanings: [...formData.meanings, ''] })
  }

  const updateMeaning = (index: number, value: string) => {
    const newMeanings = [...formData.meanings]
    newMeanings[index] = value
    setFormData({ ...formData, meanings: newMeanings })
  }

  const removeMeaning = (index: number) => {
    if (formData.meanings.length > 1) {
      const newMeanings = formData.meanings.filter((_, i) => i !== index)
      setFormData({ ...formData, meanings: newMeanings })
    }
  }

  const handleSubmit = async () => {
    if (!formData.word.trim() || formData.meanings.filter((m) => m.trim()).length === 0) {
      alert('단어와 의미를 입력해주세요.')
      return
    }

    const validMeanings = formData.meanings.filter((m) => m.trim())

    try {
      const url = editingVocab ? `/api/vocabulary/${editingVocab.id}` : '/api/vocabulary'
      const method = editingVocab ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: parseInt(unitId),
          word: formData.word.trim(),
          meanings: validMeanings,
          partOfSpeech: formData.partOfSpeech.trim() || undefined,
          pronunciation: formData.pronunciation.trim() || undefined,
          exampleSentence: formData.exampleSentence.trim() || undefined,
          sentenceTranslation: formData.sentenceTranslation.trim() || undefined,
          problemNumber: formData.problemNumber ? parseInt(formData.problemNumber) : undefined,
        }),
      })

      if (response.ok) {
        closeModal()
        fetchData()
      } else {
        const data = await response.json()
        alert(data.error || '단어 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('Save vocabulary error:', error)
      alert('단어 저장 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (vocabId: number, word: string) => {
    if (!confirm(`"${word}" 단어를 정말 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(`/api/vocabulary/${vocabId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchData()
      } else {
        alert('단어 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Delete vocabulary error:', error)
      alert('단어 삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">단어 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/admin/textbooks/${textbookId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              📝 {unit?.textbook.title} - {unit?.title}
            </h1>
            <p className="text-gray-600">단어 및 독해 지문 관리</p>
          </div>
        </div>

        <div className="flex space-x-2">
          {activeTab === 'reading' && (
            <button
              onClick={() => setShowReadingUploader(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} />
              <span>독해 지문 추가</span>
            </button>
          )}
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            <span>단어 추가</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUploadMenu(!showUploadMenu)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload size={20} />
              <span>일괄 업로드</span>
            </button>

            {showUploadMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    setShowUploadMenu(false)
                    setShowCSVUploader(true)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-t-lg transition-colors flex items-center space-x-2"
                >
                  <FileText size={18} />
                  <span>CSV 파일</span>
                </button>
                <button
                  onClick={() => {
                    setShowUploadMenu(false)
                    setShowTextUploader(true)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-b-lg transition-colors flex items-center space-x-2"
                >
                  <Edit size={18} />
                  <span>텍스트 입력</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 탭 전환 */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
              activeTab === 'vocabulary'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📝 단어 ({vocabulary.length})
          </button>
          <button
            onClick={() => setActiveTab('reading')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
              activeTab === 'reading'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📖 독해 지문 ({readingPassages.length})
          </button>
        </div>
      </div>

      {/* 통계 */}
      {activeTab === 'vocabulary' ? (
        <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">전체 단어</p>
            <p className="text-3xl font-bold text-gray-800">{vocabulary.length}개</p>
          </div>
          <BookOpen className="text-blue-600" size={48} />
        </div>
      </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 독해 지문</p>
              <p className="text-3xl font-bold text-gray-800">{readingPassages.length}개</p>
            </div>
            <FileText className="text-purple-600" size={48} />
          </div>
        </div>
      )}

      {/* 단어 목록 */}
      {activeTab === 'vocabulary' ? (
        vocabulary.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BookOpen className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">단어가 없습니다</h3>
            <p className="text-gray-500 mb-6">
              단어를 개별 추가하거나 CSV/텍스트로 일괄 업로드하세요
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                단어 추가
              </button>
              <button
                onClick={() => setShowCSVUploader(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                CSV 업로드
              </button>
            </div>
          </div>
        ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  문제 번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  단어
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  의미
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  예문
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vocabulary.map((vocab) => (
                <tr key={vocab.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vocab.problemNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{vocab.word}</div>
                    {vocab.pronunciation && (
                      <div className="text-xs text-gray-500">[{vocab.pronunciation}]</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{vocab.meanings.join(', ')}</div>
                    {vocab.partOfSpeech && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {vocab.partOfSpeech}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {vocab.exampleSentence ? (
                      <div className="text-sm text-gray-600">
                        <p>{vocab.exampleSentence}</p>
                        {vocab.sentenceTranslation && (
                          <p className="text-xs text-gray-500 mt-1">
                            {vocab.sentenceTranslation}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <button
                      onClick={() => openEditModal(vocab)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(vocab.id, vocab.word)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )
      ) : (
        /* 독해 지문 목록 */
        readingPassages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FileText className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">독해 지문이 없습니다</h3>
            <p className="text-gray-500 mb-6">
              평행 텍스트 형식으로 독해 지문을 추가하세요
            </p>
            <button
              onClick={() => setShowReadingUploader(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              독해 지문 추가
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {readingPassages.map((passage) => (
              <div
                key={passage.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        문제 {passage.problemNumber}
                      </span>
                      {passage.title && (
                        <h3 className="text-lg font-bold text-gray-800">{passage.title}</h3>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      {passage.lines.length}개 라인 · 영어-한국어 평행 텍스트
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm space-y-2">
                        {passage.lines.slice(0, 2).map((line) => (
                          <div key={line.lineIndex} className="space-y-1">
                            <p className="text-gray-800">{line.english}</p>
                            <p className="text-gray-600 text-xs">{line.korean}</p>
                          </div>
                        ))}
                        {passage.lines.length > 2 && (
                          <p className="text-gray-500 text-xs text-center mt-2">
                            외 {passage.lines.length - 2}개 라인...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReading(passage.id, passage.title || '')}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors ml-4"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* CSV 업로더 모달 */}
      {showCSVUploader && (
        <CSVUploader
          unitId={parseInt(unitId)}
          onUploadSuccess={fetchData}
          onClose={() => setShowCSVUploader(false)}
        />
      )}

      {/* 텍스트 업로더 모달 */}
      {showTextUploader && (
        <TextInputUploader
          unitId={parseInt(unitId)}
          onUploadSuccess={fetchData}
          onClose={() => setShowTextUploader(false)}
        />
      )}

      {/* 독해 지문 업로더 모달 */}
      {showReadingUploader && (
        <ReadingPassageUploader
          unitId={parseInt(unitId)}
          onUploadSuccess={fetchData}
          onClose={() => setShowReadingUploader(false)}
        />
      )}

      {/* 단어 생성/수정 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingVocab ? '단어 수정' : '새 단어 추가'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    단어 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.word}
                    onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: run"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    문제 번호 (선택)
                  </label>
                  <input
                    type="number"
                    value={formData.problemNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, problemNumber: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  의미 <span className="text-red-500">*</span>
                </label>
                {formData.meanings.map((meaning, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={meaning}
                      onChange={(e) => updateMeaning(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`의미 ${index + 1}`}
                    />
                    {formData.meanings.length > 1 && (
                      <button
                        onClick={() => removeMeaning(index)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addMeaning}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + 의미 추가
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    품사 (선택)
                  </label>
                  <input
                    type="text"
                    value={formData.partOfSpeech}
                    onChange={(e) =>
                      setFormData({ ...formData, partOfSpeech: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 동사"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    발음 (선택)
                  </label>
                  <input
                    type="text"
                    value={formData.pronunciation}
                    onChange={(e) =>
                      setFormData({ ...formData, pronunciation: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: rʌn"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예문 (선택)
                </label>
                <input
                  type="text"
                  value={formData.exampleSentence}
                  onChange={(e) =>
                    setFormData({ ...formData, exampleSentence: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="He runs every morning."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  예문 해석 (선택)
                </label>
                <input
                  type="text"
                  value={formData.sentenceTranslation}
                  onChange={(e) =>
                    setFormData({ ...formData, sentenceTranslation: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="그는 매일 아침 달린다."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingVocab ? '수정하기' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
