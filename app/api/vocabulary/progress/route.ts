import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { studentId, vocabularyId, status } = await request.json()

    if (!studentId || !vocabularyId || !status) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 학습 진도 업데이트 또는 생성
    const progress = await prisma.vocabularyProgress.upsert({
      where: {
        studentId_vocabularyId: {
          studentId: parseInt(studentId),
          vocabularyId: parseInt(vocabularyId),
        },
      },
      update: {
        status,
        studyCount: {
          increment: 1,
        },
        lastStudiedAt: new Date(),
      },
      create: {
        studentId: parseInt(studentId),
        vocabularyId: parseInt(vocabularyId),
        status,
        studyCount: 1,
        lastStudiedAt: new Date(),
      },
    })

    // 포인트 부여
    const pointsEarned = status === 'mastered' ? 5 : 2

    // 사용자 포인트 업데이트
    await prisma.user.update({
      where: { id: parseInt(studentId) },
      data: {
        totalPoints: {
          increment: pointsEarned,
        },
      },
    })

    // 학습 로그 기록
    await prisma.learningLog.create({
      data: {
        studentId: parseInt(studentId),
        activityType: status === 'mastered' ? 'word_mastered' : 'word_review',
        pointsEarned,
        metadata: JSON.stringify({
          vocabularyId,
          status,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      progress,
      pointsEarned,
    })
  } catch (error) {
    console.error('Vocabulary progress error:', error)
    return NextResponse.json(
      { error: '학습 진도 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 학생의 학습 진도 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')
    const vocabularyId = searchParams.get('vocabularyId')

    if (!studentId) {
      return NextResponse.json(
        { error: '학생 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 특정 단어의 진도 조회
    if (vocabularyId) {
      const progress = await prisma.vocabularyProgress.findUnique({
        where: {
          studentId_vocabularyId: {
            studentId: parseInt(studentId),
            vocabularyId: parseInt(vocabularyId),
          },
        },
      })

      return NextResponse.json({ progress })
    }

    // 전체 진도 조회
    const allProgress = await prisma.vocabularyProgress.findMany({
      where: {
        studentId: parseInt(studentId),
      },
      include: {
        vocabulary: true,
      },
    })

    return NextResponse.json({ progress: allProgress })
  } catch (error) {
    console.error('Get progress error:', error)
    return NextResponse.json(
      { error: '학습 진도 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
