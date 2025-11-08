import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-rounds-start', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const { round_id } = await req.json()
      logger.setRequestBody({ round_id })

      if (!round_id) {
        logger.logError(400, 'round_id가 필요합니다')
        return errorResponse('INVALID_REQUEST', 400, 'round_id가 필요합니다')
      }

      const { data: activeRound } = await supabase
        .from('game_rounds')
        .select('id')
        .eq('is_active', true)
        .maybeSingle()

      if (activeRound) {
        logger.logError(400, '이미 활성화된 시련가 있습니다')
        return errorResponse('ROUND_ALREADY_ACTIVE', 400, '이미 활성화된 시련가 있습니다')
      }

      const { data: round, error: updateError } = await supabase
        .from('game_rounds')
        .update({
          is_active: true,
          status: 'active',
          started_by: admin.id,
        })
        .eq('id', round_id)
        .eq('status', 'scheduled')
        .select()
        .single()

      if (updateError || !round) {
        logger.logError(400, '시련 시작에 실패했습니다')
        return errorResponse('ROUND_START_FAILED', 400, '시련 시작에 실패했습니다')
      }

      await supabase.from('admin_audit_log').insert({
        admin_id: admin.id,
        action: 'START_ROUND',
        resource_type: 'game_rounds',
        resource_id: round_id,
        changes: { status: 'scheduled -> active' },
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
