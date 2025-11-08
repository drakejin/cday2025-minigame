import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyUser } from '../_shared/auth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('get-my-character-plan', async (req, logger) => {
    try {
      const { error: authError, status, user, supabase } = await verifyUser(req)
      logger.setUser(user?.id, user?.email)

      if (authError || !supabase || !user) {
        logger.logError(status, authError || 'UNAUTHORIZED')
        return errorResponse(authError || 'UNAUTHORIZED', status)
      }

      const { data: character } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!character) {
        logger.logSuccess(200, null)
        return successResponse(null)
      }

      const { data: plan, error: planError } = await supabase
        .from('character_plans')
        .select('*')
        .eq('character_id', character.id)
        .maybeSingle()

      if (planError) {
        logger.logError(500, planError.message)
        return errorResponse('DATABASE_ERROR', 500, planError.message)
      }

      logger.logSuccess(200, plan)
      return successResponse(plan)
    } catch (error) {
      const errorMsg = (error as Error).message
      logger.logError(500, errorMsg)
      return errorResponse('INTERNAL_ERROR', 500, errorMsg)
    }
  })
)
