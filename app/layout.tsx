import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VocabQuest - 영어 학습 플랫폼",
  description: "중고등학생을 위한 게이미피케이션 기반 영어 어휘 학습 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
