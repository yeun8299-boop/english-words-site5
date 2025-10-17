'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, Users, BookOpen, CheckCircle, Clock, XCircle } from 'lucide-react'
import StudentMultiSelector from '@/components/admin/StudentMultiSelector'
import ContentSelector from '@/components/admin/ContentSelector'

interface Assignment {
  id: number
  assignmentType: 'vocabulary' | 'reading' | 'both'
  status: 'assigned' | 'in_progress' | 'completed'
  dueDate: string | null
  createdAt: string
  student: {
    id: number
    name: string
    learningCode: string
  }
  textbook: {
    id: number
    title: string
  }
  unit: {
    id: number
    unitNumber: number
    title: string
  }
  vocabularyItems: any
  readingPassageIds: number[]
}

interface VocabularySelection {
  all?: boolean
  problem_numbers?: number[]
  word_ids?: number[]
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // 과제 생성 폼 상태
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
  const [assignmentType, setAssignmentType] = useState<'vocabulary' | 'reading' | 'both'>('vocabulary')
  const [selectedTextbookId, setSelectedTextbookId] = useState<number | null>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)
  const [vocabularySelection, setVocabularySelection] = useState<VocabularySelection | null>({ all: false })
  const [readingPassageIds, setReadingPassageIds] = useState<number[]>([])
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/assignments')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssignment = async () => {
    // 유효성 검증
    if (selectedStudentIds.length === 0) {
      alert('학생을 선택해주세요.')
      return
    }

    if (!selectedTextbookId || !selectedUnitId) {
      alert('교재와 단원을 선택해주세요.')
      return
    }

    if (assignmentType === 'vocabulary' || assignmentType === 'both') {
      if (!vocabularySelection || (!vocabularySelection.all && !vocabularySelection.problem_numbers && !vocabularySelection.word_ids)) {
        alert('단어 과제 내용을 선택해주세요.')
        return
      }
    }

    if (assignmentType === 'reading' || assignmentType === 'both') {
      if (readingPassageIds.length === 0) {
        alert('독해 지문을 선택해주세요.')
        return
      }
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          textbookId: selectedTextbookId,
          unitId: selectedUnitId,
          assignmentType,
          vocabularyItems: (assignmentType === 'vocabulary' || assignmentType === 'both') ? vocabularySelection : null,
          readingPassageIds: (assignmentType === 'reading' || assignmentType === 'both') ? readingPassageIds : null,
          dueDate: dueDate || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        setShowCreateModal(false)
        resetForm()
        fetchAssignments()
      } else {
        const data = await response.json()
        alert(data.error || '과제 할당에 실패했습니다.')
      }
    } catch (error) {
      console.error('Create assignment error:', error)
      alert('과제 할당 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedStudentIds([])
    setAssignmentType('vocabulary')
    setSelectedTextbookId(null)
    setSelectedUnitId(null)
    setVocabularySelection({ all: false })
    setReadingPassageIds([])
    setDueDate('')
  }

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('이 과제를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('과제가 삭제되었습니다.')
        fetchAssignments()
      } else {
        alert('과제 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Delete assignment error:', error)
      alert('과제 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleUpdateStatus = async (assignmentId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchAssignments()
      } else {
        alert('상태 업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('Update status error:', error)
      alert('상태 업데이트 중 오류가 발생했습니다.')
    }
  }

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.student.learningCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.textbook.title.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return { icon: Clock, color: 'bg-blue-100 text-blue-700', label: '할당됨' }
      case 'in_progress':
        return { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: '진행 중' }
      case 'completed':
        return { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: '완료' }
      default:
        return { icon: XCircle, color: 'bg-gray-100 text-gray-700', label: '알 수 없음' }
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'vocabulary':
        return { color: 'bg-purple-100 text-purple-700', label: '단어' }
      case 'reading':
        return { color: 'bg-indigo-100 text-indigo-700', label: '독해' }
      case 'both':
        return { color: 'bg-pink-100 text-pink-700', label: '단어+독해' }
      default:
        return { color: 'bg-gray-100 text-gray-700', label: '알 수 없음' }
    }
  }

  const stats = {
    total: assignments.length,
    assigned: assignments.filter((a) => a.status === 'assigned').length,
    inProgress: assignments.filter((a) => a.status === 'in_progress').length,
    completed: assignments.filter((a) => a.status === 'completed').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">과제 관리</h1>
          <p className="text-gray-600 mt-1">학생들에게 단어와 독해 과제를 할당하고 관리합니다</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>새 과제 할당</span>
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 과제</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">할당됨</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.assigned}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">진행 중</p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.inProgress}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">완료</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{stats.completed}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* 검색 */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="학생 이름, 학습 코드, 교재명으로 검색"
              />
            </div>
          </div>

          {/* 상태 필터 */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilterStatus('assigned')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'assigned' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              할당됨
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              진행 중
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              완료
            </button>
          </div>
        </div>
      </div>

      {/* 과제 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">
              {searchQuery || filterStatus !== 'all' ? '검색 결과가 없습니다.' : '할당된 과제가 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학생
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    교재 / 단원
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    과제 유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    마감일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    할당일
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map((assignment) => {
                  const statusBadge = getStatusBadge(assignment.status)
                  const typeBadge = getTypeBadge(assignment.assignmentType)
                  const StatusIcon = statusBadge.icon

                  return (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{assignment.student.name}</div>
                          <div className="text-sm text-gray-500">{assignment.student.learningCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{assignment.textbook.title}</div>
                          <div className="text-sm text-gray-500">
                            Unit {assignment.unit.unitNumber}: {assignment.unit.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${typeBadge.color}`}>
                          {typeBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
                          <StatusIcon size={14} />
                          <span>{statusBadge.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {assignment.dueDate ? (
                          <div className="flex items-center space-x-1">
                            <Calendar size={16} />
                            <span>{new Date(assignment.dueDate).toLocaleDateString('ko-KR')}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">미설정</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(assignment.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {assignment.status !== 'completed' && (
                            <button
                              onClick={() => handleUpdateStatus(assignment.id, 'completed')}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              완료처리
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 과제 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">새 과제 할당</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 학생 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  학생 선택 <span className="text-red-500">*</span>
                </label>
                <StudentMultiSelector
                  selectedStudentIds={selectedStudentIds}
                  onSelectionChange={setSelectedStudentIds}
                />
              </div>

              {/* 과제 유형 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  과제 유형 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setAssignmentType('vocabulary')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      assignmentType === 'vocabulary'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">📚</div>
                      <div className="font-medium text-gray-900">단어 학습</div>
                      <div className="text-sm text-gray-500 mt-1">Vocabulary</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setAssignmentType('reading')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      assignmentType === 'reading'
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">📖</div>
                      <div className="font-medium text-gray-900">독해</div>
                      <div className="text-sm text-gray-500 mt-1">Reading</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setAssignmentType('both')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      assignmentType === 'both'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">📚📖</div>
                      <div className="font-medium text-gray-900">단어 + 독해</div>
                      <div className="text-sm text-gray-500 mt-1">Both</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 콘텐츠 선택 */}
              <ContentSelector
                assignmentType={assignmentType}
                selectedTextbookId={selectedTextbookId}
                selectedUnitId={selectedUnitId}
                vocabularySelection={vocabularySelection}
                readingPassageIds={readingPassageIds}
                onTextbookChange={setSelectedTextbookId}
                onUnitChange={setSelectedUnitId}
                onVocabularySelectionChange={setVocabularySelection}
                onReadingSelectionChange={setReadingPassageIds}
              />

              {/* 마감일 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  마감일 (선택사항)
                </label>
                <div className="flex items-center space-x-2">
                  <Calendar className="text-gray-400" size={20} />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateAssignment}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? '할당 중...' : '과제 할당'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
