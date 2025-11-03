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

console.log('[Supabase] Client initialized')

// Test client immediately
setTimeout(async () => {
  console.log('[Supabase] Testing client...')
  try {
    const { data, error } = await supabase.auth.getSession()
    console.log('[Supabase] Test result:', {
      hasData: !!data,
      hasError: !!error,
      hasSession: !!data?.session,
    })
  } catch (err) {
    console.error('[Supabase] Test failed:', err)
  }
}, 100)
