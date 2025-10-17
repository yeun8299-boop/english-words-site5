'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { BookOpen, Users, ClipboardList, BarChart3, LogOut } from 'lucide-react'

export default function AdminNav() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin-login')
    router.refresh()
  }

  const navItems = [
    { href: '/admin/dashboard', icon: BarChart3, label: '대시보드' },
    { href: '/admin/textbooks', icon: BookOpen, label: '교재 관리' },
    { href: '/admin/students', icon: Users, label: '학생 관리' },
    { href: '/admin/assignments', icon: ClipboardList, label: '과제 할당' },
  ]

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin/dashboard" className="text-xl font-bold text-blue-600">
              📚 VocabQuest 관리자
            </Link>

            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-600'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
