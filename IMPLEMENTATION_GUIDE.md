# VocabQuest 구현 가이드 (초보자용)

> 💡 **이 가이드는 코딩 입문자를 위해 작성되었습니다.**
> 각 단계마다 복사-붙여넣기 가능한 코드와 상세한 설명이 포함되어 있습니다.

---

## 📋 목차

1. [필수 프로그램 설치](#1-필수-프로그램-설치)
2. [프로젝트 초기 설정](#2-프로젝트-초기-설정)
3. [데이터베이스 설계](#3-데이터베이스-설계)
4. [인증 시스템 구현](#4-인증-시스템-구현)
5. [관리자 기능 구현](#5-관리자-기능-구현)
6. [학생 학습 기능 구현](#6-학생-학습-기능-구현)
7. [게이미피케이션 시스템](#7-게이미피케이션-시스템)
8. [독해 연습 기능](#8-독해-연습-기능)
9. [배포하기](#9-배포하기)

---

## 1. 필수 프로그램 설치

### 1.1 Node.js 설치
1. https://nodejs.org 접속
2. **LTS 버전** (왼쪽 초록색 버튼) 다운로드
3. 설치 프로그램 실행 (모든 옵션 기본값으로 진행)

**확인 방법:**
```bash
node --version
# v20.x.x 같은 버전이 나오면 성공
```

### 1.2 VS Code 설치
1. https://code.visualstudio.com 접속
2. Download 버튼 클릭
3. 설치 후 실행

**추천 확장 프로그램:**
- ES7+ React/Redux/React-Native snippets
- Prisma
- Tailwind CSS IntelliSense
- ESLint
- Prettier

### 1.3 Git 설치
1. https://git-scm.com 접속
2. Download 버튼 클릭
3. 설치 (모든 옵션 기본값)

---

## 2. 프로젝트 초기 설정

### 2.1 Next.js 프로젝트 생성

터미널(명령 프롬프트)을 열고:

```bash
# 프로젝트 폴더로 이동 (예: C:\Users\user\working)
cd C:\Users\user\working

# Next.js 프로젝트 생성
npx create-next-app@14 vocabquest

# 설정 질문에 다음과 같이 답변:
# ✔ Would you like to use TypeScript? … Yes
# ✔ Would you like to use ESLint? … Yes
# ✔ Would you like to use Tailwind CSS? … Yes
# ✔ Would you like to use `src/` directory? … No
# ✔ Would you like to use App Router? … Yes
# ✔ Would you like to customize the default import alias? … No

# 프로젝트 폴더로 이동
cd vocabquest
```

### 2.2 필요한 패키지 설치

```bash
# 데이터베이스 관련
npm install @prisma/client
npm install -D prisma

# 상태 관리
npm install zustand

# 폼 관리
npm install react-hook-form

# 애니메이션
npm install framer-motion

# 아이콘
npm install lucide-react

# CSV 파싱
npm install papaparse
npm install -D @types/papaparse

# 인증 (비밀번호 암호화)
npm install bcrypt
npm install -D @types/bcrypt

# 날짜 처리
npm install date-fns
```

### 2.3 프로젝트 폴더 구조 만들기

```bash
# Windows 명령 프롬프트에서:
mkdir app\(admin)
mkdir app\(admin)\login
mkdir app\(admin)\dashboard
mkdir app\(admin)\textbooks
mkdir app\(admin)\students
mkdir app\(admin)\assignments

mkdir app\(student)
mkdir app\(student)\login
mkdir app\(student)\dashboard
mkdir app\(student)\vocabulary
mkdir app\(student)\reading

mkdir app\api\auth\admin
mkdir app\api\auth\student
mkdir app\api\vocabulary
mkdir app\api\reading
mkdir app\api\assignments
mkdir app\api\dashboard

mkdir components\admin
mkdir components\student
mkdir components\shared

mkdir lib
mkdir types
mkdir prisma
```

### 2.4 VS Code로 프로젝트 열기

```bash
code .
```

---

## 3. 데이터베이스 설계

### 3.1 Prisma 초기화

터미널에서:

```bash
npx prisma init
```

이 명령어는 다음 파일들을 생성합니다:
- `prisma/schema.prisma` (데이터베이스 스키마)
- `.env` (환경 변수 파일)

### 3.2 Prisma 스키마 작성

`prisma/schema.prisma` 파일을 열고 **전체 내용을 삭제**한 후 아래 내용으로 교체:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 관리자
model Admin {
  id        Int      @id @default(autoincrement())
  password  String   // bcrypt 해시
  createdAt DateTime @default(now())
}

// 사용자 (학생)
model User {
  id            Int      @id @default(autoincrement())
  name          String
  learningCode  String   @unique // 학습 코드 (예: "0115", "2024001")
  role          String   @default("student")
  level         Int      @default(1)
  totalPoints   Int      @default(0)
  currentStreak Int      @default(0)
  longestStreak Int      @default(0)
  createdAt     DateTime @default(now())

  // Relations
  vocabularyProgress VocabularyProgress[]
  quizResults        QuizResult[]
  readingAnswers     ReadingAnswer[]
  achievements       Achievement[]
  learningLogs       LearningLog[]
  dailyStreaks       DailyStreak[]
  assignments        Assignment[]

  @@map("users")
}

// 교재
model Textbook {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  createdAt   DateTime @default(now())

  // Relations
  units       Unit[]
  assignments Assignment[]

  @@map("textbooks")
}

// 단원
model Unit {
  id          Int    @id @default(autoincrement())
  textbookId  Int
  unitNumber  Int
  title       String
  description String?

  // Relations
  textbook        Textbook          @relation(fields: [textbookId], references: [id], onDelete: Cascade)
  vocabulary      Vocabulary[]
  readingPassages ReadingPassage[]
  quizResults     QuizResult[]
  assignments     Assignment[]

  @@map("units")
}

// 단어
model Vocabulary {
  id                   Int     @id @default(autoincrement())
  unitId               Int
  problemNumber        Int?
  word                 String
  meanings             Json    // ["의미1", "의미2"]
  partOfSpeech         String?
  pronunciation        String?
  exampleSentence      String?
  sentenceTranslation  String?
  audioUrl             String?

  // Relations
  unit               Unit                 @relation(fields: [unitId], references: [id], onDelete: Cascade)
  vocabularyProgress VocabularyProgress[]

  @@map("vocabulary")
}

// 독해 지문
model ReadingPassage {
  id            Int      @id @default(autoincrement())
  unitId        Int
  problemNumber Int
  title         String?
  fullText      String   @db.Text
  lines         Json     // [{lineIndex, english, korean}]
  createdAt     DateTime @default(now())

  // Relations
  unit           Unit            @relation(fields: [unitId], references: [id], onDelete: Cascade)
  readingAnswers ReadingAnswer[]

  @@map("reading_passages")
}

// 과제 할당
model Assignment {
  id                  Int      @id @default(autoincrement())
  studentId           Int
  textbookId          Int
  unitId              Int
  assignmentType      String   // "vocabulary" | "reading" | "both"
  vocabularyItems     Json?    // {all: true} | {problem_numbers: [1,2]} | {word_ids: [1,2]}
  readingPassageIds   Json?    // [1, 3, 5]
  dueDate             DateTime?
  status              String   @default("assigned") // "assigned" | "in_progress" | "completed"
  createdAt           DateTime @default(now())

  // Relations
  student  User     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  textbook Textbook @relation(fields: [textbookId], references: [id], onDelete: Cascade)
  unit     Unit     @relation(fields: [unitId], references: [id], onDelete: Cascade)

  @@map("assignments")
}

// 단어 학습 진도
model VocabularyProgress {
  id            Int      @id @default(autoincrement())
  studentId     Int
  vocabularyId  Int
  status        String   @default("learning") // "learning" | "mastered"
  isBookmarked  Boolean  @default(false)
  studyCount    Int      @default(0)
  lastStudiedAt DateTime @default(now())

  // Relations
  student    User       @relation(fields: [studentId], references: [id], onDelete: Cascade)
  vocabulary Vocabulary @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)

  @@unique([studentId, vocabularyId])
  @@map("vocabulary_progress")
}

// 퀴즈 결과
model QuizResult {
  id             Int      @id @default(autoincrement())
  studentId      Int
  unitId         Int
  quizType       String   // "speed" | "subjective" | "sentence"
  score          Int
  totalQuestions Int
  correctAnswers Int
  comboMax       Int      @default(0)
  timeTaken      Int      // seconds
  pointsEarned   Int
  createdAt      DateTime @default(now())

  // Relations
  student User @relation(fields: [studentId], references: [id], onDelete: Cascade)
  unit    Unit @relation(fields: [unitId], references: [id], onDelete: Cascade)

  @@map("quiz_results")
}

// 독해 답안 (버전 관리)
model ReadingAnswer {
  id             Int      @id @default(autoincrement())
  studentId      Int
  passageId      Int
  versions       Json     // [{version, translations, submittedAt, timeSpent, type}]
  currentVersion Int      @default(1)
  totalAttempts  Int      @default(1)
  createdAt      DateTime @default(now())
  lastModifiedAt DateTime @updatedAt

  // Relations
  student User           @relation(fields: [studentId], references: [id], onDelete: Cascade)
  passage ReadingPassage @relation(fields: [passageId], references: [id], onDelete: Cascade)

  @@unique([studentId, passageId])
  @@map("reading_answers")
}

// 배지
model Achievement {
  id        Int      @id @default(autoincrement())
  studentId Int
  badgeType String
  badgeName String
  earnedAt  DateTime @default(now())

  // Relations
  student User @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@map("achievements")
}

// 학습 로그
model LearningLog {
  id           Int      @id @default(autoincrement())
  studentId    Int
  activityType String
  pointsEarned Int
  metadata     Json?
  createdAt    DateTime @default(now())

  // Relations
  student User @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@map("learning_logs")
}

// 일일 학습 기록
model DailyStreak {
  id                  Int      @id @default(autoincrement())
  studentId           Int
  date                DateTime @db.Date
  studyTime           Int      // seconds
  pointsEarned        Int
  activitiesCompleted Int

  // Relations
  student User @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, date])
  @@map("daily_streaks")
}
```

### 3.3 데이터베이스 연결 설정

#### Vercel Postgres 사용 (권장)

1. https://vercel.com 접속 후 회원가입/로그인
2. 새 프로젝트 생성
3. Storage 탭 → Create Database → Postgres 선택
4. `.env.local` 파일 생성 후 연결 정보 복사

`.env.local` 파일:
```env
# Database
DATABASE_URL="postgres://..."

# Session Secret
SESSION_SECRET="your-super-secret-key-change-this-in-production"
```

#### 로컬 개발용 (대안)

로컬에서 개발만 하려면 SQLite 사용:

`prisma/schema.prisma`에서 datasource 부분 수정:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### 3.4 Prisma 클라이언트 생성

```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스에 스키마 적용
npx prisma db push

# Prisma Studio 실행 (데이터베이스 GUI)
npx prisma studio
```

### 3.5 Prisma 클라이언트 싱글톤 생성

`lib/prisma.ts` 파일 생성:

```typescript
// lib/prisma.ts

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 3.6 시드 데이터 생성 (선택사항)

`prisma/seed.ts` 파일 생성:

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 관리자 계정 생성
  const hashedPassword = await bcrypt.hash('admin1234', 10)
  const admin = await prisma.admin.upsert({
    where: { id: 1 },
    update: {},
    create: {
      password: hashedPassword,
    },
  })
  console.log('✅ Admin created:', admin.id)

  // 샘플 학생 생성
  const student1 = await prisma.user.upsert({
    where: { learningCode: '0115' },
    update: {},
    create: {
      name: '김철수',
      learningCode: '0115',
      level: 3,
      totalPoints: 750,
      currentStreak: 7,
      longestStreak: 12,
    },
  })
  console.log('✅ Student created:', student1.name)

  // 샘플 교재 생성
  const textbook = await prisma.textbook.create({
    data: {
      title: '모의고사 1회',
      description: '2024년 1학기 모의고사',
      units: {
        create: [
          {
            unitNumber: 1,
            title: 'Unit 1',
            description: 'Basic Vocabulary',
          },
        ],
      },
    },
  })
  console.log('✅ Textbook created:', textbook.title)

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

`package.json`에 seed 스크립트 추가:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

설치 후 실행:
```bash
npm install -D tsx
npx prisma db seed
```

---

## 4. 인증 시스템 구현

### 4.1 세션 관리 유틸리티

`lib/auth.ts` 파일 생성:

```typescript
// lib/auth.ts

import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'
import { prisma } from './prisma'

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
```

### 4.2 관리자 로그인 페이지

`app/(admin)/login/page.tsx` 파일 생성:

```typescript
// app/(admin)/login/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setError(data.error || '로그인에 실패했습니다.')
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          📚 VocabQuest - 관리자
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              관리자 비밀번호:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

### 4.3 관리자 로그인 API

`app/api/auth/admin/login/route.ts` 파일 생성:

```typescript
// app/api/auth/admin/login/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword, setSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: '비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    const isValid = await verifyAdminPassword(password)

    if (!isValid) {
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 세션 설정 (관리자는 userId를 1로 고정)
    await setSessionCookie(1, 'admin')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
```

### 4.4 학생 로그인 페이지

`app/(student)/login/page.tsx` 파일 생성:

```typescript
// app/(student)/login/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentLoginPage() {
  const [learningCode, setLearningCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learningCode }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setError(data.error || '로그인에 실패했습니다.')
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-800">
          📚 VocabQuest
        </h1>
        <p className="text-center text-gray-600 mb-8">
          학습을 시작하려면 학습 코드를 입력하세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              학습 코드:
            </label>
            <input
              type="text"
              id="code"
              value={learningCode}
              onChange={(e) => setLearningCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl font-bold"
              placeholder="0115"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '로그인 중...' : '학습 시작하기'}
          </button>

          <p className="text-sm text-center text-gray-500">
            💡 학습 코드는 선생님께서 알려주셨어요
          </p>
        </form>
      </div>
    </div>
  )
}
```

### 4.5 학생 로그인 API

`app/api/auth/student/login/route.ts` 파일 생성:

```typescript
// app/api/auth/student/login/route.ts

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
```

### 4.6 로그아웃 API

`app/api/auth/logout/route.ts` 파일 생성:

```typescript
// app/api/auth/logout/route.ts

import { NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'

export async function POST() {
  try {
    await deleteSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
```

---

## 5. 관리자 기능 구현

### 5.1 관리자 대시보드 레이아웃

`app/(admin)/layout.tsx` 파일 생성:

```typescript
// app/(admin)/layout.tsx

import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAdmin()
  } catch {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
```

### 5.2 관리자 네비게이션 컴포넌트

`components/admin/AdminNav.tsx` 파일 생성:

```typescript
// components/admin/AdminNav.tsx

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Users, ClipboardList, BarChart3, LogOut } from 'lucide-react'

export default function AdminNav() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              📚 VocabQuest 관리자
            </Link>

            <div className="hidden md:flex space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <BarChart3 size={20} />
                <span>대시보드</span>
              </Link>

              <Link
                href="/textbooks"
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <BookOpen size={20} />
                <span>교재 관리</span>
              </Link>

              <Link
                href="/students"
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <Users size={20} />
                <span>학생 관리</span>
              </Link>

              <Link
                href="/assignments"
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <ClipboardList size={20} />
                <span>과제 할당</span>
              </Link>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
          >
            <LogOut size={20} />
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
```

이 가이드는 계속됩니다...

---

## 다음 단계

위의 설정을 완료하면:
1. ✅ 프로젝트 초기 설정 완료
2. ✅ 데이터베이스 설계 완료
3. ✅ 인증 시스템 (관리자 + 학생) 완료
4. ✅ 관리자 네비게이션 완료

**테스트 방법:**

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 접속:
# http://localhost:3000/admin/login (관리자)
# http://localhost:3000/login (학생)
```

다음 파일에서 계속됩니다:
- `IMPLEMENTATION_GUIDE_PART2.md` - 교재/단어 관리
- `IMPLEMENTATION_GUIDE_PART3.md` - 학생 학습 기능
- `IMPLEMENTATION_GUIDE_PART4.md` - 게이미피케이션 및 독해
