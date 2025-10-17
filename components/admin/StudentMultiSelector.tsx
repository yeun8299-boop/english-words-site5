'use client'

import { useState, useEffect } from 'react'
import { UserCheck, Search, X } from 'lucide-react'

interface Student {
  id: number
  name: string
  learningCode: string
  level: number
}

interface StudentMultiSelectorProps {
  selectedStudentIds: number[]
  onSelectionChange: (studentIds: number[]) => void
}

export default function StudentMultiSelector({
  selectedStudentIds,
  onSelectionChange,
}: StudentMultiSelectorProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

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

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.learningCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggle = (studentId: number) => {
    if (selectedStudentIds.includes(studentId)) {
      onSelectionChange(selectedStudentIds.filter((id) => id !== studentId))
    } else {
      onSelectionChange([...selectedStudentIds, studentId])
    }
  }

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(filteredStudents.map((s) => s.id))
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">학생 목록을 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 검색 및 전체 선택 */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="이름 또는 학습 코드 검색"
          />
        </div>
        <button
          onClick={handleSelectAll}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors whitespace-nowrap"
        >
          {selectedStudentIds.length === filteredStudents.length ? '전체 해제' : '전체 선택'}
        </button>
      </div>

      {/* 선택된 학생 수 */}
      <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg">
        <span className="text-sm text-blue-800 font-medium">
          {selectedStudentIds.length}명 선택됨
        </span>
        {selectedStudentIds.length > 0 && (
          <button
            onClick={() => onSelectionChange([])}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <X size={16} />
            <span>모두 해제</span>
          </button>
        )}
      </div>

      {/* 학생 목록 */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
          {filteredStudents.map((student) => {
            const isSelected = selectedStudentIds.includes(student.id)

            return (
              <label
                key={student.id}
                className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                } border-b border-gray-100 last:border-b-0`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(student.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserCheck className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-500">
                      {student.learningCode} · Lv.{student.level}
                    </div>
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
