import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { keysToCamelCase } from '../_shared/camelCase.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-audit-log', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const {
        action,
        admin_id,
        resource_type,
        start_date,
        end_date,
        limit = 50,
        offset = 0,
      } = await req.json()
      logger.setRequestBody({
        action,
        admin_id,
        resource_type,
        start_date,
        end_date,
        limit,
        offset,
      })

      let query = supabase.from('admin_audit_log').select('*', { count: 'exact' })

      // 필터링
      if (action) {
        query = query.eq('action', action)
      }

      if (admin_id) {
        query = query.eq('admin_id', admin_id)
      }

      if (resource_type) {
        query = query.eq('resource_type', resource_type)
      }

      if (start_date) {
        query = query.gte('created_at', start_date)
      }

      if (end_date) {
        query = query.lte('created_at', end_date)
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

      const { data: logs, error: queryError, count } = await query

      if (queryError) {
        logger.logError(500, queryError.message)
        return errorResponse('DATABASE_ERROR', 500, queryError.message)
      }

      const responseData = {
        logs: keysToCamelCase(logs || []),
        total: count || 0,
        limit,
        offset,
      }
      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      logger.logError(500, (error as Error).message)
      return errorResponse('INTERNAL_ERROR', 500, (error as Error).message)
    }
  })
)
