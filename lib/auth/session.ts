"use server"

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const getCurrentSession = async () => {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              )
            } catch {
              // Server Components cannot set cookies
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.getSession()
    return { data, error }
  } catch (error: any) {
    console.error('Error getting session:', error)
    return { data: null, error: error.message || 'Failed to get session' }
  }
}
