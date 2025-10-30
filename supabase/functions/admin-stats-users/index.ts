import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { keysToCamelCase } from '../_shared/camelCase.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { error, status, admin, supabase } = await verifyAdmin(req)
    if (error || !admin || !supabase) {
      return errorResponse(error!, status)
    }

    const { limit = 50 } = await req.json()

    // Get user stats
    const { data: users, error: queryError } = await supabase.rpc('get_user_stats', { p_limit: limit })

    if (queryError) {
      return errorResponse('DATABASE_ERROR', 500, queryError.message)
    }

    return successResponse({
      users: keysToCamelCase(users || []),
    })
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
  }
})
