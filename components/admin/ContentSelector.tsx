'use client'

import { useState, useEffect } from 'react'
import { BookOpen, FileText, ChevronDown, ChevronRight } from 'lucide-react'

interface Unit {
  id: number
  unitNumber: number
  title: string
  _count: {
    vocabulary: number
    readingPassages: number
  }
}

interface Textbook {
  id: number
  title: string
  units: Unit[]
}

interface Vocabulary {
  id: number
  word: string
  problemNumber: number | null
}

interface ReadingPassage {
  id: number
  problemNumber: number
  title: string | null
}

interface VocabularySelection {
  all?: boolean
  problem_numbers?: number[]
  word_ids?: number[]
}

interface ContentSelectorProps {
  assignmentType: 'vocabulary' | 'reading' | 'both'
  selectedTextbookId: number | null
  selectedUnitId: number | null
  vocabularySelection: VocabularySelection | null
  readingPassageIds: number[]
  onTextbookChange: (textbookId: number) => void
  onUnitChange: (unitId: number) => void
  onVocabularySelectionChange: (selection: VocabularySelection) => void
  onReadingSelectionChange: (passageIds: number[]) => void
}

export default function ContentSelector({
  assignmentType,
  selectedTextbookId,
  selectedUnitId,
  vocabularySelection,
  readingPassageIds,
  onTextbookChange,
  onUnitChange,
  onVocabularySelectionChange,
  onReadingSelectionChange,
}: ContentSelectorProps) {
  const [textbooks, setTextbooks] = useState<Textbook[]>([])
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>([])
  const [readingPassages, setReadingPassages] = useState<ReadingPassage[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedTextbook, setExpandedTextbook] = useState<number | null>(null)

  useEffect(() => {
    fetchTextbooks()
  }, [])

  useEffect(() => {
    if (selectedUnitId) {
      if (assignmentType === 'vocabulary' || assignmentType === 'both') {
        fetchVocabulary(selectedUnitId)
      }
      if (assignmentType === 'reading' || assignmentType === 'both') {
        fetchReadingPassages(selectedUnitId)
      }
    }
  }, [selectedUnitId, assignmentType])

  const fetchTextbooks = async () => {
    try {
      const response = await fetch('/api/textbooks')
      if (response.ok) {
        const data = await response.json()
        setTextbooks(data.textbooks)
      }
    } catch (error) {
      console.error('Failed to fetch textbooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVocabulary = async (unitId: number) => {
    try {
      const response = await fetch(`/api/vocabulary?unitId=${unitId}`)
      if (response.ok) {
        const data = await response.json()
        setVocabulary(data.vocabulary)
      }
    } catch (error) {
      console.error('Failed to fetch vocabulary:', error)
    }
  }

  const fetchReadingPassages = async (unitId: number) => {
    try {
      const response = await fetch(`/api/reading?unitId=${unitId}`)
      if (response.ok) {
        const data = await response.json()
        setReadingPassages(data.passages)
      }
    } catch (error) {
      console.error('Failed to fetch reading passages:', error)
    }
  }

  const handleUnitSelect = (textbookId: number, unitId: number) => {
    onTextbookChange(textbookId)
    onUnitChange(unitId)
    // 선택 초기화
    onVocabularySelectionChange({ all: false })
    onReadingSelectionChange([])
  }

  const handleVocabularyModeChange = (mode: 'all' | 'problem' | 'word') => {
    if (mode === 'all') {
      onVocabularySelectionChange({ all: true })
    } else if (mode === 'problem') {
      onVocabularySelectionChange({ problem_numbers: [] })
    } else {
      onVocabularySelectionChange({ word_ids: [] })
    }
  }

  const toggleReadingPassage = (passageId: number) => {
    if (readingPassageIds.includes(passageId)) {
      onReadingSelectionChange(readingPassageIds.filter((id) => id !== passageId))
    } else {
      onReadingSelectionChange([...readingPassageIds, passageId])
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">교재를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 교재 및 단원 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          교재 및 단원 선택 <span className="text-red-500">*</span>
        </label>
        <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
          {textbooks.map((textbook) => (
            <div key={textbook.id} className="border-b border-gray-100 last:border-b-0">
              <button
                onClick={() =>
                  setExpandedTextbook(expandedTextbook === textbook.id ? null : textbook.id)
                }
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {expandedTextbook === textbook.id ? (
                    <ChevronDown size={20} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-500" />
                  )}
                  <BookOpen size={20} className="text-blue-600" />
                  <span className="font-medium text-gray-900">{textbook.title}</span>
                </div>
                <span className="text-sm text-gray-500">{textbook.units.length}개 단원</span>
              </button>

              {expandedTextbook === textbook.id && (
                <div className="bg-gray-50 px-4 pb-2">
                  {textbook.units.map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => handleUnitSelect(textbook.id, unit.id)}
                      className={`w-full px-4 py-3 mt-2 rounded-lg text-left transition-colors ${
                        selectedUnitId === unit.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-white border-2 border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            Unit {unit.unitNumber}: {unit.title}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            단어 {unit._count.vocabulary}개 · 독해 {unit._count.readingPassages}개
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 단어 선택 (vocabulary 또는 both) */}
      {selectedUnitId && (assignmentType === 'vocabulary' || assignmentType === 'both') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            단어 선택 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {/* 전체 단어 */}
            <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                checked={vocabularySelection?.all === true}
                onChange={() => handleVocabularyModeChange('all')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-900">전체 단어 ({vocabulary.length}개)</span>
            </label>

            {/* 문제 번호로 선택 */}
            {vocabulary.some((v) => v.problemNumber) && (
              <div className="border border-gray-200 rounded-lg p-3">
                <label className="flex items-center space-x-3 mb-2">
                  <input
                    type="radio"
                    checked={vocabularySelection?.problem_numbers !== undefined}
                    onChange={() => handleVocabularyModeChange('problem')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-900">문제 번호로 선택</span>
                </label>
                {vocabularySelection?.problem_numbers !== undefined && (
                  <div className="ml-7 mt-2 text-sm text-gray-600">
                    <p>문제 번호를 선택하세요 (구현 예정)</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 독해 지문 선택 (reading 또는 both) */}
      {selectedUnitId && (assignmentType === 'reading' || assignmentType === 'both') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            독해 지문 선택 <span className="text-red-500">*</span>
          </label>
          {readingPassages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
              이 단원에 독해 지문이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {readingPassages.map((passage) => (
                <label
                  key={passage.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    readingPassageIds.includes(passage.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={readingPassageIds.includes(passage.id)}
                    onChange={() => toggleReadingPassage(passage.id)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <FileText
                    size={20}
                    className={readingPassageIds.includes(passage.id) ? 'text-purple-600' : 'text-gray-400'}
                  />
                  <span className="text-gray-900">
                    문제 {passage.problemNumber}
                    {passage.title && `: ${passage.title}`}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
