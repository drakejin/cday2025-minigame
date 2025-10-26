import { supabase } from './supabase'
import type { SignInData, SignUpData } from '@/types'

export const authService = {
  /**
   * Sign up new user
   */
  async signUp(data: SignUpData) {
    const { email, password, username, display_name } = data

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: display_name || username,
        },
      },
    })

    if (error) throw error
    return authData
  },

  /**
   * Sign in existing user
   */
  async signIn(data: SignInData) {
    const { email, password } = data

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return authData
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  /**
   * Get current user
   */
  async getUser() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  },

  /**
   * Refresh session
   */
  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    return data.session
  },
}
