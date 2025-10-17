// types/index.ts

// ============================================
// Database Models (Prisma에서 생성된 타입과 매칭)
// ============================================

export interface User {
  id: number
  name: string
  learningCode: string
  role: string
  level: number
  totalPoints: number
  currentStreak: number
  longestStreak: number
  createdAt: Date
}

export interface Textbook {
  id: number
  title: string
  description: string | null
  createdAt: Date
}

export interface Unit {
  id: number
  textbookId: number
  unitNumber: number
  title: string
  description: string | null
}

export interface Vocabulary {
  id: number
  unitId: number
  problemNumber: number | null
  word: string
  meanings: string[] // JSON array
  partOfSpeech: string | null
  pronunciation: string | null
  exampleSentence: string | null
  sentenceTranslation: string | null
  audioUrl: string | null
}

export interface ReadingPassage {
  id: number
  unitId: number
  problemNumber: number
  title: string | null
  fullText: string
  lines: ReadingLine[]
  createdAt: Date
}

export interface ReadingLine {
  lineIndex: number
  english: string
  korean: string
}

// ============================================
// Assignment Types
// ============================================

export type AssignmentType = 'vocabulary' | 'reading' | 'both'
export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed'

export interface VocabularyAssignment {
  all?: boolean
  problem_numbers?: number[]
  word_ids?: number[]
}

export interface Assignment {
  id: number
  studentId: number
  textbookId: number
  unitId: number
  assignmentType: AssignmentType
  vocabularyItems: VocabularyAssignment | null
  readingPassageIds: number[] | null
  dueDate: Date | null
  status: AssignmentStatus
  createdAt: Date
}

// ============================================
// Progress & Learning Types
// ============================================

export type VocabularyStatus = 'learning' | 'mastered'

export interface VocabularyProgress {
  id: number
  studentId: number
  vocabularyId: number
  status: VocabularyStatus
  isBookmarked: boolean
  studyCount: number
  lastStudiedAt: Date
}

export type QuizType = 'speed' | 'subjective' | 'sentence'

export interface QuizResult {
  id: number
  studentId: number
  unitId: number
  quizType: QuizType
  score: number
  totalQuestions: number
  correctAnswers: number
  comboMax: number
  timeTaken: number // seconds
  pointsEarned: number
  createdAt: Date
}

// ============================================
// Reading Answer Versions
// ============================================

export type AnswerType = 'first_attempt' | 'revision' | 'retry'

export interface TranslationEntry {
  lineIndex: number
  english: string
  studentTranslation: string
}

export interface AnswerVersion {
  version: number
  translations: TranslationEntry[]
  submittedAt: string
  timeSpent: number // seconds
  type: AnswerType
}

export interface ReadingAnswer {
  id: number
  studentId: number
  passageId: number
  versions: AnswerVersion[]
  currentVersion: number
  totalAttempts: number
  createdAt: Date
  lastModifiedAt: Date
}

// ============================================
// Gamification Types
// ============================================

export interface Achievement {
  id: number
  studentId: number
  badgeType: string
  badgeName: string
  earnedAt: Date
}

export interface LearningLog {
  id: number
  studentId: number
  activityType: string
  pointsEarned: number
  metadata: Record<string, any> | null
  createdAt: Date
}

export interface DailyStreak {
  id: number
  studentId: number
  date: Date
  studyTime: number // seconds
  pointsEarned: number
  activitiesCompleted: number
}

// ============================================
// UI Component Props Types
// ============================================

export interface TextbookWithUnits extends Textbook {
  units: Unit[]
}

export interface UnitWithContent extends Unit {
  vocabulary: Vocabulary[]
  readingPassages: ReadingPassage[]
  textbook: Textbook
}

export interface VocabularyWithProgress extends Vocabulary {
  progress?: VocabularyProgress
}

export interface StudentWithStats extends User {
  vocabularyProgress: VocabularyProgress[]
  quizResults: QuizResult[]
  readingAnswers: ReadingAnswer[]
  achievements: Achievement[]
  dailyStreaks: DailyStreak[]
}

// ============================================
// Form & Input Types
// ============================================

export interface AdminLoginForm {
  password: string
}

export interface StudentLoginForm {
  learningCode: string
}

export interface CreateTextbookForm {
  title: string
  description?: string
}

export interface CreateUnitForm {
  textbookId: number
  unitNumber: number
  title: string
  description?: string
}

export interface CreateVocabularyForm {
  unitId: number
  problemNumber?: number
  word: string
  meanings: string[]
  partOfSpeech?: string
  pronunciation?: string
  exampleSentence?: string
  sentenceTranslation?: string
}

export interface CreateStudentForm {
  name: string
  learningCode: string
}

export interface CSVVocabularyRow {
  word: string
  meaning: string
  example_sentence?: string
  sentence_translation?: string
  problem_number?: string
  textbook?: string
  unit?: string
}

export interface CreateAssignmentForm {
  studentIds: number[]
  textbookId: number
  unitId: number
  assignmentType: AssignmentType
  vocabularyItems?: VocabularyAssignment
  readingPassageIds?: number[]
  dueDate?: Date
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface LoginResponse {
  success: boolean
  student?: {
    id: number
    name: string
    level: number
  }
}

export interface DashboardMetrics {
  today: {
    totalStudents: number
    assignmentCompletion: number // percentage
    activeStudents: number
  }
  weekly: {
    completionRate: number
    averageStudyTime: number // minutes
    averageStreak: number
    totalWordsStudied: number
  }
  byActivityType: {
    vocabulary: number
    speedQuiz: number
    subjectiveTest: number
    reading: number
  }
  alerts: {
    inactiveStudents: User[]
  }
  topPerformers: User[]
}

// ============================================
// Utility Types
// ============================================

export type WithId<T> = T & { id: number }
export type WithTimestamps<T> = T & { createdAt: Date; updatedAt?: Date }
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
