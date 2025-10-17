import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/assignments - 과제 목록 조회 (학생별 또는 전체)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    const where = studentId ? { studentId: parseInt(studentId) } : {}

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            learningCode: true,
          },
        },
        textbook: {
          select: {
            id: true,
            title: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // JSON 문자열 파싱
    const parsedAssignments = assignments.map((a) => ({
      ...a,
      vocabularyItems: a.vocabularyItems ? JSON.parse(a.vocabularyItems) : null,
      readingPassageIds: a.readingPassageIds ? JSON.parse(a.readingPassageIds) : null,
    }))

    return NextResponse.json({ assignments: parsedAssignments })
  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json(
      { error: '과제 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/assignments - 과제 생성 (배치 생성 지원)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentIds, // 배치 할당을 위한 학생 ID 배열
      textbookId,
      unitId,
      assignmentType,
      vocabularyItems,
      readingPassageIds,
      dueDate,
    } = body

    // 필수 필드 검증
    if (!studentIds || studentIds.length === 0) {
      return NextResponse.json(
        { error: '학생을 선택해주세요.' },
        { status: 400 }
      )
    }

    if (!textbookId || !unitId) {
      return NextResponse.json(
        { error: '교재와 단원을 선택해주세요.' },
        { status: 400 }
      )
    }

    if (!assignmentType || !['vocabulary', 'reading', 'both'].includes(assignmentType)) {
      return NextResponse.json(
        { error: '과제 유형을 올바르게 선택해주세요.' },
        { status: 400 }
      )
    }

    // 과제 유형별 검증
    if (assignmentType === 'vocabulary' || assignmentType === 'both') {
      if (!vocabularyItems) {
        return NextResponse.json(
          { error: '단어 과제 내용을 선택해주세요.' },
          { status: 400 }
        )
      }
    }

    if (assignmentType === 'reading' || assignmentType === 'both') {
      if (!readingPassageIds || readingPassageIds.length === 0) {
        return NextResponse.json(
          { error: '독해 지문을 선택해주세요.' },
          { status: 400 }
        )
      }
    }

    // 배치 생성 (각 학생에게 동일한 과제 할당)
    const createdAssignments = await Promise.all(
      studentIds.map((studentId: number) =>
        prisma.assignment.create({
          data: {
            studentId,
            textbookId: parseInt(textbookId),
            unitId: parseInt(unitId),
            assignmentType,
            vocabularyItems: vocabularyItems ? JSON.stringify(vocabularyItems) : null,
            readingPassageIds: readingPassageIds ? JSON.stringify(readingPassageIds) : null,
            dueDate: dueDate ? new Date(dueDate) : null,
            status: 'assigned',
          },
          include: {
            student: {
              select: {
                name: true,
              },
            },
          },
        })
      )
    )

    return NextResponse.json({
      message: `${createdAssignments.length}명의 학생에게 과제가 할당되었습니다.`,
      count: createdAssignments.length,
      assignments: createdAssignments,
    }, { status: 201 })
  } catch (error) {
    console.error('Create assignment error:', error)
    return NextResponse.json(
      { error: '과제 할당 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
