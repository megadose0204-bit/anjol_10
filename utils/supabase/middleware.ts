import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and getUser. A simple mistake can write
  // security vulnerabilities.
  await supabase.auth.getUser()

  // 이 미들웨어에서는 단순히 쿠키 갱신만 처리하며 특정 리다이렉트 보호 로직은 Route & Page 레벨에서 처리합니다.
  // URL 패턴상 auth/confirm 및 auth 세션 갱신을 위해 통과시킵니다.
  return supabaseResponse
}
