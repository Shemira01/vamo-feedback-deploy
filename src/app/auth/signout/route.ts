// src/app/auth/signout/route.ts
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Check if a user's session exists
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  revalidatePath('/', 'layout')
  
  // Requirement: Return user to the login page after signing out
  return NextResponse.redirect(new URL('/login', req.url), {
    status: 302,
  })
}