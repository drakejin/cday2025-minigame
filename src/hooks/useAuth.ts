import { useEffect } from 'react'
import { authService } from '@/services/auth.service'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/store/authStore'

export const useAuth = () => {
  // Zustand store selectors
  const user = useAuthStore((state) => state.user)
  const session = useAuthStore((state) => state.session)
  const isLoading = useAuthStore((state) => state.isLoading)
  const setUser = useAuthStore((state) => state.setUser)
  const setSession = useAuthStore((state) => state.setSession)
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle)
  const signOut = useAuthStore((state) => state.signOut)

  useEffect(() => {
    // Check initial session on mount
    const initializeAuth = async () => {
      try {
        console.log('[useAuth] Initializing auth...')
        const session = await authService.getSession()
        console.log('[useAuth] Current session:', session?.user?.email || 'No session')

        if (session) {
          const user = await authService.getUser()
          console.log('[useAuth] Setting user:', user.email)
          setSession(session)
          setUser(user)
        } else {
          console.log('[useAuth] No active session found')
        }
      } catch (error) {
        console.error('[useAuth] Failed to initialize auth:', error)
      }
    }

    initializeAuth()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[useAuth] Auth state changed:', event, session?.user?.email || 'No session')

      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            console.log('[useAuth] User signed in:', session.user.email)
            setSession(session)
            setUser(session.user)
          }
          break
        case 'SIGNED_OUT':
          console.log('[useAuth] User signed out')
          setSession(null)
          setUser(null)
          break
        case 'TOKEN_REFRESHED':
          if (session) {
            console.log('[useAuth] Token refreshed')
            setSession(session)
            setUser(session.user)
          }
          break
        case 'INITIAL_SESSION':
          console.log('[useAuth] Initial session event')
          if (session) {
            console.log('[useAuth] Setting initial session:', session.user.email)
            setSession(session)
            setUser(session.user)
          }
          break
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession, setUser])

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
  }
}
