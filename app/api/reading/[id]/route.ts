import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/reading/[id] - 독해 지문 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const passageId = parseInt(params.id)

    if (isNaN(passageId)) {
      return NextResponse.json(
        { error: '잘못된 독해 지문 ID입니다.' },
        { status: 400 }
      )
    }

    const passage = await prisma.readingPassage.findUnique({
      where: { id: passageId },
      include: {
        unit: {
          include: {
            textbook: true,
          },
        },
      },
    })

    if (!passage) {
      return NextResponse.json(
        { error: '독해 지문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      passage: {
        ...passage,
        lines: JSON.parse(passage.lines),
      },
    })
  } catch (error) {
    console.error('Get reading passage detail error:', error)
    return NextResponse.json(
      { error: '독해 지문 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH /api/reading/[id] - 독해 지문 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const passageId = parseInt(params.id)
    const body = await request.json()
    const { problemNumber, title, fullText, lines } = body

    if (isNaN(passageId)) {
      return NextResponse.json(
        { error: '잘못된 독해 지문 ID입니다.' },
        { status: 400 }
      )
    }

    // 독해 지문 존재 확인
    const existingPassage = await prisma.readingPassage.findUnique({
      where: { id: passageId },
    })

    if (!existingPassage) {
      return NextResponse.json(
        { error: '독해 지문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 문제 번호 변경 시 중복 확인
    if (problemNumber && problemNumber !== existingPassage.problemNumber) {
      const duplicatePassage = await prisma.readingPassage.findFirst({
        where: {
          unitId: existingPassage.unitId,
          problemNumber: parseInt(problemNumber),
          id: { not: passageId },
        },
      })

      if (duplicatePassage) {
        return NextResponse.json(
          { error: '이미 존재하는 문제 번호입니다.' },
          { status: 409 }
        )
      }
    }

    // 독해 지문 정보 업데이트
    const updatedPassage = await prisma.readingPassage.update({
      where: { id: passageId },
      data: {
        ...(problemNumber && { problemNumber: parseInt(problemNumber) }),
        ...(title !== undefined && { title: title?.trim() || null }),
        ...(fullText && { fullText: fullText.trim() }),
        ...(lines && { lines: JSON.stringify(lines) }),
      },
    })

    return NextResponse.json({
      passage: {
        ...updatedPassage,
        lines: JSON.parse(updatedPassage.lines),
      },
    })
  } catch (error) {
    console.error('Update reading passage error:', error)
    return NextResponse.json(
      { error: '독해 지문 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/reading/[id] - 독해 지문 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const passageId = parseInt(params.id)

    if (isNaN(passageId)) {
      return NextResponse.json(
        { error: '잘못된 독해 지문 ID입니다.' },
        { status: 400 }
      )
    }

    // 독해 지문 존재 확인
    const passage = await prisma.readingPassage.findUnique({
      where: { id: passageId },
    })

    if (!passage) {
      return NextResponse.json(
        { error: '독해 지문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 독해 지문 삭제
    await prisma.readingPassage.delete({
      where: { id: passageId },
    })

    return NextResponse.json({ message: '독해 지문이 삭제되었습니다.' })
  } catch (error) {
    console.error('Delete reading passage error:', error)
    return NextResponse.json(
      { error: '독해 지문 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
