import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/students/[id] - 학생 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = parseInt(params.id)

    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: '잘못된 학생 ID입니다.' },
        { status: 400 }
      )
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        assignments: {
          include: {
            textbook: true,
            unit: true,
          },
        },
        vocabularyProgress: {
          include: {
            vocabulary: true,
          },
        },
        quizResults: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        achievements: true,
        dailyStreaks: {
          orderBy: {
            date: 'desc',
          },
          take: 7,
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Get student detail error:', error)
    return NextResponse.json(
      { error: '학생 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH /api/students/[id] - 학생 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = parseInt(params.id)
    const body = await request.json()
    const { name, learningCode } = body

    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: '잘못된 학생 ID입니다.' },
        { status: 400 }
      )
    }

    // 학생 존재 확인
    const existingStudent = await prisma.user.findUnique({
      where: { id: studentId },
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 학습 코드 변경 시 중복 검사
    if (learningCode && learningCode !== existingStudent.learningCode) {
      const codeExists = await prisma.user.findUnique({
        where: { learningCode },
      })

      if (codeExists) {
        return NextResponse.json(
          { error: '이미 사용 중인 학습 코드입니다.' },
          { status: 409 }
        )
      }
    }

    // 학생 정보 업데이트
    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: {
        ...(name && { name: name.trim() }),
        ...(learningCode && { learningCode: learningCode.trim() }),
      },
    })

    return NextResponse.json({ student: updatedStudent })
  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json(
      { error: '학생 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/students/[id] - 학생 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = parseInt(params.id)

    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: '잘못된 학생 ID입니다.' },
        { status: 400 }
      )
    }

    // 학생 존재 확인
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 학생 삭제 (cascade로 관련 데이터 모두 삭제)
    await prisma.user.delete({
      where: { id: studentId },
    })

    return NextResponse.json({ message: '학생이 삭제되었습니다.' })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json(
      { error: '학생 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
