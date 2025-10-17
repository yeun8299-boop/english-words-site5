# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VocabQuest** - A gamified English vocabulary learning platform for Korean middle and high school students with comprehensive admin management features.

**Tech Stack:**
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Database: Vercel Postgres + Prisma ORM
- Styling: Tailwind CSS
- State Management: Zustand or React Query
- Form Management: React Hook Form
- Animation: Framer Motion
- Icons: Lucide React
- TTS: Web Speech API (Windows native)
- Deployment: Vercel

## Development Commands

### Initial Setup
```bash
npm install
npx prisma generate
npx prisma db push
```

### Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Management
```bash
npx prisma studio                              # Open Prisma Studio GUI
npx prisma migrate dev --name <migration_name> # Create and apply migration
npx prisma migrate deploy                      # Apply migrations (production)
npx prisma db seed                             # Run seed script
npx prisma db push                             # Push schema without migration
```

### CSV/File Processing
```bash
# No specific commands - CSV uploads handled via Next.js API routes
# CSV parsing uses PapaParse library
```

## Core Architecture

### Authentication System (Simplified MVP)

**Admin Authentication:**
- Single password login (no username)
- Password-only entry screen
- Session stored in httpOnly cookie
- Single admin account in database

**Student Authentication:**
- Learning code-based login (4-8 characters)
- Codes can be: student numbers ("0115"), IDs ("2024001"), or custom codes ("KCS001")
- Admin generates and assigns codes during student creation
- No traditional signup flow
- Session persistence via cookies

**Key Design Decision:** Simplified auth to reduce friction for classroom use. Teachers distribute learning codes verbally or via paper.

### Data Model Architecture

**Content Hierarchy:**
```
Textbooks (교재)
  └─ Units (단원)
      ├─ Vocabulary (단어) - with optional problem_number
      └─ ReadingPassages (독해 지문) - with problem_number
```

**Assignment System:**
The `Assignments` table uses a flexible JSON structure:
```typescript
{
  student_id: number
  textbook_id: number
  unit_id: number
  assignment_type: "vocabulary" | "reading" | "both"

  // Vocabulary assignment options (one of):
  vocabulary_items: {
    all: true  // All vocabulary in unit
  } | {
    problem_numbers: [1, 2, 3]  // Specific problems
  } | {
    word_ids: [45, 67, 89]  // Specific words
  }

  // Reading assignment (array of passage IDs)
  reading_passage_ids: [1, 3, 5]  // Selected passages

  due_date: Date | null
  status: "assigned" | "in_progress" | "completed"
}
```

**Multi-Selection Support:**
- Admins can select multiple students (batch assignment)
- Multiple textbooks/units can be assigned simultaneously
- Vocabulary can be assigned by: all words, problem numbers, or individual words
- Reading passages are multi-selectable by problem number
- All selections stored in flexible JSON structures

### Vocabulary System

**Data Structure:**
```typescript
interface Vocabulary {
  id: number
  unit_id: number
  problem_number: number | null  // From textbook problems
  word: string
  meanings: string[]  // JSON array: ["의미1", "의미2"]
  part_of_speech?: string
  pronunciation?: string
  example_sentence?: string
  sentence_translation?: string  // Used for answer validation
  audio_url?: string  // TTS generated
}
```

**Learning States:**
- `learning` (학습 중) - Words student is still learning
- `mastered` (알고 있어요) - Words student has mastered
- `is_bookmarked` - Student can flag difficult words

**CSV Import Formats:**

Basic format:
```csv
word,meaning,example_sentence,sentence_translation
run,달리다, 운영하다,He runs every morning.,그는 매일 아침 달린다.
```

Advanced format with metadata:
```csv
textbook,unit,problem_number,word,meaning,example_sentence,sentence_translation
모의고사1회,Unit1,1,run,달리다, 운영하다,He runs every morning.,그는 매일 아침 달린다.
모의고사1회,Unit1,,make,만들다,She made a cake.,그녀는 케이크를 만들었다.
```

**Text Input Format:**
```
word - meaning - example_sentence - translation
run - 달리다, 운영하다 - He runs every morning. - 그는 매일 아침 달린다.
```

### Reading Comprehension System

**Parallel Text Structure:**
Reading passages use alternating English/Korean lines:
```
Line 1 (English): Thanks to germ theory, / we know
Line 2 (Korean):  세균 이론 덕분에, / 우리는 안다
Line 3 (English): that maintaining good personal hygiene / is important
Line 4 (Korean):  좋은 개인 위생을 유지하는 것이 / 중요하다
```

**Important Parsing Rules:**
- Odd lines (1, 3, 5...) = English text
- Even lines (2, 4, 6...) = Korean translation
- "/" symbols are visual guides (구문 구분), NOT parsing delimiters
- "/" symbols are stored as-is in the text content
- Each line pair forms one translation unit

**Database Structure:**
```typescript
interface ReadingPassage {
  id: number
  unit_id: number
  problem_number: number
  title?: string
  full_text: string  // Complete original text
  lines: Array<{
    lineIndex: number
    english: string
    korean: string
  }>
}
```

**Version Control System:**

Students can submit multiple versions of the same reading passage:
- **v1 (first_attempt)**: Initial submission
- **v2 (revision)**: Modified after seeing correct answers
- **v3+ (retry)**: Complete redo from scratch

```typescript
interface ReadingAnswer {
  id: number
  student_id: number
  passage_id: number
  versions: Array<{
    version: number
    translations: Array<{
      lineIndex: number
      english: string
      studentTranslation: string
    }>
    submittedAt: string
    timeSpent: number  // seconds
    type: "first_attempt" | "revision" | "retry"
  }>
  currentVersion: number
  totalAttempts: number
}
```

**Auto-Save Implementation:**
- 3-second debounce on user input
- Save to localStorage/sessionStorage during editing
- Show "자동 저장됨 💾 방금 전" indicator
- On submit, persist complete version to database

### Gamification System

**Points System:**
- Word review (Space key): +2 points
- Word mastered (← arrow): +5 points
- Speed quiz correct: +10 points
- Speed quiz combo: +2, +4, +6... (cumulative)
- Time bonus: Additional points for fast answers
- Subjective test correct: +15 points
- Sentence translation: +5 points per sentence
- Reading completion: +50 points
- Reading retry (v2+): +30 points
- Daily login: +10 points
- Unit completion bonus: +50 points

**Level System:**
```
Level 1: Beginner     (0-100 XP)
Level 2: Learner      (101-300 XP)
Level 3: Scholar      (301-600 XP)
Level 4: Expert       (601-1000 XP)
Level 5: Master       (1001-1500 XP)
Level 6+: Grand Master (1500+ XP)
```

**Streak System:**
- Track consecutive daily learning (reset at midnight KST)
- Bonuses: 3일 (+20pt), 7일 (+50pt), 14일 (+100pt), 30일 (+200pt)
- Display: "🔥 7일 연속 학습 중!"
- Store in `DailyStreak` table with date, study_time, points_earned

**Badge System:**
```typescript
const badges = {
  "첫 걸음": "첫 단어 학습 완료",
  "스피드 러너": "스피드 퀴즈 90% 이상",
  "완벽주의자": "주관식 테스트 만점",
  "꾸준함의 힘": "7일 연속 학습",
  "독해 마스터": "독해 10개 완료",
  "백전백승": "스피드 퀴즈 100문제 정답",
  "성장의 증거": "같은 문제 3회 이상 도전",
  "시간 단축왕": "2회차에서 시간 50% 단축",
  "월간 챔피언": "월간 최다 포인트",
  "단어왕": "500개 단어 학습 완료"
}
```

### TTS (Text-to-Speech) Configuration

**Windows Speech API Settings:**
```javascript
const synth = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance(word);
utterance.lang = 'en-US';
utterance.rate = 0.65;  // CRITICAL: Slow speed for learning
utterance.pitch = 1;
utterance.volume = 1;
synth.speak(utterance);
```

**Auto-Play Mode:**
- Plays at 0.65x speed (천천히)
- 3-second interval between words
- Continuous playback through word list
- Pause/resume controls

**Keyboard Shortcuts:**
- `Space`: Toggle meaning visibility
- `← (Left)`: Mark as mastered + next word
- `→ (Right)`: Keep in learning + next word
- `Enter`: Skip to next word (no classification)
- `R`: Replay audio
- `Esc`: Exit learning mode

### Admin Dashboard & Monitoring

**Real-time Metrics:**
```typescript
interface DashboardMetrics {
  today: {
    totalStudents: number
    assignmentCompletion: number  // percentage
    activeStudents: number
  }
  weekly: {
    completionRate: number
    averageStudyTime: number  // minutes per day
    averageStreak: number
    totalWordsStudied: number
  }
  byActivityType: {
    vocabulary: number  // completion %
    speedQuiz: number
    subjectiveTest: number
    reading: number
  }
  alerts: {
    inactiveStudents: Student[]  // 3+ days no login
  }
  topPerformers: Student[]  // by XP, streak, completion
}
```

**Weekly Report Generation:**
- Daily completion rate trends (Mon-Sun)
- Student-by-student breakdown table
- Learning effectiveness analysis (accuracy rates)
- Top 10 most-missed vocabulary words
- Export formats: PDF, Excel

**Student Detail View:**
```typescript
interface StudentDetail {
  name: string
  learningCode: string
  level: number
  xp: number
  lastLogin: Date
  currentStreak: number
  longestStreak: number
  weeklyActivity: {
    loginDays: number
    totalMinutes: number
    completionRate: number
  }
  performance: {
    wordsLearned: number
    quizAccuracy: number
    readingCompleted: number
  }
  alerts: string[]  // Low completion, inactive, etc.
}
```

### File Organization

```
app/
├── (admin)/                 # Admin route group (auth middleware)
│   ├── login/              # Admin password login
│   ├── dashboard/          # Real-time monitoring, statistics
│   ├── textbooks/          # Textbook CRUD
│   │   └── [id]/
│   │       └── units/      # Unit management
│   ├── students/           # Student CRUD, learning code generation
│   ├── assignments/        # Multi-select assignment interface
│   └── layout.tsx          # Admin auth wrapper
│
├── (student)/              # Student route group (code-based auth)
│   ├── login/             # Learning code entry
│   ├── dashboard/         # Personal stats, level, XP, streak
│   ├── vocabulary/        # 4 learning modes
│   │   ├── review/       # TTS + classification
│   │   ├── speed/        # Speed quiz (4-choice)
│   │   ├── subjective/   # Fill-in-the-blank
│   │   └── sentence/     # Sentence translation practice
│   ├── reading/          # Reading comprehension
│   │   ├── [id]/        # Practice mode (editable)
│   │   └── results/     # Version comparison view
│   ├── progress/         # Learning records, history
│   └── layout.tsx        # Student auth wrapper
│
├── api/
│   ├── auth/
│   │   ├── admin/        # Admin password validation
│   │   └── student/      # Learning code validation
│   ├── vocabulary/
│   │   ├── upload/       # CSV/text bulk import
│   │   ├── progress/     # Learning state updates
│   │   └── quiz/         # Quiz result submission
│   ├── reading/
│   │   ├── submit/       # Version submission
│   │   └── versions/     # Version history retrieval
│   ├── assignments/
│   │   ├── create/       # Multi-student, multi-content
│   │   └── list/         # Student assignments view
│   └── dashboard/
│       ├── metrics/      # Admin dashboard data
│       └── reports/      # Weekly report generation
│
├── components/
│   ├── admin/
│   │   ├── CSVUploader.tsx          # PapaParse integration
│   │   ├── StudentSelector.tsx      # Multi-select checkboxes
│   │   ├── AssignmentBuilder.tsx    # Complex assignment UI
│   │   └── DashboardMetrics.tsx     # Real-time stats
│   ├── student/
│   │   ├── VocabularyReview.tsx     # TTS + keyboard shortcuts
│   │   ├── SpeedQuiz.tsx            # Timed 4-choice quiz
│   │   ├── ReadingEditor.tsx        # Auto-save editor
│   │   ├── VersionComparison.tsx    # Side-by-side comparison
│   │   └── GamificationDisplay.tsx  # XP, level, badges
│   └── shared/
│       ├── ProgressBar.tsx
│       ├── BadgeIcon.tsx
│       └── StreakDisplay.tsx
│
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   ├── auth.ts            # Session management
│   ├── csv-parser.ts      # CSV validation and parsing
│   ├── gamification.ts    # Points, XP, badge calculation
│   └── utils.ts           # Korean text helpers, formatters
│
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Sample data seeding
│
└── types/
    ├── vocabulary.ts
    ├── reading.ts
    └── gamification.ts
```

## Korean UI Standards

**Language Rules:**
- All student-facing UI must be in Korean
- Use polite/formal Korean appropriate for students (존댓말)
- Admin UI can mix Korean/English for efficiency

**Key Terms:**
- "학습 중" (Learning) vs "알고 있어요" (Mastered)
- "스피드 퀴즈" (Speed Quiz)
- "주관식 테스트" (Subjective Test)
- "간단한 문장 해석 연습" (Simple Sentence Translation)
- "과제 할당" (Assignment)
- "과제 달성률" (Assignment Completion Rate)

**Error Messages:**
- Should be encouraging and supportive
- Example: "조금만 더 하면 레벨업!" (Just a bit more for level up!)
- Avoid harsh language; focus on progress and growth

## Important Implementation Notes

### CSV Processing
1. Validate CSV structure before processing
2. Show preview table before committing to database
3. Support both basic and extended formats
4. Handle empty cells gracefully (null/optional fields)
5. Parse comma-separated meanings: "달리다, 운영하다"
6. Batch insert for performance with large CSV files

### Reading Passage Parsing
1. Split pasted text by newlines
2. Odd-indexed lines → English
3. Even-indexed lines → Korean
4. Preserve "/" symbols in text content
5. Store both `full_text` and structured `lines` array
6. Validate line count is even (must have pairs)

### Assignment System Logic
1. Support batch selection (multiple students)
2. Allow multi-textbook/unit assignment in single operation
3. Vocabulary options are mutually exclusive (all OR problems OR specific words)
4. Reading passages use array of selected IDs
5. Generate separate `Assignment` record per student
6. Due dates are optional (can be null)

### Auto-Save Strategy
```typescript
// Debounced save to prevent excessive writes
const debouncedSave = debounce((content) => {
  localStorage.setItem('reading_draft', JSON.stringify(content));
  updateAutoSaveIndicator('방금 전');
}, 3000);

// On submit, clear draft and persist to DB
const handleSubmit = async () => {
  await saveVersionToDatabase(content);
  localStorage.removeItem('reading_draft');
};
```

### Version Control Logic
```typescript
// When student clicks "수정하기" (Modify)
const createRevision = (existingVersion) => ({
  version: currentVersion + 1,
  type: "revision",
  translations: existingVersion.translations, // Pre-fill with current
  submittedAt: null // Set on submit
});

// When student clicks "다시 풀기" (Retry)
const createRetry = () => ({
  version: currentVersion + 1,
  type: "retry",
  translations: emptyTranslations, // Start fresh
  submittedAt: null
});
```

### Gamification Calculations
```typescript
// Points calculation must be consistent
const calculatePoints = (action: Action): number => {
  switch (action.type) {
    case 'word_review': return 2;
    case 'word_mastered': return 5;
    case 'speed_quiz_correct': return 10;
    case 'speed_quiz_combo': return action.comboLevel * 2;
    case 'subjective_correct': return 15;
    case 'sentence_complete': return 5;
    case 'reading_complete': return 50;
    case 'reading_retry': return 30;
    case 'daily_login': return 10;
  }
};

// Level thresholds
const levelThresholds = [0, 100, 300, 600, 1000, 1500];
const getCurrentLevel = (xp: number): number => {
  return levelThresholds.findIndex(threshold => xp < threshold) || levelThresholds.length;
};
```

### Streak Calculation
```typescript
// Reset at midnight KST (UTC+9)
const updateStreak = async (studentId: number) => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const todayRecord = await getStreakRecord(studentId, today);
  if (todayRecord) return; // Already logged today

  const yesterdayRecord = await getStreakRecord(studentId, yesterday);
  const newStreak = yesterdayRecord ? student.currentStreak + 1 : 1;

  await updateStudent(studentId, {
    currentStreak: newStreak,
    longestStreak: Math.max(student.longestStreak, newStreak)
  });
};
```

## Database Constraints

**Critical Unique Constraints:**
- `User.learning_code` must be unique (indexed)
- `Vocabulary.word + unit_id` should be unique within unit
- `ReadingPassage.problem_number + unit_id` should be unique

**JSON Column Structures:**
- `Vocabulary.meanings`: `string[]`
- `ReadingPassage.lines`: `Array<{lineIndex, english, korean}>`
- `ReadingAnswer.versions`: `Array<{version, translations, submittedAt, timeSpent, type}>`
- `Assignments.vocabulary_items`: `{all: boolean} | {problem_numbers: number[]} | {word_ids: number[]}`
- `Assignments.reading_passage_ids`: `number[]`

## Development Priorities (MVP Phases)

**Phase 1 (4-6 weeks):**
1. Authentication (admin password + student codes)
2. Admin content management (textbooks, units, vocabulary)
3. CSV/text bulk import with validation
4. Basic vocabulary learning (TTS review, speed quiz)
5. Basic gamification (points, levels)
6. Simple reading practice (input + comparison)
7. Assignment system (basic single-unit assignment)

**Phase 2 (3-4 weeks):**
8. Subjective vocabulary test
9. Sentence translation practice
10. Reading version control (modify/retry)
11. Student dashboard with personal stats
12. Badge system implementation
13. Multi-select assignment system

**Phase 3 (2-3 weeks):**
14. Admin dashboard with real-time metrics
15. Weekly report generation
16. Learning history and version browsing
17. Streak tracking and bonuses
18. Leaderboard (optional)
19. Achievement notifications with animations

## Performance Targets

- Page load: < 3 seconds
- TTS playback latency: < 1 second
- Quiz answer validation: < 100ms (instant feedback)
- Auto-save debounce: 3 seconds
- CSV processing: < 5 seconds for 500 words
- Dashboard metrics: < 2 seconds query time

## Security Considerations

- Admin password: bcrypt hashed (salt rounds: 10)
- Session cookies: httpOnly, secure, sameSite=lax
- No sensitive data in localStorage (only draft content)
- RBAC middleware on all admin routes
- File upload size limits (CSV: 5MB max)
- Input sanitization for XSS prevention
- SQL injection prevention via Prisma parameterized queries
- Rate limiting on auth endpoints

## Testing Strategy (Future)

**Unit Tests:**
- CSV parsing logic
- Gamification calculations (points, levels, streaks)
- Reading passage line parser
- Assignment creation logic

**Integration Tests:**
- Auth flows (admin + student)
- Content CRUD operations
- Assignment distribution
- Version control system

**E2E Tests:**
- Complete student learning journey
- Admin content creation workflow
- Multi-select assignment process
- Dashboard metric accuracy
