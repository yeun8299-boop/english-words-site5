import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md w-full mx-4">
        <h1 className="text-5xl font-bold mb-4 text-gray-800">
          📚 VocabQuest
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          중고등학생을 위한<br />영어 학습 플랫폼
        </p>

        <div className="space-y-4">
          <Link
            href="/student/login"
            className="block w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-500 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg"
          >
            🎓 학생 로그인
          </Link>

          <Link
            href="/admin-login"
            className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            👨‍🏫 관리자 로그인
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            ✨ 게이미피케이션 기반 학습<br />
            🔊 TTS 발음 지원<br />
            📊 실시간 진도 추적
          </p>
        </div>
      </div>
    </div>
  )
}
