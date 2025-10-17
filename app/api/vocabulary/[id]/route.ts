import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/vocabulary/[id] - 단어 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vocabId = parseInt(params.id)

    if (isNaN(vocabId)) {
      return NextResponse.json(
        { error: '잘못된 단어 ID입니다.' },
        { status: 400 }
      )
    }

    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id: vocabId },
      include: {
        unit: {
          include: {
            textbook: true,
          },
        },
      },
    })

    if (!vocabulary) {
      return NextResponse.json(
        { error: '단어를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      vocabulary: {
        ...vocabulary,
        meanings: JSON.parse(vocabulary.meanings),
      },
    })
  } catch (error) {
    console.error('Get vocabulary detail error:', error)
    return NextResponse.json(
      { error: '단어 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH /api/vocabulary/[id] - 단어 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vocabId = parseInt(params.id)
    const body = await request.json()
    const {
      word,
      meanings,
      partOfSpeech,
      pronunciation,
      exampleSentence,
      sentenceTranslation,
      problemNumber,
    } = body

    if (isNaN(vocabId)) {
      return NextResponse.json(
        { error: '잘못된 단어 ID입니다.' },
        { status: 400 }
      )
    }

    // 단어 존재 확인
    const existingVocab = await prisma.vocabulary.findUnique({
      where: { id: vocabId },
    })

    if (!existingVocab) {
      return NextResponse.json(
        { error: '단어를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 단어 정보 업데이트
    const updatedVocabulary = await prisma.vocabulary.update({
      where: { id: vocabId },
      data: {
        ...(word && { word: word.trim() }),
        ...(meanings && { meanings: JSON.stringify(meanings) }),
        ...(partOfSpeech !== undefined && { partOfSpeech: partOfSpeech?.trim() || null }),
        ...(pronunciation !== undefined && { pronunciation: pronunciation?.trim() || null }),
        ...(exampleSentence !== undefined && { exampleSentence: exampleSentence?.trim() || null }),
        ...(sentenceTranslation !== undefined && { sentenceTranslation: sentenceTranslation?.trim() || null }),
        ...(problemNumber !== undefined && { problemNumber: problemNumber ? parseInt(problemNumber) : null }),
      },
    })

    return NextResponse.json({
      vocabulary: {
        ...updatedVocabulary,
        meanings: JSON.parse(updatedVocabulary.meanings),
      },
    })
  } catch (error) {
    console.error('Update vocabulary error:', error)
    return NextResponse.json(
      { error: '단어 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/vocabulary/[id] - 단어 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vocabId = parseInt(params.id)

    if (isNaN(vocabId)) {
      return NextResponse.json(
        { error: '잘못된 단어 ID입니다.' },
        { status: 400 }
      )
    }

    // 단어 존재 확인
    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id: vocabId },
    })

    if (!vocabulary) {
      return NextResponse.json(
        { error: '단어를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 단어 삭제
    await prisma.vocabulary.delete({
      where: { id: vocabId },
    })

    return NextResponse.json({ message: '단어가 삭제되었습니다.' })
  } catch (error) {
    console.error('Delete vocabulary error:', error)
    return NextResponse.json(
      { error: '단어 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
