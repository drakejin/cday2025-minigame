import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

console.log('[Supabase] Initializing client with:', {
  url: env.supabase.url,
  hasAnonKey: !!env.supabase.anonKey,
})

export const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Remove flowType - let Supabase use default
    storage: window.localStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

console.log('[Supabase] Client initialized')
