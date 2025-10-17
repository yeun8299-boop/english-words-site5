'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, FileText, ChevronRight } from 'lucide-react'

interface Unit {
  id: number
  unitNumber: number
  title: string
  description: string | null
  _count: {
    vocabulary: number
    readingPassages: number
    assignments: number
  }
}

interface Textbook {
  id: number
  title: string
  description: string | null
}

export default function UnitsPage() {
  const router = useRouter()
  const params = useParams()
  const textbookId = params.id as string

  const [textbook, setTextbook] = useState<Textbook | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [formData, setFormData] = useState({
    unitNumber: '',
    title: '',
    description: '',
  })

  useEffect(() => {
    if (textbookId) {
      fetchUnits()
    }
  }, [textbookId])

  const fetchUnits = async () => {
    try {
      const response = await fetch(`/api/textbooks/${textbookId}/units`)
      if (response.ok) {
        const data = await response.json()
        setUnits(data.units)
        setTextbook(data.textbook)
      }
    } catch (error) {
      console.error('Failed to fetch units:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNextUnitNumber = () => {
    if (units.length === 0) return 1
    const maxNumber = Math.max(...units.map((u) => u.unitNumber))
    return maxNumber + 1
  }

  const openCreateModal = () => {
    setEditingUnit(null)
    setFormData({
      unitNumber: getNextUnitNumber().toString(),
      title: '',
      description: '',
    })
    setShowModal(true)
  }

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit)
    setFormData({
      unitNumber: unit.unitNumber.toString(),
      title: unit.title,
      description: unit.description || '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUnit(null)
    setFormData({ unitNumber: '', title: '', description: '' })
  }

  const handleSubmit = async () => {
    if (!formData.unitNumber || !formData.title.trim()) {
      alert('단원 번호와 제목을 입력해주세요.')
      return
    }

    try {
      const url = editingUnit
        ? `/api/textbooks/${textbookId}/units/${editingUnit.id}`
        : `/api/textbooks/${textbookId}/units`

      const method = editingUnit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        closeModal()
        fetchUnits()
      } else {
        const data = await response.json()
        alert(data.error || '단원 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('Save unit error:', error)
      alert('단원 저장 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (unitId: number, title: string) => {
    if (
      !confirm(
        `"${title}" 단원을 정말 삭제하시겠습니까?\n관련된 모든 단어와 독해 지문도 함께 삭제됩니다.`
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/textbooks/${textbookId}/units/${unitId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchUnits()
      } else {
        alert('단원 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Delete unit error:', error)
      alert('단원 삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">단원 목록을 불러오는 중...</p>
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
            onClick={() => router.push('/admin/textbooks')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📖 {textbook?.title} - 단원 관리
            </h1>
            {textbook?.description && (
              <p className="text-gray-600">{textbook.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>단원 추가</span>
        </button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 단원</p>
              <p className="text-2xl font-bold text-gray-800">{units.length}개</p>
            </div>
            <BookOpen className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 단어</p>
              <p className="text-2xl font-bold text-gray-800">
                {units.reduce((sum, u) => sum + u._count.vocabulary, 0)}개
              </p>
            </div>
            <FileText className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 독해 지문</p>
              <p className="text-2xl font-bold text-gray-800">
                {units.reduce((sum, u) => sum + u._count.readingPassages, 0)}개
              </p>
            </div>
            <FileText className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* 단원 목록 */}
      {units.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <BookOpen className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">단원이 없습니다</h3>
          <p className="text-gray-500 mb-6">첫 단원을 추가하여 시작하세요</p>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            첫 단원 만들기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">
                      {unit.unitNumber}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{unit.title}</h3>
                      {unit.description && (
                        <p className="text-sm text-gray-600 mt-1">{unit.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <FileText size={16} className="text-green-600" />
                      <span>단어 {unit._count.vocabulary}개</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FileText size={16} className="text-purple-600" />
                      <span>독해 {unit._count.readingPassages}개</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <BookOpen size={16} className="text-orange-600" />
                      <span>과제 {unit._count.assignments}개</span>
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      router.push(`/admin/textbooks/${textbookId}/units/${unit.id}`)
                    }
                    className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-1"
                  >
                    <span>단어/독해 관리</span>
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => openEditModal(unit)}
                    className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(unit.id, unit.title)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 단원 생성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingUnit ? '단원 정보 수정' : '새 단원 추가'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  단원 번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.unitNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, unitNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 1"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  단원 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: Unit 1 - Daily Life"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명 (선택)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="단원에 대한 간단한 설명"
                  rows={3}
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
                {editingUnit ? '수정하기' : '생성하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
