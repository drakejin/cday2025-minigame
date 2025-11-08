import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { keysToCamelCase } from '../_shared/camelCase.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-rounds-list', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const { statusFilter, limit = 50, offset = 0 } = await req.json()
      logger.setRequestBody({ statusFilter, limit, offset })

      let query = supabase.from('game_rounds').select('*', { count: 'exact' })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      query = query.order('round_number', { ascending: false }).range(offset, offset + limit - 1)

      const { data: rounds, error: queryError, count } = await query

      if (queryError) {
        logger.logError(500, queryError.message)
        return errorResponse('DATABASE_ERROR', 500, queryError.message)
      }

      const responseData = {
        rounds: keysToCamelCase(rounds || []),
        total: count || 0,
        limit,
        offset,
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
