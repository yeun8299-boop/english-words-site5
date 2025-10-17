// 독해 지문 파싱 유틸리티

interface ReadingLine {
  lineIndex: number
  english: string
  korean: string
}

export interface ParsedReading {
  fullText: string
  lines: ReadingLine[]
}

export interface ReadingParseResult {
  success: boolean
  data: ParsedReading | null
  errors: string[]
  warnings: string[]
}

/**
 * 평행 텍스트 형식의 독해 지문 파싱
 *
 * 형식:
 * Line 1 (English): Thanks to germ theory, / we know
 * Line 2 (Korean):  세균 이론 덕분에, / 우리는 안다
 * Line 3 (English): that maintaining good personal hygiene / is important
 * Line 4 (Korean):  좋은 개인 위생을 유지하는 것이 / 중요하다
 *
 * 규칙:
 * - 홀수 줄(1, 3, 5...) = 영어
 * - 짝수 줄(2, 4, 6...) = 한국어
 * - "/" 기호는 시각적 구분자로 유지 (파싱 구분자 아님)
 *
 * @param text 줄바꿈으로 구분된 평행 텍스트
 * @returns 파싱 결과
 */
export function parseReadingPassage(text: string): ReadingParseResult {
  const result: ReadingParseResult = {
    success: true,
    data: null,
    errors: [],
    warnings: [],
  }

  if (!text?.trim()) {
    result.success = false
    result.errors.push('입력된 텍스트가 비어있습니다.')
    return result
  }

  // 줄 분리 (빈 줄 제거)
  const allLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (allLines.length === 0) {
    result.success = false
    result.errors.push('유효한 텍스트 줄이 없습니다.')
    return result
  }

  // 짝수 개의 줄이어야 함 (영어-한국어 쌍)
  if (allLines.length % 2 !== 0) {
    result.errors.push(
      `줄 개수가 홀수입니다 (${allLines.length}줄). 영어와 한국어가 쌍을 이루어야 합니다.`
    )
    result.warnings.push('마지막 줄에 번역이 누락되었을 수 있습니다.')
  }

  // 영어-한국어 쌍으로 파싱
  const lines: ReadingLine[] = []
  const pairCount = Math.floor(allLines.length / 2)

  for (let i = 0; i < pairCount; i++) {
    const englishLineIndex = i * 2
    const koreanLineIndex = i * 2 + 1

    const english = allLines[englishLineIndex]
    const korean = allLines[koreanLineIndex]

    // 영어 줄 검증 (기본적인 ASCII 문자 포함 여부)
    const hasEnglish = /[a-zA-Z]/.test(english)
    if (!hasEnglish) {
      result.warnings.push(
        `${englishLineIndex + 1}번 줄: 영어 텍스트가 아닐 수 있습니다. "${english.substring(0, 30)}..."`
      )
    }

    // 한국어 줄 검증 (기본적인 한글 포함 여부)
    const hasKorean = /[가-힣]/.test(korean)
    if (!hasKorean) {
      result.warnings.push(
        `${koreanLineIndex + 1}번 줄: 한국어 텍스트가 아닐 수 있습니다. "${korean.substring(0, 30)}..."`
      )
    }

    lines.push({
      lineIndex: i,
      english,
      korean,
    })
  }

  if (lines.length === 0) {
    result.success = false
    result.errors.push('파싱된 텍스트 줄이 없습니다.')
    return result
  }

  // fullText는 원본 그대로 유지 (줄바꿈 포함)
  result.data = {
    fullText: text.trim(),
    lines,
  }

  // 오류가 있으면 실패 처리
  if (result.errors.length > 0) {
    result.success = false
  }

  return result
}

/**
 * 독해 지문 텍스트 정리 (불필요한 공백 제거 등)
 * @param text 원본 텍스트
 * @returns 정리된 텍스트
 */
export function cleanReadingText(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
}

/**
 * 독해 지문 미리보기 생성 (첫 N개 라인)
 * @param lines 파싱된 라인 배열
 * @param count 미리보기 라인 수
 * @returns 미리보기 텍스트
 */
export function generateReadingPreview(lines: ReadingLine[], count: number = 3): string {
  return lines
    .slice(0, count)
    .map((line) => `${line.english}\n${line.korean}`)
    .join('\n\n')
}

/**
 * 독해 지문 통계 계산
 * @param lines 파싱된 라인 배열
 * @returns 통계 정보
 */
export function calculateReadingStats(lines: ReadingLine[]) {
  const totalLines = lines.length
  const totalEnglishWords = lines.reduce((sum, line) => {
    return sum + line.english.split(/\s+/).filter((w) => w.length > 0).length
  }, 0)

  const avgWordsPerLine = totalLines > 0 ? Math.round(totalEnglishWords / totalLines) : 0

  return {
    totalLines,
    totalEnglishWords,
    avgWordsPerLine,
  }
}
