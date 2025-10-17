import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/textbooks/[id]/units - 특정 교재의 단원 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const textbookId = parseInt(params.id)

    if (isNaN(textbookId)) {
      return NextResponse.json(
        { error: '잘못된 교재 ID입니다.' },
        { status: 400 }
      )
    }

    // 교재 존재 확인
    const textbook = await prisma.textbook.findUnique({
      where: { id: textbookId },
    })

    if (!textbook) {
      return NextResponse.json(
        { error: '교재를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 단원 목록 조회
    const units = await prisma.unit.findMany({
      where: { textbookId },
      include: {
        _count: {
          select: {
            vocabulary: true,
            readingPassages: true,
            assignments: true,
          },
        },
      },
      orderBy: { unitNumber: 'asc' },
    })

    return NextResponse.json({ units, textbook })
  } catch (error) {
    console.error('Get units error:', error)
    return NextResponse.json(
      { error: '단원 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/textbooks/[id]/units - 단원 생성
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const textbookId = parseInt(params.id)
    const body = await request.json()
    const { unitNumber, title, description } = body

    if (isNaN(textbookId)) {
      return NextResponse.json(
        { error: '잘못된 교재 ID입니다.' },
        { status: 400 }
      )
    }

    if (!unitNumber || !title?.trim()) {
      return NextResponse.json(
        { error: '단원 번호와 제목을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 교재 존재 확인
    const textbook = await prisma.textbook.findUnique({
      where: { id: textbookId },
    })

    if (!textbook) {
      return NextResponse.json(
        { error: '교재를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 같은 교재 내 단원 번호 중복 확인
    const existingUnit = await prisma.unit.findFirst({
      where: {
        textbookId,
        unitNumber: parseInt(unitNumber),
      },
    })

    if (existingUnit) {
      return NextResponse.json(
        { error: '이미 존재하는 단원 번호입니다.' },
        { status: 409 }
      )
    }

    // 단원 생성
    const unit = await prisma.unit.create({
      data: {
        textbookId,
        unitNumber: parseInt(unitNumber),
        title: title.trim(),
        description: description?.trim() || null,
      },
    })

    return NextResponse.json({ unit }, { status: 201 })
  } catch (error) {
    console.error('Create unit error:', error)
    return NextResponse.json(
      { error: '단원 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
