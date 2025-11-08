import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyUser } from '../_shared/auth.ts'
import { keysToCamelCase } from '../_shared/camelCase.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('get-my-profile', async (req, logger) => {
    try {
      const { error, status, user, supabase } = await verifyUser(req)
      logger.setUser(user?.id, user?.email)

      if (error || !user || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url, role, created_at, updated_at')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        const errorMsg = profileError?.message || 'Profile not found'
        logger.logError(404, errorMsg)
        return errorResponse('PROFILE_NOT_FOUND', 404, 'Profile not found')
      }

      const responseData = { profile: keysToCamelCase(profile) }
      logger.logSuccess(200, responseData)
      return successResponse(responseData)
    } catch (error) {
      const errorMsg = (error as Error).message
      logger.logError(500, errorMsg)
      return errorResponse('INTERNAL_ERROR', 500, errorMsg)
    }
  })
)
