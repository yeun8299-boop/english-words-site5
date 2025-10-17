import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/students - 학생 목록 조회
export async function GET(request: NextRequest) {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: 'student',
      },
      select: {
        id: true,
        name: true,
        learningCode: true,
        level: true,
        totalPoints: true,
        currentStreak: true,
        longestStreak: true,
        createdAt: true,
        _count: {
          select: {
            assignments: true,
            vocabularyProgress: true,
            quizResults: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json(
      { error: '학생 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/students - 학생 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, learningCode } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: '학생 이름을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!learningCode?.trim()) {
      return NextResponse.json(
        { error: '학습 코드를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 학습 코드 길이 검증 (4-8자리)
    if (learningCode.length < 4 || learningCode.length > 8) {
      return NextResponse.json(
        { error: '학습 코드는 4-8자리여야 합니다.' },
        { status: 400 }
      )
    }

    // 학습 코드 중복 검사
    const existingStudent = await prisma.user.findUnique({
      where: { learningCode },
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: '이미 사용 중인 학습 코드입니다.' },
        { status: 409 }
      )
    }

    // 학생 생성
    const student = await prisma.user.create({
      data: {
        name: name.trim(),
        learningCode: learningCode.trim(),
        role: 'student',
        level: 1,
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
      },
    })

    return NextResponse.json({ student }, { status: 201 })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json(
      { error: '학생 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
