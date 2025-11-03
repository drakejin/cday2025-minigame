import { useEffect } from 'react'
import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { authService } from '@/services/auth.service'
import { profileService } from '@/services/profile.service'
import { supabase } from '@/services/supabase'
import { env } from '@/config/env'
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

// Flag to ensure listener is set up only once
let authListenerInitialized = false

/**
 * Custom hook - use this instead of useAuthStore directly
 * Automatically checks session and sets up auth listener
 */
export function useAuth() {
  const store = useAuthStore()

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      console.log('[useAuth] Initializing...')

      try {
        console.log('[useAuth] Attempting to get session...')

        // Try getSession with shorter timeout
        let result: any
        try {
          result = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('getSession timeout')), 3000)
            ),
          ])
          console.log('[useAuth] getSession succeeded')
        } catch (timeoutError) {
          console.warn('[useAuth] getSession timed out, trying localStorage fallback')

          // Fallback: read directly from localStorage
          const storageKey = `sb-${env.supabase.url.split('//')[1].split('.')[0]}-auth-token`
          const storedSession = localStorage.getItem(storageKey)

          if (storedSession) {
            console.log('[useAuth] Found session in localStorage')
            const parsed = JSON.parse(storedSession)
            result = { data: parsed, error: null }
          } else {
            console.log('[useAuth] No session in localStorage')
            result = { data: { session: null }, error: null }
          }
        }

        console.log('[useAuth] Session check result:', {
          hasData: !!result.data,
          hasError: !!result.error,
          hasSession: !!result.data?.session,
        })

        if (!mounted) {
          console.log('[useAuth] Component unmounted, aborting')
          return
        }

        if (result.error) {
          console.error('[useAuth] getSession error:', result.error)
          if (mounted) {
            useAuthStore.setState({ initialized: true })
          }
          return
        }

        const { data } = result

        if (data.session) {
          console.log('[useAuth] Session found:', data.session.user.email)
          useAuthStore.setState({ session: data.session, user: data.session.user })

          try {
            console.log('[useAuth] Fetching profile...')
            const profile = await profileService.getMyProfile()
            console.log('[useAuth] Profile fetched:', profile.email)
            if (mounted) {
              useAuthStore.setState({ profile, initialized: true })
              console.log('[useAuth] ✅ Initialization complete')
            }
          } catch (error) {
            console.error('[useAuth] Profile fetch failed:', error)
            if (mounted) {
              useAuthStore.setState({ initialized: true })
            }
          }
        } else {
          console.log('[useAuth] No session found')
          if (mounted) {
            useAuthStore.setState({ initialized: true })
            console.log('[useAuth] ✅ Initialization complete (no session)')
          }
        }
      } catch (error) {
        console.error('[useAuth] Fatal error during initialization:', error)
        if (mounted) {
          useAuthStore.setState({ initialized: true })
        }
      }
    }

    // Set up auth state listener only once
    if (!authListenerInitialized) {
      authListenerInitialized = true
      console.log('[useAuth] Setting up auth listener')

      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] State changed:', event, session?.user?.email)

        if (event === 'INITIAL_SESSION') {
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session) {
            useAuthStore.setState({ session, user: session.user })

            try {
              const profile = await profileService.getMyProfile()
              useAuthStore.setState({ profile })
            } catch (error) {
              console.error('[Auth] Profile refresh failed:', error)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          useAuthStore.setState({ session: null, user: null, profile: null })
        }
      })

      // Cleanup on app unmount (practically never happens)
      return () => {
        authListener?.subscription.unsubscribe()
      }
    }

    // Initialize if not yet initialized
    if (!store.initialized) {
      initialize()
    }

    return () => {
      mounted = false
    }
  }, [store.initialized])

  return store
}
