import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-rounds-cancel', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const { round_id, reason } = await req.json()
      logger.setRequestBody({ round_id, reason })

      if (!round_id) {
        logger.logError(400, 'round_id가 필요합니다')
        return errorResponse('INVALID_REQUEST', 400, 'round_id가 필요합니다')
      }

      // 시련 취소
      const { data: round, error: updateError } = await supabase
        .from('game_rounds')
        .update({
          is_active: false,
          status: 'cancelled',
          trial_text: reason || 'Admin cancelled',
        })
        .eq('id', round_id)
        .in('status', ['scheduled', 'active'])
        .select()
        .single()

      if (updateError || !round) {
        logger.logError(400, '시련 취소 실패 (이미 완료되었거나 존재하지 않음)')
        return errorResponse(
          'ROUND_CANCEL_FAILED',
          400,
          '시련 취소 실패 (이미 완료되었거나 존재하지 않음)'
        )
      }

      // Audit log
      await supabase.from('admin_audit_log').insert({
        admin_id: admin.id,
        action: 'CANCEL_ROUND',
        resource_type: 'game_rounds',
        resource_id: round_id,
        changes: { status: `${round.status} -> cancelled`, reason },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
      })

      const responseData = { round }
      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      logger.logError(500, (error as Error).message)
      return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
    }
  })
)
