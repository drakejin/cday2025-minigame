import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyUser } from '../_shared/auth.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('create-character', async (req, logger) => {
    try {
      const { error: authError, status, user, supabase } = await verifyUser(req)
      logger.setUser(user?.id, user?.email)

      if (authError || !supabase) {
        logger.logError(status, authError || 'UNAUTHORIZED')
        return errorResponse(authError || 'UNAUTHORIZED', status)
      }

      const { name } = await req.json()
      logger.setRequestBody({ name })

      if (!name || name.trim().length === 0) {
        logger.logError(400, '캐릭터 이름을 입력해주세요')
        return errorResponse('INVALID_CHARACTER_NAME', 400, '캐릭터 이름을 입력해주세요')
      }

      if (name.length > 100) {
        logger.logError(400, '캐릭터 이름은 100자 이하여야 합니다')
        return errorResponse('INVALID_CHARACTER_NAME', 400, '캐릭터 이름은 100자 이하여야 합니다')
      }

      const { data: existingChar } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (existingChar) {
        logger.logError(400, '이미 활성 캐릭터가 존재합니다')
        return errorResponse('CHARACTER_ALREADY_EXISTS', 400, '이미 활성 캐릭터가 존재합니다')
      }

      const { data: character, error: createError } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
          name: name.trim(),
          current_prompt: '새로운 영웅',
          is_active: true,
        })
        .select()
        .single()

      if (createError) {
        logger.logError(500, createError.message)
        return errorResponse('DATABASE_ERROR', 500, createError.message)
      }

      const responseData = {
        id: character.id,
        name: character.name,
        current_prompt: character.current_prompt,
        is_active: character.is_active,
        created_at: character.created_at,
        updated_at: character.updated_at,
      }

      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      const errorMsg = (error as Error).message
      logger.logError(500, errorMsg)
      return errorResponse('INTERNAL_ERROR', 500, errorMsg)
    }
  })
)
