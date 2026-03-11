// src/app/login/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Strict Zod validation enforcing the @vamo.app domain
const authSchema = z.object({
  email: z.string().email("Invalid email").endsWith("@vamo.app", "Only @vamo.app emails are allowed"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function login(formData: FormData) {
  const supabase = await createClient()
  const rawData = Object.fromEntries(formData.entries())
  const validated = authSchema.safeParse(rawData)

  if (!validated.success) {
    return redirect('/login?error=Invalid+email+or+password')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    return redirect('/login?error=Invalid+credentials')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const rawData = Object.fromEntries(formData.entries())
  const validated = authSchema.safeParse(rawData)

  if (!validated.success) {
    return redirect('/login?error=Must+use+a+valid+@vamo.app+email')
  }

  const { error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    return redirect(`/login?error=${error.message}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}