import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { keysToCamelCase } from '../_shared/camelCase.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { error, status, admin, supabase } = await verifyAdmin(req, 'prompts')
    if (error || !admin || !supabase) {
      return errorResponse(error!, status)
    }

    const { user_id, round_number, limit = 50, offset = 0 } = await req.json()

    let query = supabase.from('prompt_history').select(
      `
        *,
        characters!inner(name, user_id)
      `,
      { count: 'exact' }
    )

    // 필터링
    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    if (round_number) {
      query = query.eq('round_number', round_number)
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data: prompts, error: queryError, count } = await query

    if (queryError) {
      return errorResponse('DATABASE_ERROR', 500, queryError.message)
    }

    return successResponse({
      prompts: keysToCamelCase(prompts || []),
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
  }
})
