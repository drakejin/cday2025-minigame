import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors } from '../_shared/cors.ts'
import { successResponse, errorResponse } from '../_shared/response.ts'
import { verifyUser } from '../_shared/auth.ts'

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    // 1. Verify authentication
    const { error: authError, status, user, supabase } = await verifyUser(req)
    if (authError || !supabase) {
      return errorResponse(authError || 'UNAUTHORIZED', status)
    }

    // 2. Parse request body
    const { name } = await req.json()

    if (!name || name.trim().length === 0) {
      return errorResponse('INVALID_CHARACTER_NAME', 400, '캐릭터 이름을 입력해주세요')
    }

    if (name.length > 100) {
      return errorResponse('INVALID_CHARACTER_NAME', 400, '캐릭터 이름은 100자 이하여야 합니다')
    }

    // 3. Check if user already has an active character
    const { data: existingChar } = await supabase
      .from('characters')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (existingChar) {
      return errorResponse('CHARACTER_ALREADY_EXISTS', 400, '이미 활성 캐릭터가 존재합니다')
    }

    // 4. Create new character
    const { data: character, error: createError } = await supabase
      .from('characters')
      .insert({
        user_id: user.id,
        name: name.trim(),
        current_prompt: '새로운 영웅',
        total_score: 0,
        strength: 0,
        charm: 0,
        creativity: 0,
        is_active: true,
      })
      .select()
      .single()

    if (createError) {
      return errorResponse('DATABASE_ERROR', 500, createError.message)
    }

    return successResponse({
      id: character.id,
      name: character.name,
      current_prompt: character.current_prompt,
      total_score: character.total_score,
      strength: character.strength,
      charm: character.charm,
      creativity: character.creativity,
      created_at: character.created_at,
    })
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
  }
})
