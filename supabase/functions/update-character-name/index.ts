import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyUser } from '../_shared/auth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('update-character-name', async (req, logger) => {
    try {
      const { error: authError, status, user, supabase } = await verifyUser(req)
      logger.setUser(user?.id, user?.email)

      if (authError || !supabase) {
        logger.logError(status, authError || 'UNAUTHORIZED')
        return errorResponse(authError || 'UNAUTHORIZED', status)
      }

      const { character_id, name } = await req.json()
      logger.setRequestBody({ character_id, name })

      if (!character_id || !name) {
        logger.logError(400, 'character_id와 name이 필요합니다')
        return errorResponse('INVALID_REQUEST', 400, 'character_id와 name이 필요합니다')
      }

      if (name.length > 100) {
        logger.logError(400, '이름은 100자 이하여야 합니다')
        return errorResponse('INVALID_CHARACTER_NAME', 400, '이름은 100자 이하여야 합니다')
      }

      const { data: character } = await supabase
        .from('characters')
        .select('id')
        .eq('id', character_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!character) {
        logger.logError(404, '캐릭터를 찾을 수 없습니다')
        return errorResponse('CHARACTER_NOT_FOUND', 404, '캐릭터를 찾을 수 없습니다')
      }

      const { data: updated, error: updateError } = await supabase
        .from('characters')
        .update({ name: name.trim() })
        .eq('id', character_id)
        .select()
        .single()

      if (updateError) {
        logger.logError(500, updateError.message)
        return errorResponse('DATABASE_ERROR', 500, updateError.message)
      }

      const responseData = {
        id: updated.id,
        name: updated.name,
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
