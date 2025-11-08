import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-rounds-end', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      logger.setRequestBody({})

      const { data: currentRound } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      if (!currentRound) {
        logger.logError(400, '활성화된 시련가 없습니다')
        return errorResponse('NO_ACTIVE_ROUND', 400, '활성화된 시련가 없습니다')
      }

      const { data: round, error: updateError } = await supabase
        .from('game_rounds')
        .update({
          is_active: false,
          status: 'completed',
          actual_end_time: new Date().toISOString(),
          ended_by: admin.id,
        })
        .eq('id', currentRound.id)
        .select()
        .single()

      if (updateError || !round) {
        logger.logError(400, '시련 종료에 실패했습니다')
        return errorResponse('ROUND_END_FAILED', 400, '시련 종료에 실패했습니다')
      }

      await supabase.from('admin_audit_log').insert({
        admin_id: admin.id,
        action: 'END_ROUND',
        resource_type: 'game_rounds',
        resource_id: currentRound.id,
        changes: {
          status: 'active -> completed',
          round_number: currentRound.round_number,
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
      })

      const responseData = {
        round,
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
