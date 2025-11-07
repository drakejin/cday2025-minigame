import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyUser } from '../_shared/auth.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('get-my-character-stats', async (req, logger) => {
    try {
      const { error: authError, status, user, supabase } = await verifyUser(req)
      logger.setUser(user?.id, user?.email)

      if (authError || !supabase) {
        logger.logError(status, authError || 'UNAUTHORIZED')
        return errorResponse(authError || 'UNAUTHORIZED', status)
      }

      // Get user's character
      const { data: character } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!character) {
        // No character yet - return zero stats
        const responseData = {
          str: 0,
          dex: 0,
          con: 0,
          int: 0,
          total: 0,
        }
        logger.logSuccess(200, responseData)
        return successResponse(responseData)
      }

      // Aggregate stats from prompt_history
      const { data: prompts } = await supabase
        .from('prompt_history')
        .select('str, dex, con, int')
        .eq('character_id', character.id)
        .eq('is_deleted', false)

      // Calculate totals
      let str = 0
      let dex = 0
      let con = 0
      let int = 0

      if (prompts && prompts.length > 0) {
        for (const prompt of prompts) {
          str += prompt.str || 0
          dex += prompt.dex || 0
          con += prompt.con || 0
          int += prompt.int || 0
        }
      }

      const total = str + dex + con + int

      const responseData = {
        str,
        dex,
        con,
        int,
        total,
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
