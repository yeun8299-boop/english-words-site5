import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const {
      studentId,
      quizType,
      score,
      totalQuestions,
      correctAnswers,
      comboMax,
      timeTaken,
      pointsEarned,
      unitId,
    } = await request.json()

    if (!studentId || !quizType || score === undefined || !totalQuestions) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 퀴즈 결과 저장
    const quizResult = await prisma.quizResult.create({
      data: {
        studentId: parseInt(studentId),
        unitId: unitId ? parseInt(unitId) : 1, // TODO: 실제 과제의 unitId 사용
        quizType,
        score: parseInt(score),
        totalQuestions: parseInt(totalQuestions),
        correctAnswers: parseInt(correctAnswers),
        comboMax: comboMax || 0,
        timeTaken: timeTaken || 0,
        pointsEarned: pointsEarned || 0,
      },
    })

    // 사용자 포인트 업데이트
    await prisma.user.update({
      where: { id: parseInt(studentId) },
      data: {
        totalPoints: {
          increment: pointsEarned || 0,
        },
      },
    })

    // 학습 로그 기록
    await prisma.learningLog.create({
      data: {
        studentId: parseInt(studentId),
        activityType: `quiz_${quizType}`,
        pointsEarned: pointsEarned || 0,
        metadata: JSON.stringify({
          score,
          totalQuestions,
          correctAnswers,
          comboMax,
          timeTaken,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      quizResult,
    })
  } catch (error) {
    console.error('Quiz result error:', error)
    return NextResponse.json(
      { error: '퀴즈 결과 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 학생의 퀴즈 기록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')
    const quizType = searchParams.get('quizType')

    if (!studentId) {
      return NextResponse.json(
        { error: '학생 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const whereClause: any = {
      studentId: parseInt(studentId),
    }

    if (quizType) {
      whereClause.quizType = quizType
    }

    const quizResults = await prisma.quizResult.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // 최근 10개
    })

    return NextResponse.json({ quizResults })
  } catch (error) {
    console.error('Get quiz results error:', error)
    return NextResponse.json(
      { error: '퀴즈 기록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
