// CSV 파싱 및 검증 유틸리티

interface VocabularyCSVRow {
  word: string
  meaning: string
  example_sentence?: string
  sentence_translation?: string
  part_of_speech?: string
  pronunciation?: string
  problem_number?: string
}

interface ParsedVocabulary {
  word: string
  meanings: string[]
  partOfSpeech?: string
  pronunciation?: string
  exampleSentence?: string
  sentenceTranslation?: string
  problemNumber?: number
}

export interface ParseResult {
  success: boolean
  data: ParsedVocabulary[]
  errors: string[]
  warnings: string[]
}

/**
 * CSV 데이터를 파싱하여 단어 객체 배열로 변환
 * @param csvData PapaParse로 파싱된 CSV 데이터
 * @returns 파싱 결과 (성공/실패, 데이터, 오류 메시지)
 */
export function parseVocabularyCSV(csvData: VocabularyCSVRow[]): ParseResult {
  const result: ParseResult = {
    success: true,
    data: [],
    errors: [],
    warnings: [],
  }

  if (!csvData || csvData.length === 0) {
    result.success = false
    result.errors.push('CSV 데이터가 비어있습니다.')
    return result
  }

  csvData.forEach((row, index) => {
    const lineNumber = index + 2 // 헤더 제외, 1부터 시작

    // 필수 필드 검증
    if (!row.word?.trim()) {
      result.errors.push(`${lineNumber}행: 단어(word)가 비어있습니다.`)
      return
    }

    if (!row.meaning?.trim()) {
      result.errors.push(`${lineNumber}행: 의미(meaning)가 비어있습니다.`)
      return
    }

    // 의미를 쉼표로 분리 (예: "달리다, 운영하다")
    const meanings = row.meaning
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0)

    if (meanings.length === 0) {
      result.errors.push(`${lineNumber}행: 유효한 의미가 없습니다.`)
      return
    }

    // 문제 번호 변환 (선택)
    let problemNumber: number | undefined
    if (row.problem_number?.trim()) {
      const parsed = parseInt(row.problem_number.trim())
      if (isNaN(parsed)) {
        result.warnings.push(`${lineNumber}행: 문제 번호가 숫자가 아닙니다. 무시됩니다.`)
      } else {
        problemNumber = parsed
      }
    }

    // 파싱된 단어 객체 추가
    result.data.push({
      word: row.word.trim(),
      meanings,
      partOfSpeech: row.part_of_speech?.trim() || undefined,
      pronunciation: row.pronunciation?.trim() || undefined,
      exampleSentence: row.example_sentence?.trim() || undefined,
      sentenceTranslation: row.sentence_translation?.trim() || undefined,
      problemNumber,
    })
  })

  // 오류가 있으면 실패 처리
  if (result.errors.length > 0) {
    result.success = false
  }

  return result
}

/**
 * 텍스트 입력을 파싱하여 단어 객체 배열로 변환
 * 형식: word - meaning - example_sentence - translation
 * @param text 줄바꿈으로 구분된 텍스트
 * @returns 파싱 결과
 */
export function parseVocabularyText(text: string): ParseResult {
  const result: ParseResult = {
    success: true,
    data: [],
    errors: [],
    warnings: [],
  }

  if (!text?.trim()) {
    result.success = false
    result.errors.push('입력된 텍스트가 비어있습니다.')
    return result
  }

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    result.success = false
    result.errors.push('유효한 텍스트 줄이 없습니다.')
    return result
  }

  lines.forEach((line, index) => {
    const lineNumber = index + 1

    // " - "로 분리 (word - meaning - example - translation)
    const parts = line.split(' - ').map((p) => p.trim())

    if (parts.length < 2) {
      result.errors.push(
        `${lineNumber}행: 형식이 올바르지 않습니다. "단어 - 의미" 형식을 사용하세요.`
      )
      return
    }

    const word = parts[0]
    const meaning = parts[1]
    const exampleSentence = parts[2] || undefined
    const sentenceTranslation = parts[3] || undefined

    if (!word) {
      result.errors.push(`${lineNumber}행: 단어가 비어있습니다.`)
      return
    }

    if (!meaning) {
      result.errors.push(`${lineNumber}행: 의미가 비어있습니다.`)
      return
    }

    // 의미를 쉼표로 분리
    const meanings = meaning
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0)

    if (meanings.length === 0) {
      result.errors.push(`${lineNumber}행: 유효한 의미가 없습니다.`)
      return
    }

    // 파싱된 단어 객체 추가
    result.data.push({
      word,
      meanings,
      exampleSentence,
      sentenceTranslation,
    })
  })

  // 오류가 있으면 실패 처리
  if (result.errors.length > 0) {
    result.success = false
  }

  return result
}

/**
 * CSV 헤더 검증
 * @param headers CSV 헤더 배열
 * @returns 유효성 검사 결과
 */
export function validateCSVHeaders(headers: string[]): { valid: boolean; message?: string } {
  const requiredHeaders = ['word', 'meaning']
  const optionalHeaders = [
    'example_sentence',
    'sentence_translation',
    'part_of_speech',
    'pronunciation',
    'problem_number',
  ]

  const allowedHeaders = [...requiredHeaders, ...optionalHeaders]

  // 필수 헤더 확인
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      return {
        valid: false,
        message: `필수 컬럼 "${required}"이(가) 없습니다.`,
      }
    }
  }

  // 허용되지 않은 헤더 확인
  const invalidHeaders = headers.filter((h) => !allowedHeaders.includes(h) && h.trim() !== '')
  if (invalidHeaders.length > 0) {
    return {
      valid: false,
      message: `허용되지 않은 컬럼: ${invalidHeaders.join(', ')}`,
    }
  }

  return { valid: true }
}
