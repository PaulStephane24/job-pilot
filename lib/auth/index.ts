// lib/auth/index.ts
'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { adminSupabase } from '@/lib/supabase/server'

async function createAuthClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete(name)
        },
      },
    }
  )
}

export const signUp = async (email: string, password: string, fullName?: string) => {
  try {
    const supabase = await createAuthClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      return { user: null, session: null, error: signUpError.message }
    }

    if (!data.user) {
      return { user: null, session: null, error: 'Signup failed - no user returned' }
    }

    // Create user + profile in database using admin client
    const { error: userError } = await adminSupabase
      .from('users')
      .upsert({ id: data.user.id, email: data.user.email!, role: 'USER' }, { onConflict: 'id' })

    if (userError) {
      return { user: null, session: null, error: userError.message }
    }

    // Parse name
    const nameParts = (fullName || '').trim().split(/\s+/)
    const firstName = nameParts[0] || null
    const lastName = nameParts.slice(1).join(' ') || null

    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        userId: data.user.id,
        firstName,
        lastName,
      }, { onConflict: 'userId' })

    if (profileError) {
      console.error('Profile creation error:', profileError)
    }

    return { user: data.user, session: data.session, error: null }
  } catch (error: any) {
    return { user: null, session: null, error: error.message || 'An unexpected error occurred' }
  }
}

export const login = async (email: string, password: string) => {
  try {
    const supabase = await createAuthClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { data: null, error: error.message }
    }
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Login failed' }
  }
}

export const logout = async () => {
  try {
    const supabase = await createAuthClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || 'Logout failed' }
  }
}

export const getCurrentUser = async () => {
  try {
    const supabase = await createAuthClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return { user: null, error: error?.message || 'No user found' }
    }
    return { user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to get user' }
  }
}
