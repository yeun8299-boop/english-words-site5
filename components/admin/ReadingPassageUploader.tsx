'use client'

import { useState } from 'react'
import { FileText, CheckCircle, AlertCircle, X, Info } from 'lucide-react'
import {
  parseReadingPassage,
  generateReadingPreview,
  calculateReadingStats,
  type ReadingParseResult,
} from '@/lib/reading-parser'

interface ReadingPassageUploaderProps {
  unitId: number
  onUploadSuccess: () => void
  onClose: () => void
}

export default function ReadingPassageUploader({
  unitId,
  onUploadSuccess,
  onClose,
}: ReadingPassageUploaderProps) {
  const [text, setText] = useState('')
  const [problemNumber, setProblemNumber] = useState('')
  const [title, setTitle] = useState('')
  const [parseResult, setParseResult] = useState<ReadingParseResult | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleParse = () => {
    if (!text.trim()) {
      alert('텍스트를 입력해주세요.')
      return
    }

    const result = parseReadingPassage(text)
    setParseResult(result)
  }

  const handleUpload = async () => {
    if (!parseResult || !parseResult.success || !parseResult.data) {
      alert('업로드할 데이터가 없거나 오류가 있습니다.')
      return
    }

    if (!problemNumber) {
      alert('문제 번호를 입력해주세요.')
      return
    }

    setUploading(true)

    try {
      const response = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          problemNumber: parseInt(problemNumber),
          title: title.trim() || null,
          fullText: parseResult.data.fullText,
          lines: parseResult.data.lines,
        }),
      })

      if (response.ok) {
        alert('독해 지문이 성공적으로 업로드되었습니다.')
        onUploadSuccess()
        onClose()
      } else {
        const data = await response.json()
        alert(data.error || '업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const stats = parseResult?.data ? calculateReadingStats(parseResult.data.lines) : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📖 독해 지문 업로드</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 형식 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center space-x-2">
            <Info size={20} />
            <span>📋 평행 텍스트 입력 형식</span>
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>규칙:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>홀수 줄(1, 3, 5...) = 영어 텍스트</li>
              <li>짝수 줄(2, 4, 6...) = 한국어 번역</li>
              <li>"/" 기호는 구문 구분용 (선택사항)</li>
              <li>영어-한국어 쌍이 정확히 맞아야 함</li>
            </ul>
            <p className="mt-2"><strong>예시:</strong></p>
            <code className="block bg-white p-3 rounded mt-1 text-xs font-mono whitespace-pre">
{`Thanks to germ theory, / we know
세균 이론 덕분에, / 우리는 안다
that maintaining good personal hygiene / is important
좋은 개인 위생을 유지하는 것이 / 중요하다`}
            </code>
          </div>
        </div>

        {/* 메타 정보 입력 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              문제 번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={problemNumber}
              onChange={(e) => setProblemNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 1"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 (선택)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: Germ Theory"
            />
          </div>
        </div>

        {/* 텍스트 입력 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            독해 지문 입력 (평행 텍스트)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="영어 줄&#10;한국어 줄&#10;영어 줄&#10;한국어 줄&#10;..."
            rows={15}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">
              {text.split('\n').filter((line) => line.trim()).length}줄
              {text.split('\n').filter((line) => line.trim()).length % 2 !== 0 && (
                <span className="text-orange-600 ml-2">⚠️ 홀수 줄 (쌍이 맞지 않음)</span>
              )}
            </p>
            <button
              onClick={handleParse}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              파싱 및 미리보기
            </button>
          </div>
        </div>

        {/* 파싱 결과 */}
        {parseResult && (
          <div className="space-y-4">
            {/* 성공 메시지 */}
            {parseResult.success && parseResult.data && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-800 mb-2">
                  <CheckCircle size={20} />
                  <span className="font-semibold">파싱 성공</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>총 {stats?.totalLines}개 라인 (영어-한국어 쌍)</p>
                  <p>영어 단어 수: {stats?.totalEnglishWords}개</p>
                  <p>라인당 평균 단어: {stats?.avgWordsPerLine}개</p>
                </div>
              </div>
            )}

            {/* 오류 메시지 */}
            {parseResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-800 mb-2">
                  <AlertCircle size={20} />
                  <span className="font-semibold">오류 ({parseResult.errors.length}개)</span>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {parseResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 경고 메시지 */}
            {parseResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                  <AlertCircle size={20} />
                  <span className="font-semibold">경고 ({parseResult.warnings.length}개)</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                  {parseResult.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 미리보기 */}
            {parseResult.success && parseResult.data && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">📖 미리보기 (최대 3쌍)</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap font-mono text-gray-700">
                    {generateReadingPreview(parseResult.data.lines, 3)}
                  </pre>
                  {parseResult.data.lines.length > 3 && (
                    <p className="text-sm text-gray-500 text-center mt-3">
                      외 {parseResult.data.lines.length - 3}개 라인...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleUpload}
            disabled={!parseResult?.success || !problemNumber || uploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </div>
    </div>
  )
}
