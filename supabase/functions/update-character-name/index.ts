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

    const { character_id, name } = await req.json()

    if (!character_id || !name) {
      return errorResponse('INVALID_REQUEST', 400, 'character_id와 name이 필요합니다')
    }

    if (name.length > 100) {
      return errorResponse('INVALID_CHARACTER_NAME', 400, '이름은 100자 이하여야 합니다')
    }

    // Verify ownership
    const { data: character } = await supabase
      .from('characters')
      .select('id')
      .eq('id', character_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!character) {
      return errorResponse('CHARACTER_NOT_FOUND', 404, '캐릭터를 찾을 수 없습니다')
    }

    // Update name
    const { data: updated, error: updateError } = await supabase
      .from('characters')
      .update({ name: name.trim() })
      .eq('id', character_id)
      .select()
      .single()

    if (updateError) {
      return errorResponse('DATABASE_ERROR', 500, updateError.message)
    }

    return successResponse({
      id: updated.id,
      name: updated.name,
    })
  } catch (error) {
    return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
  }
})
