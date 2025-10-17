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

  const student2 = await prisma.user.upsert({
    where: { learningCode: '0218' },
    update: {},
    create: {
      name: '이영희',
      learningCode: '0218',
      level: 4,
      totalPoints: 980,
      currentStreak: 14,
      longestStreak: 20,
    },
  })
  console.log('✅ Student created:', student2.name)

  // 샘플 교재 생성
  const textbook = await prisma.textbook.create({
    data: {
      title: '모의고사 1회',
      description: '2024년 1학기 모의고사',
      units: {
        create: [
          {
            unitNumber: 1,
            title: 'Unit 1: Basic Vocabulary',
            description: '기본 어휘 120개',
            vocabulary: {
              create: [
                {
                  word: 'abandon',
                  meanings: JSON.stringify(['버리다', '포기하다']),
                  problemNumber: 1,
                  exampleSentence: "Don't abandon your dreams.",
                  sentenceTranslation: '당신의 꿈을 포기하지 마세요.',
                },
                {
                  word: 'ability',
                  meanings: JSON.stringify(['능력', '재능']),
                  problemNumber: 1,
                  exampleSentence: 'She has the ability to succeed.',
                  sentenceTranslation: '그녀는 성공할 능력이 있습니다.',
                },
                {
                  word: 'accomplish',
                  meanings: JSON.stringify(['성취하다', '이루다']),
                  problemNumber: 1,
                  exampleSentence: 'He accomplished his goal.',
                  sentenceTranslation: '그는 목표를 달성했습니다.',
                },
              ],
            },
          },
          {
            unitNumber: 2,
            title: 'Unit 2: Advanced Vocabulary',
            description: '심화 어휘 100개',
          },
        ],
      },
    },
  })
  console.log('✅ Textbook created:', textbook.title)

  // 샘플 독해 지문 생성
  const unit1 = await prisma.unit.findFirst({
    where: { textbookId: textbook.id, unitNumber: 1 },
  })

  if (unit1) {
    const passage = await prisma.readingPassage.create({
      data: {
        unitId: unit1.id,
        problemNumber: 1,
        title: 'The Importance of Personal Hygiene',
        fullText: 'Thanks to germ theory, we know that maintaining good personal hygiene is important to our health.',
        lines: JSON.stringify([
          {
            lineIndex: 0,
            english: 'Thanks to germ theory, / we know',
            korean: '세균 이론 덕분에, / 우리는 안다',
          },
          {
            lineIndex: 1,
            english: 'that maintaining good personal hygiene / is important to our health.',
            korean: '좋은 개인 위생을 유지하는 것이 / 우리의 건강에 중요하다는 것을.',
          },
        ]),
      },
    })
    console.log('✅ Reading passage created:', passage.title)
  }

  // 샘플 과제 생성
  if (student1 && unit1) {
    const assignment = await prisma.assignment.create({
      data: {
        studentId: student1.id,
        textbookId: textbook.id,
        unitId: unit1.id,
        assignmentType: 'both',
        vocabularyItems: JSON.stringify({ all: true }),
        readingPassageIds: JSON.stringify([1]),
        status: 'assigned',
      },
    })
    console.log('✅ Assignment created for:', student1.name)
  }

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
