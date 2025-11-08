import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

console.log('[Supabase] Initializing client with:', {
  url: env.supabase.url,
  hasAnonKey: !!env.supabase.anonKey,
})

// Minimal configuration - remove potentially problematic options
export const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: fetch.bind(globalThis),
  },
})
