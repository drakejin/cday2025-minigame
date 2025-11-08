import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { verifyUser } from '../_shared/auth.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('update-profile', async (req, logger) => {
    try {
      const { error, status, user, supabase } = await verifyUser(req)
      logger.setUser(user?.id, user?.email)

      if (error || !user || !supabase) {
        const errorMsg = error ?? 'UNAUTHORIZED'
        logger.logError(status, errorMsg)
        return errorResponse(errorMsg, status)
      }

      const { display_name, avatar_url } = await req.json()
      logger.setRequestBody({ display_name, avatar_url })

      if (!display_name && !avatar_url) {
        logger.logError(400, 'At least one field is required')
        return errorResponse('MISSING_FIELDS', 400, 'At least one field is required')
      }

      const updateData: { display_name?: string; avatar_url?: string } = {}
      if (display_name) updateData.display_name = display_name
      if (avatar_url) updateData.avatar_url = avatar_url

      const { data, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          ...updateData,
        },
      })

      if (updateError) {
        logger.logError(500, updateError.message)
        return errorResponse('UPDATE_FAILED', 500, updateError.message)
      }

      const responseData = {
        user: data.user,
        message: 'Profile updated successfully',
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
