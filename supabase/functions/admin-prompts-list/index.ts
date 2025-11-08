import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { keysToCamelCase } from '../_shared/camelCase.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('admin-prompts-list', async (req, logger) => {
    try {
      const { error, status, admin, supabase } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)

      if (error || !admin || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const { user_id, round_number, limit = 50, offset = 0 } = await req.json()
      logger.setRequestBody({ user_id, round_number, limit, offset })

      let query = supabase.from('prompt_history').select(
        `
        *,
        characters!inner(name, user_id),
        profiles!inner(email)
      `,
        { count: 'exact' }
      )

      // 필터링
      if (user_id) {
        query = query.eq('user_id', user_id)
      }

      if (round_number) {
        query = query.eq('round_number', round_number)
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

      const { data: prompts, error: queryError, count } = await query

      if (queryError) {
        logger.logError(500, queryError.message)
        return errorResponse('DATABASE_ERROR', 500, queryError.message)
      }

      const responseData = {
        prompts: keysToCamelCase(prompts || []),
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
