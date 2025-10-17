import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/assignments/[id] - 과제 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = parseInt(params.id)

    if (isNaN(assignmentId)) {
      return NextResponse.json(
        { error: '잘못된 과제 ID입니다.' },
        { status: 400 }
      )
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            learningCode: true,
            level: true,
          },
        },
        textbook: true,
        unit: {
          include: {
            vocabulary: true,
            readingPassages: true,
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: '과제를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // JSON 파싱
    const parsedAssignment = {
      ...assignment,
      vocabularyItems: assignment.vocabularyItems
        ? JSON.parse(assignment.vocabularyItems)
        : null,
      readingPassageIds: assignment.readingPassageIds
        ? JSON.parse(assignment.readingPassageIds)
        : null,
    }

    return NextResponse.json({ assignment: parsedAssignment })
  } catch (error) {
    console.error('Get assignment detail error:', error)
    return NextResponse.json(
      { error: '과제 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH /api/assignments/[id] - 과제 상태 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = parseInt(params.id)
    const body = await request.json()
    const { status, dueDate } = body

    if (isNaN(assignmentId)) {
      return NextResponse.json(
        { error: '잘못된 과제 ID입니다.' },
        { status: 400 }
      )
    }

    // 과제 존재 확인
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    })

    if (!existingAssignment) {
      return NextResponse.json(
        { error: '과제를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상태 검증
    if (status && !['assigned', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: '올바른 상태 값이 아닙니다.' },
        { status: 400 }
      )
    }

    // 과제 업데이트
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(status && { status }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    })

    return NextResponse.json({
      assignment: {
        ...updatedAssignment,
        vocabularyItems: updatedAssignment.vocabularyItems
          ? JSON.parse(updatedAssignment.vocabularyItems)
          : null,
        readingPassageIds: updatedAssignment.readingPassageIds
          ? JSON.parse(updatedAssignment.readingPassageIds)
          : null,
      },
    })
  } catch (error) {
    console.error('Update assignment error:', error)
    return NextResponse.json(
      { error: '과제 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/assignments/[id] - 과제 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = parseInt(params.id)

    if (isNaN(assignmentId)) {
      return NextResponse.json(
        { error: '잘못된 과제 ID입니다.' },
        { status: 400 }
      )
    }

    // 과제 존재 확인
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: '과제를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 과제 삭제
    await prisma.assignment.delete({
      where: { id: assignmentId },
    })

    return NextResponse.json({ message: '과제가 삭제되었습니다.' })
  } catch (error) {
    console.error('Delete assignment error:', error)
    return NextResponse.json(
      { error: '과제 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
