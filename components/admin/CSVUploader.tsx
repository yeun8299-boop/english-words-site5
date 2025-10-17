'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import { parseVocabularyCSV, validateCSVHeaders, type ParseResult } from '@/lib/csv-parser'

interface CSVUploaderProps {
  unitId: number
  onUploadSuccess: () => void
  onClose: () => void
}

export default function CSVUploader({ unitId, onUploadSuccess, onClose }: CSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      parseCSVFile(selectedFile)
    } else {
      alert('CSV 파일만 업로드할 수 있습니다.')
    }
  }

  const parseCSVFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // 헤더 검증
        const headers = results.meta.fields || []
        const headerValidation = validateCSVHeaders(headers)

        if (!headerValidation.valid) {
          setParseResult({
            success: false,
            data: [],
            errors: [headerValidation.message || 'CSV 형식이 올바르지 않습니다.'],
            warnings: [],
          })
          return
        }

        // 데이터 파싱
        const result = parseVocabularyCSV(results.data as any)
        setParseResult(result)
      },
      error: (error) => {
        setParseResult({
          success: false,
          data: [],
          errors: [`CSV 파일 읽기 오류: ${error.message}`],
          warnings: [],
        })
      },
    })
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
          <h2 className="text-2xl font-bold text-gray-800">📤 CSV 파일 업로드</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* CSV 형식 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">📋 CSV 형식 안내</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>필수 컬럼:</strong> word, meaning</p>
            <p><strong>선택 컬럼:</strong> example_sentence, sentence_translation, part_of_speech, pronunciation, problem_number</p>
            <p className="mt-2"><strong>예시:</strong></p>
            <code className="block bg-white p-2 rounded mt-1 text-xs">
              word,meaning,example_sentence,sentence_translation<br />
              run,달리다, 운영하다,He runs every morning.,그는 매일 아침 달린다.
            </code>
          </div>
        </div>

        {/* 파일 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CSV 파일 선택
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Upload className="mr-2" size={20} />
              <span className="text-sm">
                {file ? file.name : 'CSV 파일을 선택하세요'}
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
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

            {/* 경고 메시지 */}
            {parseResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                  <AlertCircle size={20} />
                  <span className="font-semibold">경고 ({parseResult.warnings.length}개)</span>
                </div>
                <ul className="text-sm text-yellow-700 space-y-1 max-h-40 overflow-y-auto">
                  {parseResult.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 미리보기 */}
            {parseResult.success && parseResult.data.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">📖 미리보기 (최대 5개)</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {parseResult.data.slice(0, 5).map((item, index) => (
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
                        </div>
                      </div>
                    </div>
                  ))}
                  {parseResult.data.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      외 {parseResult.data.length - 5}개...
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
