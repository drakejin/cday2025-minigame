import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Verify admin authentication
 * Simplified: Only checks if user has admin role
 * No granular permissions required
 */
export async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { error: 'No token provided', status: 401, admin: null, supabase: null }
  }

  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. JWT 검증
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return { error: 'Invalid token', status: 401, admin: null, supabase }
  }

  // 2. Admin 권한 확인 (profiles 테이블에서 role 체크)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) {
    return { error: 'Profile not found', status: 403, admin: null, supabase }
  }

  // admin만 허용
  if (profile.role !== 'admin') {
    return { error: 'Admin permission required', status: 403, admin: null, supabase }
  }

  return { error: null, status: 200, admin: profile, supabase }
}
