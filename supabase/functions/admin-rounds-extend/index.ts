import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-rounds-extend', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const { round_id, new_end_time } = await req.json()
      logger.setRequestBody({ round_id, new_end_time })

      if (!round_id || !new_end_time) {
        logger.logError(400, 'round_id와 new_end_time이 필요합니다')
        return errorResponse('INVALID_REQUEST', 400, 'round_id와 new_end_time이 필요합니다')
      }

      // 시련 조회
      const { data: round } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('id', round_id)
        .single()

      if (!round) {
        logger.logError(404, '시련를 찾을 수 없습니다')
        return errorResponse('ROUND_NOT_FOUND', 404, '시련를 찾을 수 없습니다')
      }

      // 새 종료 시간 검증
      const newEndDate = new Date(new_end_time)
      const startDate = new Date(round.start_time)

      if (newEndDate <= startDate) {
        logger.logError(400, 'new_end_time은 start_time보다 이후여야 합니다')
        return errorResponse(
          'INVALID_TIME_RANGE',
          400,
          'new_end_time은 start_time보다 이후여야 합니다'
        )
      }

      // 시련 연장
      const { data: updated, error: updateError } = await supabase
        .from('game_rounds')
        .update({ end_time: new_end_time })
        .eq('id', round_id)
        .select()
        .single()

      if (updateError) {
        logger.logError(500, updateError.message)
        return errorResponse('ROUND_EXTEND_FAILED', 500, updateError.message)
      }

      // Audit log
      await supabase.from('admin_audit_log').insert({
        admin_id: admin.id,
        action: 'EXTEND_ROUND',
        resource_type: 'game_rounds',
        resource_id: round_id,
        changes: { old_end_time: round.end_time, new_end_time },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
      })

      const responseData = { round: updated }
      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      logger.logError(500, (error as Error).message)
      return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
    }
  })
)
