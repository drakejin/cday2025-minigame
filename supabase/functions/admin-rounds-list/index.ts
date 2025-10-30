import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { keysToCamelCase } from '../_shared/camelCase.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { error, status, admin, supabase } = await verifyAdmin(req, 'rounds')
    if (error || !admin || !supabase) {
      return errorResponse(error!, status)
    }

    const { statusFilter, limit = 50, offset = 0 } = await req.json()

    let query = supabase.from('game_rounds').select('*', { count: 'exact' })

    // 상태 필터
    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    query = query.order('round_number', { ascending: false }).range(offset, offset + limit - 1)

    const { data: rounds, error: queryError, count } = await query

    if (queryError) {
      return errorResponse('DATABASE_ERROR', 500, queryError.message)
    }

    return successResponse({
      rounds: keysToCamelCase(rounds || []),
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
  }
})
