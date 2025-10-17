import { NextRequest, NextResponse } from 'next/server'
import { findStudentByLearningCode, setSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { learningCode } = await request.json()

    if (!learningCode) {
      return NextResponse.json(
        { error: '학습 코드를 입력해주세요.' },
        { status: 400 }
      )
    }

    const student = await findStudentByLearningCode(learningCode)

    if (!student) {
      return NextResponse.json(
        { error: '학습 코드가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 세션 설정
    await setSessionCookie(student.id, 'student')

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        level: student.level,
      },
    })
  } catch (error) {
    console.error('Student login error:', error)
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
