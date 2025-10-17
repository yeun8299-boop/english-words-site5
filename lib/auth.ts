// lib/auth.ts

import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'
import prisma from './prisma'

// 세션 토큰 생성 (간단한 방식)
export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// 관리자 비밀번호 확인
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const admin = await prisma.admin.findFirst()
  if (!admin) return false
  return bcrypt.compare(password, admin.password)
}

// 학습 코드로 학생 찾기
export async function findStudentByLearningCode(code: string) {
  return prisma.user.findUnique({
    where: { learningCode: code },
  })
}

// 세션 쿠키 설정
export async function setSessionCookie(userId: number, role: 'admin' | 'student') {
  const token = generateSessionToken()
  const cookieStore = await cookies()

  cookieStore.set('session', JSON.stringify({ userId, role, token }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7일
  })
}

// 세션 가져오기
export async function getSession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie) return null

  try {
    return JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
}

// 세션 삭제
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

// 현재 사용자 가져오기
export async function getCurrentUser() {
  const session = await getSession()
  if (!session || !session.userId) return null

  if (session.role === 'student') {
    return prisma.user.findUnique({
      where: { id: session.userId },
    })
  }

  return null
}

// 관리자 권한 확인
export async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

// 학생 권한 확인
export async function requireStudent() {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    throw new Error('Unauthorized')
  }
  return session
}
