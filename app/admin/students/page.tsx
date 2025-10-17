'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Edit, Trash2, UserCheck, Award, TrendingUp, Calendar } from 'lucide-react'

interface Student {
  id: number
  name: string
  learningCode: string
  level: number
  totalPoints: number
  currentStreak: number
  longestStreak: number
  createdAt: string
  _count: {
    assignments: number
    vocabularyProgress: number
    quizResults: number
  }
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({ name: '', learningCode: '' })

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateLearningCode = () => {
    // 4-8자리 랜덤 코드 생성 (숫자 + 대문자)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    const length = 6 // 기본 6자리
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, learningCode: code })
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('학생 이름을 입력해주세요.')
      return
    }

    if (!formData.learningCode.trim()) {
      alert('학습 코드를 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setFormData({ name: '', learningCode: '' })
        fetchStudents()
      } else {
        const data = await response.json()
        alert(data.error || '학생 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Create student error:', error)
      alert('학생 생성 중 오류가 발생했습니다.')
    }
  }

  const handleUpdate = async () => {
    if (!editingStudent) return

    if (!formData.name.trim()) {
      alert('학생 이름을 입력해주세요.')
      return
    }

    try {
      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setEditingStudent(null)
        setFormData({ name: '', learningCode: '' })
        fetchStudents()
      } else {
        const data = await response.json()
        alert(data.error || '학생 정보 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Update student error:', error)
      alert('학생 정보 수정 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" 학생을 정말 삭제하시겠습니까?\n관련된 모든 학습 기록이 함께 삭제됩니다.`)) {
      return
    }

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchStudents()
      } else {
        alert('학생 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Delete student error:', error)
      alert('학생 삭제 중 오류가 발생했습니다.')
    }
  }

  const openEditModal = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      learningCode: student.learningCode,
    })
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingStudent(null)
    setFormData({ name: '', learningCode: '' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">학생 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">👥 학생 관리</h1>
          <p className="text-gray-600">학생 계정을 생성하고 학습 코드를 관리합니다</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>학생 추가</span>
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 학생</p>
              <p className="text-2xl font-bold text-gray-800">{students.length}</p>
            </div>
            <Users className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 레벨</p>
              <p className="text-2xl font-bold text-gray-800">
                {students.length > 0
                  ? (students.reduce((sum, s) => sum + s.level, 0) / students.length).toFixed(1)
                  : 0}
              </p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 포인트</p>
              <p className="text-2xl font-bold text-gray-800">
                {students.reduce((sum, s) => sum + s.totalPoints, 0).toLocaleString()}
              </p>
            </div>
            <Award className="text-yellow-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">평균 스트릭</p>
              <p className="text-2xl font-bold text-gray-800">
                {students.length > 0
                  ? (students.reduce((sum, s) => sum + s.currentStreak, 0) / students.length).toFixed(1)
                  : 0}
              </p>
            </div>
            <Calendar className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* 학생 목록 */}
      {students.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Users className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">학생이 없습니다</h3>
          <p className="text-gray-500 mb-6">새 학생을 추가하여 시작하세요</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            첫 학생 추가하기
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  학생 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  학습 코드
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  레벨/포인트
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  스트릭
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  학습 현황
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserCheck className="text-blue-600" size={20} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">
                          가입일: {new Date(student.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {student.learningCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">Lv.{student.level}</div>
                    <div className="text-sm text-gray-500">{student.totalPoints.toLocaleString()}pt</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">🔥 {student.currentStreak}일</div>
                    <div className="text-sm text-gray-500">최고: {student.longestStreak}일</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      과제 {student._count.assignments}개
                    </div>
                    <div className="text-sm text-gray-500">
                      단어 {student._count.vocabularyProgress}개 · 퀴즈 {student._count.quizResults}회
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(student)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id, student.name)}
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
      )}

      {/* 학생 생성/수정 모달 */}
      {(showCreateModal || editingStudent) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingStudent ? '학생 정보 수정' : '새 학생 추가'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  학생 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 김철수"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  학습 코드 <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.learningCode}
                    onChange={(e) => setFormData({ ...formData, learningCode: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="4-8자리 (예: 2024001)"
                    maxLength={8}
                  />
                  {!editingStudent && (
                    <button
                      onClick={generateLearningCode}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                      자동 생성
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  학생이 로그인할 때 사용하는 고유 코드입니다 (4-8자리)
                </p>
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
                onClick={editingStudent ? handleUpdate : handleCreate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingStudent ? '수정하기' : '생성하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
