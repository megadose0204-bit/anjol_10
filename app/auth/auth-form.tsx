'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { login, signup } from './actions'

export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMsg(null)

    const formData = new FormData(event.currentTarget)
    
    startTransition(async () => {
      if (mode === 'login') {
        const result = await login(formData)
        if (result?.error) {
          setError(result.error)
        }
      } else {
        const result = await signup(formData)
        if (result?.error) {
          setError(result.error)
        } else if (result?.success) {
          setSuccessMsg(result.message || '인증 이메일이 발송되었습니다.')
          const form = event.target as HTMLFormElement
          form.reset()
        }
      }
    })
  }

  return (
    <div className="w-full max-w-[440px] px-4">
      {/* DevFlow 로고 영역 */}
      <div className="flex flex-col items-center mb-8 text-center">
        <Link href="/" className="text-3xl font-extrabold tracking-tight text-[#005acc] mb-1 font-sans no-underline">
          DevFlow
        </Link>
        <p className="text-sm font-medium text-zinc-500">
          모든 빌드를 위한 정밀한 환경.
        </p>
      </div>

      {/* 카드 레이아웃 */}
      <div className="bg-white rounded-2xl border border-zinc-150/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-8">
        
        {/* 상단 탭 버튼 */}
        <div className="flex bg-[#e8effd]/60 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
              setSuccessMsg(null)
            }}
            className={`flex-1 text-center py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
              mode === 'login'
                ? 'bg-[#005acc] text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError(null)
              setSuccessMsg(null)
            }}
            className={`flex-1 text-center py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
              mode === 'signup'
                ? 'bg-[#005acc] text-white shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* 안내 메시지 표시 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-medium text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-600 font-medium text-center">
            {successMsg}
          </div>
        )}

        {/* 폼 양식 */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이메일 주소 입력 */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-700">
                이메일 주소
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-4.5 h-4.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full text-sm py-3 pl-10 pr-4 bg-zinc-50 border border-zinc-200/80 rounded-xl focus:outline-none focus:border-[#005acc] focus:ring-1 focus:ring-[#005acc]/20 transition-all font-sans text-zinc-800 placeholder-zinc-400"
                placeholder="developer@example.com"
              />
            </div>
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <div className="flex justify-between items-center mb-1.5 font-sans">
              <label htmlFor="password" className="text-xs font-semibold text-zinc-700 font-sans">
                비밀번호
              </label>
              {mode === 'login' && (
                <a
                  href="#forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    setError('비밀번호 재설정 기능은 준비 중입니다.');
                  }}
                  className="text-xs text-[#005acc] font-semibold hover:underline"
                >
                  비밀번호 찾기?
                </a>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-4.5 h-4.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full text-sm py-3 pl-10 pr-4 bg-zinc-50 border border-zinc-200/80 rounded-xl focus:outline-none focus:border-[#005acc] focus:ring-1 focus:ring-[#005acc]/20 transition-all font-sans text-zinc-800 placeholder-zinc-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isPending}
            className={`w-full py-3 bg-[#005acc] hover:bg-[#004bb9] text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 focus:outline-none shadow-sm cursor-pointer shadow-blue-500/10 ${
              isPending ? 'opacity-80 cursor-not-allowed' : ''
            }`}
          >
            {isPending ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : mode === 'login' ? (
              <>
                세션 인증
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </>
            ) : (
              <>
                가입하기
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* 이용약관 및 푸터 */}
        <p className="mt-8 text-center text-[10.5px] leading-5 text-zinc-400 font-sans tracking-wide">
          계속 진행함으로써 귀하는 당사의{' '}
          <a href="#terms" className="text-zinc-600 hover:underline hover:text-zinc-800 font-medium">
            이용약관
          </a>{' '}
          및{' '}
          <Link href="/privacy" className="text-zinc-600 hover:underline hover:text-zinc-800 font-medium">
            개인정보 처리방침
          </Link>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  )
}
