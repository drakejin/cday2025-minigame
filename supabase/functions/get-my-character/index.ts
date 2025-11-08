import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyUser } from '../_shared/auth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('get-my-character', async (req, logger) => {
    try {
      const { error: authError, status, user, supabase } = await verifyUser(req)
      logger.setUser(user?.id, user?.email)

      if (authError || !supabase) {
        logger.logError(status, authError || 'UNAUTHORIZED')
        return errorResponse(authError || 'UNAUTHORIZED', status)
      }

      const { data: character, error: charError } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (charError) {
        logger.logError(500, charError.message)
        return errorResponse('DATABASE_ERROR', 500, charError.message)
      }

      if (!character) {
        logger.logSuccess(200, null)
        return successResponse(null)
      }

      // Get last submission round
      const { data: lastPrompt } = await supabase
        .from('prompt_history')
        .select('round_number')
        .eq('character_id', character.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const responseData = {
        id: character.id,
        name: character.name,
        current_prompt: character.current_prompt,
        is_active: character.is_active,
        created_at: character.created_at,
        updated_at: character.updated_at,
        last_submission_round: lastPrompt?.round_number,
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
