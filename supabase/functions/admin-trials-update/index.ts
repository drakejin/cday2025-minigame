import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { createSupabaseClient } from '../_shared/db.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-trials-update', async (req, logger) => {
    try {
      const { error, status, admin } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)
      if (error || !admin) {
        return errorResponse(error || 'UNAUTHORIZED', status || 401)
      }

      const { trial_id, level, weight_multiplier, status: trialStatus } = await req.json()
      logger.setRequestBody({ trial_id, level, weight_multiplier, status: trialStatus })

      if (!trial_id) {
        return errorResponse('INVALID_REQUEST', 400, 'trial_id는 필수입니다')
      }

      const payload: Record<string, unknown> = {}
      if (level !== undefined) {
        if (![1, 2, 3].includes(level))
          return errorResponse('INVALID_LEVEL', 400, 'level은 1,2,3 중 하나')
        payload.level = level
      }
      if (weight_multiplier !== undefined) {
        if (![1, 2, 3, 4].includes(weight_multiplier))
          return errorResponse('INVALID_WEIGHT', 400, 'weight_multiplier는 1,2,3,4 중 하나')
        payload.weight_multiplier = weight_multiplier
      }
      if (trialStatus !== undefined) {
        if (!['scheduled', 'active', 'completed', 'cancelled'].includes(trialStatus))
          return errorResponse('INVALID_STATUS', 400, 'status 값이 올바르지 않습니다')
        payload.status = trialStatus
      }

      if (Object.keys(payload).length === 0) {
        return errorResponse('INVALID_REQUEST', 400, '업데이트할 필드가 없습니다')
      }

      const supabase = createSupabaseClient()
      const { data: trial, error: updateError } = await supabase
        .from('trials')
        .update(payload)
        .eq('id', trial_id)
        .select('*')
        .single()

      if (updateError || !trial) {
        return errorResponse(
          'TRIAL_UPDATE_FAILED',
          500,
          updateError?.message || '시련 업데이트 실패'
        )
      }

      logger.logSuccess(200, { trial })
      return successResponse({ trial })
    } catch (e) {
      return errorResponse('INTERNAL_ERROR', 500, (e as Error).message)
    }
  })
)
