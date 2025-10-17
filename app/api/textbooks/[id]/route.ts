import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - 특정 교재 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const textbook = await prisma.textbook.findUnique({
      where: { id: parseInt(params.id) },
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
      },
    })

    if (!textbook) {
      return NextResponse.json({ error: '교재를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ textbook })
  } catch (error) {
    console.error('Get textbook error:', error)
    return NextResponse.json(
      { error: '교재 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH - 교재 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, description } = await request.json()

    const textbook = await prisma.textbook.update({
      where: { id: parseInt(params.id) },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
      },
    })

    return NextResponse.json({ textbook })
  } catch (error) {
    console.error('Update textbook error:', error)
    return NextResponse.json(
      { error: '교재 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE - 교재 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.textbook.delete({
      where: { id: parseInt(params.id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete textbook error:', error)
    return NextResponse.json(
      { error: '교재 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
