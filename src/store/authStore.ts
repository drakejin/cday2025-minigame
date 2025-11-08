import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { env } from '@/config/env'
import { authService } from '@/services/auth.service'
import { profileService } from '@/services/profile.service'
import { supabase } from '@/services/supabase'
import type { Profile } from '@/types/profile.types'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  initialized: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: false,
  initialized: false,

  signInWithGoogle: async () => {
    set({ isLoading: true })
    try {
      await authService.signInWithGoogle()
    } finally {
      set({ isLoading: false })
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    try {
      await authService.signOut()
      set({ user: null, profile: null, session: null })
    } finally {
      set({ isLoading: false })
    }
  },

  refreshProfile: async () => {
    try {
      const profile = await profileService.getMyProfile()
      set({ profile })
    } catch (error) {
      console.error('Failed to refresh profile:', error)
      throw error
    }
  },
}))

/**
 * Module-level IIFE initialization
 * Runs once when this file is first imported
 * Sets up auth listener and checks for existing session
 */
;(async () => {
  console.log('[authStore] Module-level initialization started')

  // Set up auth state listener (only once, at module level)
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[authStore] Auth state changed:', event, session?.user?.email)

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      if (session) {
        console.log('[authStore] Updating session and user:', session.user.email)
        useAuthStore.setState({ session, user: session.user })

        try {
          console.log('[authStore] Fetching profile for:', session.user.email)
          const profile = await profileService.getMyProfile()
          useAuthStore.setState({ profile, initialized: true })
          console.log('[authStore] ✅ Profile loaded:', profile.email, 'Role:', profile.role)
        } catch (error) {
          console.error('[authStore] Profile refresh failed:', error)
          useAuthStore.setState({ initialized: true })
        }
      }
    } else if (event === 'SIGNED_OUT') {
      console.log('[authStore] User signed out')
      useAuthStore.setState({ session: null, user: null, profile: null })
    }
  })

  // Check for existing session
  try {
    console.log('[authStore] Checking for existing session...')

    type SessionResponse = Awaited<ReturnType<typeof supabase.auth.getSession>>
    let result: SessionResponse

    try {
      // Try getSession with timeout
      const sessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise<SessionResponse>((_, reject) =>
          setTimeout(() => reject(new Error('getSession timeout')), 3000)
        ),
      ])
      result = sessionResult
      console.log('[authStore] getSession succeeded')
    } catch (_timeoutError) {
      console.warn('[authStore] getSession timed out, trying localStorage fallback')

      // Fallback: read directly from localStorage
      const storageKey = `sb-${env.supabase.url.split('//')[1].split('.')[0]}-auth-token`
      const storedSession = localStorage.getItem(storageKey)

      if (storedSession) {
        console.log('[authStore] Found session in localStorage')
        try {
          const parsed = JSON.parse(storedSession)

          // Check different possible structures
          if (parsed.session) {
            result = { data: { session: parsed.session }, error: null }
          } else if (parsed.access_token && parsed.user) {
            // Old format - convert to new format
            result = { data: { session: parsed }, error: null }
          } else {
            console.warn('[authStore] Unknown localStorage session format')
            result = { data: { session: null }, error: null }
          }
        } catch (parseError) {
          console.error('[authStore] Failed to parse localStorage session:', parseError)
          result = { data: { session: null }, error: null }
        }
      } else {
        console.log('[authStore] No session in localStorage')
        result = { data: { session: null }, error: null }
      }
    }

    if (result.error) {
      console.error('[authStore] getSession error:', result.error)
      useAuthStore.setState({ initialized: true })
      return
    }

    const { data } = result

    if (data.session) {
      console.log('[authStore] Session found:', data.session.user.email)
      useAuthStore.setState({ session: data.session, user: data.session.user })

      try {
        console.log('[authStore] Fetching profile...')
        const profile = await profileService.getMyProfile()
        console.log('[authStore] Profile fetched:', profile.email)
        useAuthStore.setState({ profile, initialized: true })
        console.log('[authStore] ✅ Initialization complete')
      } catch (error) {
        console.error('[authStore] Profile fetch failed:', error)
        useAuthStore.setState({ initialized: true })
      }
    } else {
      console.log('[authStore] No session found')
      useAuthStore.setState({ initialized: true })
      console.log('[authStore] ✅ Initialization complete (no session)')
    }
  } catch (error) {
    console.error('[authStore] Fatal error during initialization:', error)
    useAuthStore.setState({ initialized: true })
  }
})()
