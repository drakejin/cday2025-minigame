import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withLogging } from '../_shared/withLogging.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { createSupabaseClient } from '../_shared/db.ts'

serve(
  withLogging('admin-trials-list', async (req, logger) => {
    try {
      const { error, status, admin } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)
      if (error || !admin) {
        return errorResponse(error || 'UNAUTHORIZED', status || 401)
      }

      const url = new URL(req.url)
      const roundId = url.searchParams.get('round_id')
      const roundNumber = url.searchParams.get('round_number')

      const supabase = createSupabaseClient()
      let roundIdToUse = roundId

      if (!roundIdToUse && roundNumber) {
        const { data: round } = await supabase
          .from('game_rounds')
          .select('id')
          .eq('round_number', Number(roundNumber))
          .maybeSingle()
        roundIdToUse = round?.id || null
      }

      if (!roundIdToUse) {
        return errorResponse('INVALID_REQUEST', 400, 'round_id 또는 round_number가 필요합니다')
      }

      const { data: trials, error: listError } = await supabase
        .from('trials')
        .select('*')
        .eq('round_id', roundIdToUse)
        .order('trial_no', { ascending: true })

      if (listError) {
        return errorResponse('TRIAL_LIST_FAILED', 500, listError.message)
      }

      logger.logSuccess(200, { trials })
      return successResponse({ trials })
    } catch (e) {
      return errorResponse('INTERNAL_ERROR', 500, (e as Error).message)
    }
  })
)
