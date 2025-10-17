'use client'

import { useState } from 'react'
import { FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import { parseVocabularyText, type ParseResult } from '@/lib/csv-parser'

interface TextInputUploaderProps {
  unitId: number
  onUploadSuccess: () => void
  onClose: () => void
}

export default function TextInputUploader({
  unitId,
  onUploadSuccess,
  onClose,
}: TextInputUploaderProps) {
  const [text, setText] = useState('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleParse = () => {
    if (!text.trim()) {
      alert('텍스트를 입력해주세요.')
      return
    }

    const result = parseVocabularyText(text)
    setParseResult(result)
  }

  const handleUpload = async () => {
    if (!parseResult || !parseResult.success) {
      alert('업로드할 데이터가 없거나 오류가 있습니다.')
      return
    }

    setUploading(true)

    try {
      const response = await fetch('/api/vocabulary/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          vocabularyItems: parseResult.data,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message || '단어가 성공적으로 업로드되었습니다.')
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">✍️ 텍스트 입력</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* 형식 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">📋 입력 형식 안내</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>형식:</strong> 단어 - 의미 - 예문 - 해석</p>
            <p className="text-xs text-blue-600 mt-1">
              (예문과 해석은 선택 사항입니다)
            </p>
            <p className="mt-2"><strong>예시:</strong></p>
            <code className="block bg-white p-2 rounded mt-1 text-xs">
              run - 달리다, 운영하다 - He runs every morning. - 그는 매일 아침 달린다.<br />
              make - 만들다 - She made a cake. - 그녀는 케이크를 만들었다.<br />
              beautiful - 아름다운
            </code>
          </div>
        </div>

        {/* 텍스트 입력 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            단어 입력 (한 줄에 하나씩)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="run - 달리다, 운영하다 - He runs every morning. - 그는 매일 아침 달린다."
            rows={10}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">
              {text.split('\n').filter((line) => line.trim()).length}줄
            </p>
            <button
              onClick={handleParse}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              미리보기
            </button>
          </div>
        </div>

        {/* 파싱 결과 */}
        {parseResult && (
          <div className="space-y-4">
            {/* 성공 메시지 */}
            {parseResult.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-800 mb-2">
                  <CheckCircle size={20} />
                  <span className="font-semibold">파싱 성공</span>
                </div>
                <p className="text-sm text-green-700">
                  {parseResult.data.length}개의 단어가 준비되었습니다.
                </p>
              </div>
            )}

            {/* 오류 메시지 */}
            {parseResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-800 mb-2">
                  <AlertCircle size={20} />
                  <span className="font-semibold">오류 ({parseResult.errors.length}개)</span>
                </div>
                <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                  {parseResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 미리보기 */}
            {parseResult.success && parseResult.data.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">📖 미리보기</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {parseResult.data.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <div className="flex items-start space-x-2">
                        <FileText size={16} className="text-blue-600 mt-1" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{item.word}</p>
                          <p className="text-gray-600">{item.meanings.join(', ')}</p>
                          {item.exampleSentence && (
                            <p className="text-gray-500 text-xs mt-1">
                              {item.exampleSentence}
                            </p>
                          )}
                          {item.sentenceTranslation && (
                            <p className="text-gray-400 text-xs">
                              {item.sentenceTranslation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
            disabled={!parseResult?.success || uploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? '업로드 중...' : `${parseResult?.data.length || 0}개 업로드`}
          </button>
        </div>
      </div>
    </div>
  )
}
