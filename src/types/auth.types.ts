import type { Session, User } from '@supabase/supabase-js'

export interface UserMetadata {
  username: string
  display_name?: string
  avatar_url?: string
}

export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
}

export interface SignUpData {
  email: string
  password: string
  username: string
  display_name?: string
}

export interface SignInData {
  email: string
  password: string
}
