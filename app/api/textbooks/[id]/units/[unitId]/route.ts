import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/textbooks/[id]/units/[unitId] - 단원 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const unitId = parseInt(params.unitId)

    if (isNaN(unitId)) {
      return NextResponse.json(
        { error: '잘못된 단원 ID입니다.' },
        { status: 400 }
      )
    }

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        textbook: true,
        vocabulary: {
          orderBy: { problemNumber: 'asc' },
        },
        readingPassages: {
          orderBy: { problemNumber: 'asc' },
        },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    })

    if (!unit) {
      return NextResponse.json(
        { error: '단원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ unit })
  } catch (error) {
    console.error('Get unit detail error:', error)
    return NextResponse.json(
      { error: '단원 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH /api/textbooks/[id]/units/[unitId] - 단원 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const unitId = parseInt(params.unitId)
    const body = await request.json()
    const { unitNumber, title, description } = body

    if (isNaN(unitId)) {
      return NextResponse.json(
        { error: '잘못된 단원 ID입니다.' },
        { status: 400 }
      )
    }

    // 단원 존재 확인
    const existingUnit = await prisma.unit.findUnique({
      where: { id: unitId },
    })

    if (!existingUnit) {
      return NextResponse.json(
        { error: '단원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 단원 번호 변경 시 중복 확인
    if (unitNumber && unitNumber !== existingUnit.unitNumber) {
      const duplicateUnit = await prisma.unit.findFirst({
        where: {
          textbookId: existingUnit.textbookId,
          unitNumber: parseInt(unitNumber),
          id: { not: unitId },
        },
      })

      if (duplicateUnit) {
        return NextResponse.json(
          { error: '이미 존재하는 단원 번호입니다.' },
          { status: 409 }
        )
      }
    }

    // 단원 정보 업데이트
    const updatedUnit = await prisma.unit.update({
      where: { id: unitId },
      data: {
        ...(unitNumber && { unitNumber: parseInt(unitNumber) }),
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    })

    return NextResponse.json({ unit: updatedUnit })
  } catch (error) {
    console.error('Update unit error:', error)
    return NextResponse.json(
      { error: '단원 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/textbooks/[id]/units/[unitId] - 단원 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; unitId: string } }
) {
  try {
    const unitId = parseInt(params.unitId)

    if (isNaN(unitId)) {
      return NextResponse.json(
        { error: '잘못된 단원 ID입니다.' },
        { status: 400 }
      )
    }

    // 단원 존재 확인
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        _count: {
          select: {
            vocabulary: true,
            readingPassages: true,
          },
        },
      },
    })

    if (!unit) {
      return NextResponse.json(
        { error: '단원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 단원 삭제 (cascade로 관련 데이터 모두 삭제)
    await prisma.unit.delete({
      where: { id: unitId },
    })

    return NextResponse.json({
      message: '단원이 삭제되었습니다.',
      deletedCount: {
        vocabulary: unit._count.vocabulary,
        readingPassages: unit._count.readingPassages,
      },
    })
  } catch (error) {
    console.error('Delete unit error:', error)
    return NextResponse.json(
      { error: '단원 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
