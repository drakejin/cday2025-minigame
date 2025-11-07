import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-users-ban', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const { user_id, reason, duration_hours } = await req.json()
      logger.setRequestBody({ user_id, reason, duration_hours })

      if (!user_id || !reason) {
        logger.logError(400, 'user_id와 reason이 필요합니다')
        return errorResponse('INVALID_REQUEST', 400, 'user_id와 reason이 필요합니다')
      }

      // Ban 기한 계산
      const bannedUntil = duration_hours
        ? new Date(Date.now() + duration_hours * 60 * 60 * 1000).toISOString()
        : null

      // 1. 사용자 Ban
      const { data, error: updateError } = await supabase.auth.admin.updateUserById(user_id, {
        ban_duration: duration_hours ? `${duration_hours}h` : 'indefinite',
      })

      if (updateError) {
        logger.logError(500, updateError.message)
        return errorResponse('BAN_FAILED', 500, updateError.message)
      }

      // 2. Audit log
      await supabase.from('admin_audit_log').insert({
        admin_id: admin.id,
        action: 'BAN_USER',
        resource_type: 'auth.users',
        resource_id: user_id,
        changes: {
          reason,
          duration_hours: duration_hours || 'indefinite',
          banned_until: bannedUntil,
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
      })

      const responseData = {
        message: 'User banned successfully',
        user: data.user,
        banned_until: bannedUntil,
      }
      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      logger.logError(500, (error as Error).message)
      return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
    }
  })
)
