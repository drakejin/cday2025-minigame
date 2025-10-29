import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { verifyUser } from '../_shared/auth.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const { error: authError, status, user, supabase } = await verifyUser(req)
    if (authError || !supabase) {
      return errorResponse(authError || 'UNAUTHORIZED', status)
    }

    // Parse query params
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Get user's character
    const { data: character } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!character) {
      return errorResponse('CHARACTER_NOT_FOUND', 404, '활성 캐릭터가 없습니다')
    }

    // Get prompt history
    const { data: prompts, error: promptError, count } = await supabase
      .from('prompt_history')
      .select('*', { count: 'exact' })
      .eq('character_id', character.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (promptError) {
      return errorResponse('DATABASE_ERROR', 500, promptError.message)
    }

    return successResponse({
      data: prompts || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
  }
})
