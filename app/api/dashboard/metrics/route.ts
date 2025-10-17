import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // 전체 통계
    const [totalStudents, totalTextbooks, totalAssignments, totalVocabulary] = await Promise.all([
      prisma.user.count(),
      prisma.textbook.count(),
      prisma.assignment.count(),
      prisma.vocabulary.count(),
    ])

    // 오늘 날짜 (KST 기준)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 오늘 활동한 학생 수
    const activeToday = await prisma.learningLog.groupBy({
      by: ['studentId'],
      where: {
        createdAt: {
          gte: today,
        },
      },
    })

    // 최근 학습 활동
    const recentActivity = await prisma.learningLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        student: {
          select: {
            name: true,
          },
        },
      },
    })

    // 상위 학생 (포인트 기준)
    const topStudents = await prisma.user.findMany({
      take: 5,
      orderBy: {
        totalPoints: 'desc',
      },
      select: {
        id: true,
        name: true,
        level: true,
        totalPoints: true,
        currentStreak: true,
      },
    })

    // 과제 완료율
    const assignmentStats = await prisma.assignment.groupBy({
      by: ['status'],
      _count: true,
    })

    const completionRate =
      totalAssignments > 0
        ? (
            ((assignmentStats.find((s) => s.status === 'completed')?._count || 0) /
              totalAssignments) *
            100
          ).toFixed(1)
        : '0.0'

    return NextResponse.json({
      overview: {
        totalStudents,
        totalTextbooks,
        totalAssignments,
        totalVocabulary,
        activeTodayCount: activeToday.length,
        completionRate: parseFloat(completionRate),
      },
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        studentName: log.student.name,
        activityType: log.activityType,
        pointsEarned: log.pointsEarned,
        createdAt: log.createdAt,
      })),
      topStudents,
      assignmentStats: {
        assigned: assignmentStats.find((s) => s.status === 'assigned')?._count || 0,
        inProgress: assignmentStats.find((s) => s.status === 'in_progress')?._count || 0,
        completed: assignmentStats.find((s) => s.status === 'completed')?._count || 0,
      },
    })
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    return NextResponse.json(
      { error: '통계 데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
