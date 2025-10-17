# 📚 VocabQuest - 중고등학생 영어 학습 플랫폼

> 게이미피케이션 기반의 체계적인 영어 어휘 및 독해 학습 플랫폼

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC)](https://tailwindcss.com/)

## ✨ 주요 기능

### 🎓 학생 기능
- **단어 학습 모드**
  - 🔊 TTS 발음 지원 (0.65배속)
  - ← → 키보드로 빠른 분류 (학습 중 / 알고 있어요)
  - 📑 북마크 기능

- **4가지 학습 방식**
  - 스피드 퀴즈 (4지선다)
  - 주관식 테스트
  - 문장 해석 연습
  - 독해 연습 (버전 관리)

- **게이미피케이션**
  - 🏆 레벨 시스템 (Beginner → Grand Master)
  - 💎 포인트 및 경험치
  - 🎖 배지 시스템
  - 🔥 연속 학습일 추적

### 👨‍🏫 관리자 기능
- **콘텐츠 관리**
  - 교재 / Unit / 단어 CRUD
  - CSV 파일 일괄 업로드
  - 독해 지문 등록

- **학생 관리**
  - 학습 코드 기반 계정 생성
  - 과제 할당 (다중 선택 지원)
  - 학습 현황 모니터링

- **대시보드**
  - 실시간 과제 달성률
  - 주간 통계 리포트
  - 자주 틀리는 단어 TOP 10

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 20 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd vocabquest

# 2. 패키지 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 DATABASE_URL 설정

# 4. 데이터베이스 초기화
npx prisma generate
npx prisma db push
npx prisma db seed

# 5. 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 을 열어보세요!

## 📖 문서

- **[QUICKSTART.md](./QUICKSTART.md)** - 5분 만에 시작하기
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - 초보자용 구현 가이드
- **[CLAUDE.md](./CLAUDE.md)** - 프로젝트 아키텍처 문서
- **[plan.md](./plan.md)** - 프로젝트 요구사항 (PRD)

## 🏗 기술 스택

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Database**: Prisma + PostgreSQL (또는 SQLite for dev)
- **Authentication**: Session-based (httpOnly cookies)
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **TTS**: Web Speech API

## 📂 프로젝트 구조

```
vocabquest/
├── app/                    # Next.js App Router
│   ├── (admin)/           # 관리자 페이지
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── textbooks/
│   │   ├── students/
│   │   └── assignments/
│   ├── (student)/         # 학생 페이지
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── vocabulary/
│   │   └── reading/
│   └── api/               # API Routes
│       ├── auth/
│       ├── vocabulary/
│       ├── reading/
│       └── assignments/
├── components/            # React 컴포넌트
│   ├── admin/
│   ├── student/
│   └── shared/
├── lib/                   # 유틸리티 함수
│   ├── prisma.ts         # Prisma 클라이언트
│   ├── auth.ts           # 인증 로직
│   └── gamification.ts   # 게임화 계산
├── prisma/               # 데이터베이스
│   ├── schema.prisma     # DB 스키마
│   └── seed.ts           # 시드 데이터
└── types/                # TypeScript 타입
    └── index.ts
```

## 🎯 개발 로드맵

### Phase 1: MVP (현재)
- [x] 프로젝트 설정
- [x] 데이터베이스 스키마
- [x] 인증 시스템
- [ ] 관리자 콘텐츠 관리
- [ ] 학생 학습 기능 (기본)
- [ ] 게이미피케이션 (기본)

### Phase 2: 핵심 기능
- [ ] 주관식 테스트
- [ ] 문장 해석 연습
- [ ] 독해 버전 관리
- [ ] 학습 대시보드
- [ ] 배지 시스템

### Phase 3: 고도화
- [ ] 학습 기록 조회
- [ ] 스트릭 시스템
- [ ] 리더보드
- [ ] 성취 알림
- [ ] 반응형 디자인

## 🤝 기여하기

기여를 환영합니다! 이슈를 열거나 Pull Request를 보내주세요.

## 📄 라이선스

MIT License

## 📞 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 열어주세요.

---

**Made with ❤️ for Korean students**
"# english-words-site5" 
