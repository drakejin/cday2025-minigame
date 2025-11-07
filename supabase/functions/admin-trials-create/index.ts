import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withLogging } from '../_shared/withLogging.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { createSupabaseClient } from '../_shared/db.ts'

serve(
  withLogging('admin-trials-create', async (req, logger) => {
    try {
      const { error, status, admin } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)
      if (error || !admin) {
        return errorResponse(error || 'UNAUTHORIZED', status || 401)
      }

      const { round_id, trial_no, level, weight_multiplier } = await req.json()
      logger.setRequestBody({ round_id, trial_no, level, weight_multiplier })

      if (!round_id || !trial_no || !level) {
        return errorResponse('INVALID_REQUEST', 400, 'round_id, trial_no, level는 필수입니다')
      }
      if (![1, 2, 3].includes(trial_no)) {
        return errorResponse('INVALID_TRIAL_NO', 400, 'trial_no는 1,2,3 중 하나여야 합니다')
      }
      if (![1, 2, 3].includes(level)) {
        return errorResponse('INVALID_LEVEL', 400, 'level은 1,2,3 중 하나여야 합니다')
      }
      const multiplier = weight_multiplier ?? (level === 1 ? 1 : level === 2 ? 2 : 4)
      if (![1, 2, 3, 4].includes(multiplier)) {
        return errorResponse(
          'INVALID_WEIGHT',
          400,
          'weight_multiplier는 1,2,3,4 중 하나여야 합니다'
        )
      }

      const supabase = createSupabaseClient()

      // Ensure round exists
      const { data: round } = await supabase
        .from('game_rounds')
        .select('id')
        .eq('id', round_id)
        .maybeSingle()
      if (!round) {
        return errorResponse('ROUND_NOT_FOUND', 404, '해당 라운드가 존재하지 않습니다')
      }

      // Upsert trial (unique per round_id + trial_no)
      const { data: trial, error: upsertError } = await supabase
        .from('trials')
        .upsert(
          {
            round_id,
            trial_no,
            level,
            weight_multiplier: multiplier,
            status: 'scheduled',
          },
          { onConflict: 'round_id,trial_no' }
        )
        .select('*')
        .single()

      if (upsertError || !trial) {
        return errorResponse('TRIAL_CREATE_FAILED', 500, upsertError?.message || '시련 생성 실패')
      }

      logger.logSuccess(200, { trial })
      return successResponse({ trial })
    } catch (e) {
      return errorResponse('INTERNAL_ERROR', 500, (e as Error).message)
    }
  })
)
