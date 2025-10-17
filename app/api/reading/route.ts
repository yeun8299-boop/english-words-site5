import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/reading?unitId=1 - 특정 단원의 독해 지문 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unitId')

    if (!unitId) {
      return NextResponse.json(
        { error: '단원 ID를 지정해주세요.' },
        { status: 400 }
      )
    }

    const passages = await prisma.readingPassage.findMany({
      where: { unitId: parseInt(unitId) },
      orderBy: { problemNumber: 'asc' },
    })

    // JSON 문자열을 배열로 파싱
    const parsedPassages = passages.map((p) => ({
      ...p,
      lines: JSON.parse(p.lines),
    }))

    return NextResponse.json({ passages: parsedPassages })
  } catch (error) {
    console.error('Get reading passages error:', error)
    return NextResponse.json(
      { error: '독해 지문 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/reading - 독해 지문 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { unitId, problemNumber, title, fullText, lines } = body

    if (!unitId || !problemNumber || !fullText || !lines || lines.length === 0) {
      return NextResponse.json(
        { error: '필수 항목(단원, 문제 번호, 텍스트, 라인)을 입력해주세요.' },
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

    // 같은 단원 내 문제 번호 중복 확인
    const existingPassage = await prisma.readingPassage.findFirst({
      where: {
        unitId: parseInt(unitId),
        problemNumber: parseInt(problemNumber),
      },
    })

    if (existingPassage) {
      return NextResponse.json(
        { error: '이미 존재하는 문제 번호입니다.' },
        { status: 409 }
      )
    }

    // 독해 지문 생성
    const passage = await prisma.readingPassage.create({
      data: {
        unitId: parseInt(unitId),
        problemNumber: parseInt(problemNumber),
        title: title?.trim() || null,
        fullText: fullText.trim(),
        lines: JSON.stringify(lines),
      },
    })

    return NextResponse.json({
      passage: {
        ...passage,
        lines: JSON.parse(passage.lines),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create reading passage error:', error)
    return NextResponse.json(
      { error: '독해 지문 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
