import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withLogging } from '../_shared/withLogging.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { createSupabaseClient } from '../_shared/db.ts'

serve(
  withLogging('get-round-trials', async (_req, logger) => {
    try {
      const supabase = createSupabaseClient()

      // Find active round
      const { data: round, error: roundError } = await supabase
        .from('game_rounds')
        .select('id, round_number, status, is_active')
        .eq('is_active', true)
        .maybeSingle()

      if (roundError || !round) {
        return errorResponse('NO_ACTIVE_ROUND', 404, '활성 라운드가 없습니다')
      }

      const { data: trials, error } = await supabase
        .from('trials')
        .select('*')
        .eq('round_id', round.id)
        .order('trial_no', { ascending: true })

      if (error) {
        return errorResponse('TRIAL_LIST_FAILED', 500, error.message)
      }

      logger.logSuccess(200, { round_id: round.id, trials })
      return successResponse({ round_id: round.id, trials })
    } catch (e) {
      return errorResponse('INTERNAL_ERROR', 500, (e as Error).message)
    }
  })
)
