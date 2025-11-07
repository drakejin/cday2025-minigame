import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withLogging } from '../_shared/withLogging.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { createSupabaseClient } from '../_shared/db.ts'

serve(
  withLogging('admin-trials-delete', async (req, logger) => {
    try {
      const { error, status, admin } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)
      if (error || !admin) {
        return errorResponse(error || 'UNAUTHORIZED', status || 401)
      }

      const { trial_id } = await req.json()
      logger.setRequestBody({ trial_id })
      if (!trial_id) {
        return errorResponse('INVALID_REQUEST', 400, 'trial_id는 필수입니다')
      }

      const supabase = createSupabaseClient()

      // Prevent deletion if results exist
      const { count } = await supabase
        .from('trial_results')
        .select('id', { count: 'exact', head: true })
        .eq('trial_id', trial_id)
      if ((count || 0) > 0) {
        return errorResponse('TRIAL_HAS_RESULTS', 400, '이미 결과가 존재하여 삭제할 수 없습니다')
      }

      const { error: delError } = await supabase.from('trials').delete().eq('id', trial_id)
      if (delError) {
        return errorResponse('TRIAL_DELETE_FAILED', 500, delError.message)
      }

      logger.logSuccess(200, { deleted: true })
      return successResponse({ deleted: true })
    } catch (e) {
      return errorResponse('INTERNAL_ERROR', 500, (e as Error).message)
    }
  })
)
