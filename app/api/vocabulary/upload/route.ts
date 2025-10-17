import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface VocabularyItem {
  word: string
  meanings: string[]
  partOfSpeech?: string
  pronunciation?: string
  exampleSentence?: string
  sentenceTranslation?: string
  problemNumber?: number
}

// POST /api/vocabulary/upload - CSV/텍스트 일괄 업로드
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { unitId, vocabularyItems } = body

    if (!unitId) {
      return NextResponse.json(
        { error: '단원 ID를 지정해주세요.' },
        { status: 400 }
      )
    }

    if (!vocabularyItems || !Array.isArray(vocabularyItems) || vocabularyItems.length === 0) {
      return NextResponse.json(
        { error: '업로드할 단어 데이터가 없습니다.' },
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

    // 단어 일괄 생성
    const createdVocabulary = await prisma.vocabulary.createMany({
      data: vocabularyItems.map((item: VocabularyItem) => ({
        unitId: parseInt(unitId),
        word: item.word.trim(),
        meanings: JSON.stringify(item.meanings),
        partOfSpeech: item.partOfSpeech?.trim() || null,
        pronunciation: item.pronunciation?.trim() || null,
        exampleSentence: item.exampleSentence?.trim() || null,
        sentenceTranslation: item.sentenceTranslation?.trim() || null,
        problemNumber: item.problemNumber || null,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({
      message: `${createdVocabulary.count}개의 단어가 추가되었습니다.`,
      count: createdVocabulary.count,
    }, { status: 201 })
  } catch (error) {
    console.error('Upload vocabulary error:', error)
    return NextResponse.json(
      { error: '단어 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
