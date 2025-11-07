import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-users-unban', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const { user_id } = await req.json()
      logger.setRequestBody({ user_id })

      if (!user_id) {
        logger.logError(400, 'user_id가 필요합니다')
        return errorResponse('INVALID_REQUEST', 400, 'user_id가 필요합니다')
      }

      // 1. Unban 처리
      const { data, error: updateError } = await supabase.auth.admin.updateUserById(user_id, {
        ban_duration: 'none',
      })

      if (updateError) {
        logger.logError(500, updateError.message)
        return errorResponse('UNBAN_FAILED', 500, updateError.message)
      }

      // 2. Audit log
      await supabase.from('admin_audit_log').insert({
        admin_id: admin.id,
        action: 'UNBAN_USER',
        resource_type: 'auth.users',
        resource_id: user_id,
        changes: { unbanned: true },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
      })

      const responseData = {
        message: 'User unbanned successfully',
        user: data.user,
      }
      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      logger.logError(500, (error as Error).message)
      return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
    }
  })
)
