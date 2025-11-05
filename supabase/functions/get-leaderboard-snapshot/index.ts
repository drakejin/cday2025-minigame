import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSupabaseClient } from '../_shared/db.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('get-leaderboard-snapshot', async (req, logger) => {
    try {
      const { roundNumber, limit = 100, offset = 0 } = await req.json()
      logger.setRequestBody({ roundNumber, limit, offset })

      if (!roundNumber) {
        logger.logError(400, 'Round number is required')
        return errorResponse('MISSING_ROUND_NUMBER', 400, 'Round number is required')
      }

      const supabase = createSupabaseClient()

      const { data: snapshot, error: snapshotError } = await supabase
        .from('leaderboard_snapshots')
        .select('*')
        .eq('round_number', roundNumber)
        .order('rank', { ascending: true })
        .range(offset, offset + limit - 1)

      if (snapshotError) {
        logger.logError(500, snapshotError.message)
        return errorResponse('DATABASE_ERROR', 500, snapshotError.message)
      }

      const responseData = snapshot || []
      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      const errorMsg = (error as Error).message
      logger.logError(500, errorMsg)
      return errorResponse('INTERNAL_ERROR', 500, errorMsg)
    }
  })
)
