// src/utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value, options))
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

  // Retrieve the user from the current session
  const { data: { user } } = await supabase.auth.getUser()

  // REQUIREMENT A02: Domain restriction
  const isVamoUser = user?.email?.endsWith('@vamo.app')
  const isLoginPage = request.nextUrl.pathname.startsWith('/login')
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')

  // 1. If no user is logged in, redirect to login (unless already on login/auth pages)
  if (!user && !isLoginPage && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. If a user is logged in but NOT from @vamo.app, sign them out and redirect to login
  if (user && !isVamoUser && !isLoginPage) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'unauthorized_domain')
    return NextResponse.redirect(url)
  }

  // IMPORTANT: Return the supabaseResponse object to keep cookies in sync
  return supabaseResponse
}