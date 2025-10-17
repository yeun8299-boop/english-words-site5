import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/vocabulary?unitId=1 - 특정 단원의 단어 목록 조회
// GET /api/vocabulary?studentId=1&limit=10 - 학생에게 할당된 단어 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unitId')
    const studentId = searchParams.get('studentId')
    const limit = searchParams.get('limit')

    // Case 1: studentId로 조회 (학생 학습 모드)
    if (studentId) {
      // 학생에게 할당된 과제 조회
      const assignments = await prisma.assignment.findMany({
        where: {
          studentId: parseInt(studentId),
          status: { in: ['assigned', 'in_progress'] },
          assignmentType: { in: ['vocabulary', 'both'] },
        },
        include: {
          unit: {
            include: {
              vocabulary: true,
            },
          },
        },
      })

      if (assignments.length === 0) {
        return NextResponse.json({ vocabulary: [] })
      }

      // 모든 할당된 단어 수집
      let allVocabulary: any[] = []

      for (const assignment of assignments) {
        const unitVocabulary = assignment.unit.vocabulary

        // vocabularyItems 파싱하여 필터링
        if (assignment.vocabularyItems) {
          const vocabItems = JSON.parse(assignment.vocabularyItems)

          if (vocabItems.all) {
            // 단원의 모든 단어
            allVocabulary.push(...unitVocabulary)
          } else if (vocabItems.problem_numbers) {
            // 특정 문제 번호의 단어만
            const filtered = unitVocabulary.filter((v) =>
              vocabItems.problem_numbers.includes(v.problemNumber)
            )
            allVocabulary.push(...filtered)
          } else if (vocabItems.word_ids) {
            // 특정 단어 ID만
            const filtered = unitVocabulary.filter((v) =>
              vocabItems.word_ids.includes(v.id)
            )
            allVocabulary.push(...filtered)
          }
        } else {
          // vocabularyItems가 없으면 모든 단어
          allVocabulary.push(...unitVocabulary)
        }
      }

      // 중복 제거 (같은 단어가 여러 과제에 포함될 수 있음)
      const uniqueVocabulary = Array.from(
        new Map(allVocabulary.map((v) => [v.id, v])).values()
      )

      // 랜덤 셔플 (매번 다른 순서로)
      const shuffled = uniqueVocabulary.sort(() => Math.random() - 0.5)

      // limit 적용
      const limited = limit ? shuffled.slice(0, parseInt(limit)) : shuffled

      // JSON 문자열을 배열로 파싱
      const parsedVocabulary = limited.map((v) => ({
        ...v,
        meanings: JSON.parse(v.meanings),
      }))

      return NextResponse.json({ vocabulary: parsedVocabulary })
    }

    // Case 2: unitId로 조회 (관리자 모드)
    if (unitId) {
      const vocabulary = await prisma.vocabulary.findMany({
        where: { unitId: parseInt(unitId) },
        orderBy: [
          { problemNumber: 'asc' },
          { id: 'asc' },
        ],
      })

      // JSON 문자열을 배열로 파싱
      const parsedVocabulary = vocabulary.map((v) => ({
        ...v,
        meanings: JSON.parse(v.meanings),
      }))

      return NextResponse.json({ vocabulary: parsedVocabulary })
    }

    // Case 3: 파라미터 없음
    return NextResponse.json(
      { error: 'unitId 또는 studentId를 지정해주세요.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Get vocabulary error:', error)
    return NextResponse.json(
      { error: '단어 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/vocabulary - 단어 개별 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      unitId,
      word,
      meanings,
      partOfSpeech,
      pronunciation,
      exampleSentence,
      sentenceTranslation,
      problemNumber,
    } = body

    if (!unitId || !word?.trim() || !meanings || meanings.length === 0) {
      return NextResponse.json(
        { error: '필수 항목(단원, 단어, 의미)을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 단원 존재 확인
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(unitId) },
    })

    if (!unit) {
      return NextResponse.json(
        { error: '단원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 단어 생성
    const vocabulary = await prisma.vocabulary.create({
      data: {
        unitId: parseInt(unitId),
        word: word.trim(),
        meanings: JSON.stringify(meanings),
        partOfSpeech: partOfSpeech?.trim() || null,
        pronunciation: pronunciation?.trim() || null,
        exampleSentence: exampleSentence?.trim() || null,
        sentenceTranslation: sentenceTranslation?.trim() || null,
        problemNumber: problemNumber ? parseInt(problemNumber) : null,
      },
    })

    return NextResponse.json({
      vocabulary: {
        ...vocabulary,
        meanings: JSON.parse(vocabulary.meanings),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create vocabulary error:', error)
    return NextResponse.json(
      { error: '단어 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
