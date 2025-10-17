# VocabQuest 빠른 시작 가이드

> 이 프로젝트를 바로 시작하는 방법을 안내합니다.

## 🚀 5분 안에 시작하기

### 1단계: 패키지 설치

```bash
npm install
```

### 2단계: 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 복사하세요:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="your-super-secret-key-change-this-min-32-chars"
NODE_ENV="development"
```

### 3단계: 데이터베이스 초기화

```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 생성
npx prisma db push

# 샘플 데이터 추가 (관리자 계정 포함)
npx prisma db seed
```

### 4단계: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열어보세요!

## 📝 기본 로그인 정보

프로젝트를 시드했다면 다음 계정으로 로그인할 수 있습니다:

**관리자:**
- URL: http://localhost:3000/admin/login
- 비밀번호: `admin1234`

**학생 (샘플):**
- URL: http://localhost:3000/login
- 학습 코드: `0115` (김철수)

## 📂 프로젝트 구조

```
vocabquest/
├── app/                    # Next.js 14 App Router
│   ├── (admin)/           # 관리자 페이지
│   ├── (student)/         # 학생 페이지
│   └── api/               # API Routes
├── components/            # React 컴포넌트
│   ├── admin/
│   ├── student/
│   └── shared/
├── lib/                   # 유틸리티 함수
│   ├── prisma.ts         # Prisma 클라이언트
│   └── auth.ts           # 인증 로직
├── prisma/               # 데이터베이스
│   ├── schema.prisma     # DB 스키마
│   └── seed.ts           # 시드 데이터
└── types/                # TypeScript 타입
```

## 🛠 개발 명령어

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build
npm run start

# Prisma 명령어
npx prisma studio          # DB GUI 열기
npx prisma generate        # 클라이언트 재생성
npx prisma db push         # 스키마 적용
npx prisma db seed         # 데이터 시드

# 린트
npm run lint
```

## 📚 다음 단계

1. **IMPLEMENTATION_GUIDE.md** - 전체 구현 가이드
2. **CLAUDE.md** - 프로젝트 아키텍처 문서
3. **plan.md** - 프로젝트 요구사항 문서

## ⚠️ 문제 해결

### 데이터베이스 오류

```bash
# 데이터베이스 초기화
rm prisma/dev.db
npx prisma db push
npx prisma db seed
```

### 패키지 오류

```bash
# node_modules 재설치
rm -rf node_modules
rm package-lock.json
npm install
```

### 포트 충돌

`.env` 파일에 포트 변경:
```env
PORT=3001
```

## 🎯 주요 기능

- ✅ 관리자/학생 인증 시스템
- ✅ 교재 및 단어 관리
- ✅ 단어 학습 (TTS 지원)
- ✅ 스피드 퀴즈
- ✅ 독해 연습 (버전 관리)
- ✅ 게이미피케이션 (레벨, 포인트, 배지)
- ✅ 학습 진도 추적
- ✅ 관리자 대시보드

## 📞 도움말

문제가 있으신가요?
- 구현 가이드: `IMPLEMENTATION_GUIDE.md` 참조
- GitHub Issues에 문의하기
