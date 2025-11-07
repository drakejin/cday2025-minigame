import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Verify user JWT token and return user info
 */
export async function verifyUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { error: 'No authorization header', status: 401, user: null, supabase: null }
  }

  const token = authHeader.replace('Bearer ', '')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required environment variables')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { error: 'Invalid token', status: 401, user: null, supabase }
  }

  return { error: null, status: 200, user, supabase }
}
