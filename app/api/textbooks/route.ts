import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - 모든 교재 조회
export async function GET() {
  try {
    const textbooks = await prisma.textbook.findMany({
      include: {
        units: {
          include: {
            _count: {
              select: {
                vocabulary: true,
                readingPassages: true,
              },
            },
          },
          orderBy: {
            unitNumber: 'asc',
          },
        },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ textbooks })
  } catch (error) {
    console.error('Get textbooks error:', error)
    return NextResponse.json(
      { error: '교재 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST - 새 교재 생성
export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json()

    if (!title) {
      return NextResponse.json({ error: '교재 제목은 필수입니다.' }, { status: 400 })
    }

    const textbook = await prisma.textbook.create({
      data: {
        title,
        description: description || null,
      },
    })

    return NextResponse.json({ textbook }, { status: 201 })
  } catch (error) {
    console.error('Create textbook error:', error)
    return NextResponse.json(
      { error: '교재 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
