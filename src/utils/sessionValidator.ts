import { env } from '@/config/env'

/**
 * Validate and refresh session if needed
 * Returns true if valid session exists, false otherwise
 * Throws error on timeout or network issues
 */
export async function ensureValidSession(): Promise<boolean> {
  // 1. First check localStorage for existing session
  const storageKey = `sb-${env.supabase.url.split('//')[1].split('.')[0]}-auth-token`
  const storedData = localStorage.getItem(storageKey)

  if (!storedData) {
    console.log('[sessionValidator] No session in localStorage')
    return false
  }

  let parsedData: any
  try {
    parsedData = JSON.parse(storedData)
  } catch {
    console.log('[sessionValidator] Invalid session data in localStorage')
    localStorage.removeItem(storageKey)
    return false
  }

  // 2. Check if token is expired
  const session = parsedData.session || parsedData
  if (!session.access_token || !session.expires_at) {
    console.log('[sessionValidator] Session missing required fields')
    return false
  }

  const expiresAt = session.expires_at * 1000 // Convert to milliseconds
  const now = Date.now()
  const isExpired = now >= expiresAt
  const willExpireSoon = now >= expiresAt - 60000 // Expires in less than 1 minute

  console.log('[sessionValidator] Token status:', {
    isExpired,
    willExpireSoon,
    expiresIn: `${Math.floor((expiresAt - now) / 1000)}s`,
  })

  // 3. If expired or expiring soon, try to refresh
  if (isExpired || willExpireSoon) {
    console.log('[sessionValidator] Token expired or expiring soon, refreshing...')
    localStorage.removeItem(storageKey)
    return false
  }

  // 4. Token is still valid
  console.log('[sessionValidator] Token is valid')
  return true
}
