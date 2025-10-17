'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, Edit, Trash2, FolderOpen } from 'lucide-react'

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
  description: string | null
  createdAt: string
  units: Unit[]
  _count: {
    assignments: number
  }
}

export default function TextbooksPage() {
  const router = useRouter()
  const [textbooks, setTextbooks] = useState<Textbook[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTextbook, setNewTextbook] = useState({ title: '', description: '' })

  useEffect(() => {
    fetchTextbooks()
  }, [])

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

  const handleCreate = async () => {
    if (!newTextbook.title.trim()) {
      alert('교재 제목을 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/textbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTextbook),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewTextbook({ title: '', description: '' })
        fetchTextbooks()
      } else {
        const data = await response.json()
        alert(data.error || '교재 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Create textbook error:', error)
      alert('교재 생성 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" 교재를 정말 삭제하시겠습니까?\n관련된 모든 단원과 단어도 함께 삭제됩니다.`)) {
      return
    }

    try {
      const response = await fetch(`/api/textbooks/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTextbooks()
      } else {
        alert('교재 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Delete textbook error:', error)
      alert('교재 삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">교재 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📚 교재 관리</h1>
          <p className="text-gray-600">교재와 단원을 생성하고 관리합니다</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>새 교재 추가</span>
        </button>
      </div>

      {/* 교재 목록 */}
      {textbooks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <BookOpen className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">교재가 없습니다</h3>
          <p className="text-gray-500 mb-6">새 교재를 추가하여 시작하세요</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            첫 교재 만들기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {textbooks.map((textbook) => (
            <div
              key={textbook.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{textbook.title}</h3>
                    <p className="text-sm text-gray-500">
                      {textbook.units.length}개 단원
                    </p>
                  </div>
                </div>
              </div>

              {textbook.description && (
                <p className="text-sm text-gray-600 mb-4">{textbook.description}</p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>
                  단어: {textbook.units.reduce((sum, u) => sum + u._count.vocabulary, 0)}개
                </span>
                <span>
                  독해: {textbook.units.reduce((sum, u) => sum + u._count.readingPassages, 0)}개
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/admin/textbooks/${textbook.id}`)}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FolderOpen size={16} />
                  <span>단원 관리</span>
                </button>
                <button
                  onClick={() => handleDelete(textbook.id, textbook.title)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 교재 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">새 교재 추가</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  교재 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTextbook.title}
                  onChange={(e) =>
                    setNewTextbook({ ...newTextbook, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 모의고사 1회"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명 (선택)
                </label>
                <textarea
                  value={newTextbook.description}
                  onChange={(e) =>
                    setNewTextbook({ ...newTextbook, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="교재에 대한 간단한 설명"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewTextbook({ title: '', description: '' })
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
