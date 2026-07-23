import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import AuthForm from './auth-form'
import { signout } from './actions'

export default async function AuthPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="auth-grid-bg flex flex-col flex-1 items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {user ? (
        <div className="w-full max-w-[440px] px-4 animate-fade-in">
          {/* AutoBlog 인증 완료 로고 헤더 */}
          <div className="flex flex-col items-center mb-8 text-center">
            <Link href="/" className="text-2xl font-black text-indigo-600 tracking-tight no-underline">
              AutoBlog
            </Link>
            <p className="text-sm font-medium text-zinc-500">
              세션이 정상적으로 인증되었습니다.
            </p>
          </div>

          {/* 인증 완료 상태 카드 */}
          <div className="bg-white rounded-2xl border border-zinc-150/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-8 text-center">
            <div className="w-16 h-16 bg-[#e8effd] text-[#005acc] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            
            <h2 className="text-lg font-bold text-zinc-800 mb-1">계정 인증 완료</h2>
            <p className="text-sm text-zinc-500 mb-6 font-medium break-all bg-zinc-50 p-3 rounded-xl border border-zinc-100/60 font-sans">
              접속 이메일: <span className="font-semibold text-zinc-800">{user.email}</span>
            </p>

            <div className="flex gap-3">
              <Link
                href="/"
                className="flex-1 py-3 border border-zinc-200/80 hover:bg-zinc-50 text-zinc-700 font-semibold rounded-xl text-sm transition-all text-center no-underline"
              >
                홈으로
              </Link>
              <form action={signout} className="flex-1">
                <button
                  type="submit"
                  className="w-full py-3 border border-zinc-200/80 hover:bg-zinc-50 text-zinc-700 font-semibold rounded-xl text-sm transition-all focus:outline-none cursor-pointer"
                >
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <AuthForm />
      )}
    </div>
  )
}
