import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-rounds-create', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const { start_time, end_time, trial_text } = await req.json()
      logger.setRequestBody({ start_time, end_time, trial_text })

      if (!start_time || !end_time) {
        logger.logError(400, 'start_time과 end_time이 필요합니다')
        return errorResponse('INVALID_REQUEST', 400, 'start_time과 end_time이 필요합니다')
      }

      const startDate = new Date(start_time)
      const endDate = new Date(end_time)

      if (startDate >= endDate) {
        logger.logError(400, 'start_time은 end_time보다 이전이어야 합니다')
        return errorResponse(
          'INVALID_TIME_RANGE',
          400,
          'start_time은 end_time보다 이전이어야 합니다'
        )
      }

      const { data: lastRound } = await supabase
        .from('game_rounds')
        .select('round_number')
        .order('round_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextRoundNumber = lastRound ? lastRound.round_number + 1 : 1

      const { data: round, error: createError } = await supabase
        .from('game_rounds')
        .insert({
          round_number: nextRoundNumber,
          start_time: start_time,
          end_time: end_time,
          is_active: false,
          status: 'scheduled',
          trial_text: trial_text || null,
        })
        .select()
        .single()

      if (createError || !round) {
        logger.logError(500, createError?.message || '시련 생성 실패')
        return errorResponse('ROUND_CREATE_FAILED', 500, createError?.message || '시련 생성 실패')
      }

      await supabase.from('admin_audit_log').insert({
        admin_id: admin.id,
        action: 'CREATE_ROUND',
        resource_type: 'game_rounds',
        resource_id: round.id,
        changes: { round_number: nextRoundNumber, start_time, end_time },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
      })

      logger.logSuccess(200, { round })
      return successResponse({ round })
    } catch (error) {
      const errorMsg = (error as Error).message
      logger.logError(500, errorMsg)
      return errorResponse('INTERNAL_ERROR', 500, errorMsg)
    }
  })
)
