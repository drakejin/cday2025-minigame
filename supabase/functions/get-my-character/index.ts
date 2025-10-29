import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { verifyUser } from '../_shared/auth.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // 1. Verify user authentication
    const { error: authError, status, user, supabase } = await verifyUser(req)
    if (authError || !supabase) {
      return errorResponse(authError || 'UNAUTHORIZED', status)
    }

    // 2. Get user's active character
    const { data: character, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (charError) {
      return errorResponse('DATABASE_ERROR', 500, charError.message)
    }

    if (!character) {
      return errorResponse('CHARACTER_NOT_FOUND', 404, '활성 캐릭터가 없습니다')
    }

    // 3. Return character data
    return successResponse({
      id: character.id,
      name: character.name,
      current_prompt: character.current_prompt,
      total_score: character.total_score,
      strength: character.strength,
      charm: character.charm,
      creativity: character.creativity,
      created_at: character.created_at,
      updated_at: character.updated_at,
    })
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
  }
})
