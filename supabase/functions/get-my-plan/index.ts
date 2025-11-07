// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withLogging } from '../_shared/withLogging.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyUser } from '../_shared/auth.ts'
import { createSupabaseClient } from '../_shared/db.ts'

serve(
  withLogging('get-my-plan', async (req, logger) => {
    try {
      const { error, status, user } = await verifyUser(req)
      logger.setUser(user?.id, user?.email)
      if (error || !user) return errorResponse(error || 'UNAUTHORIZED', status || 401)

      const supabase = createSupabaseClient()

      // Get active character
      const { data: character } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!character) {
        return errorResponse('CHARACTER_NOT_FOUND', 404, '활성 캐릭터가 없습니다')
      }

      const { data: plan } = await supabase
        .from('character_plans')
        .select('*')
        .eq('character_id', character.id)
        .maybeSingle()

      return successResponse({ character_id: character.id, plan: plan || null })
    } catch (e) {
      return errorResponse('INTERNAL_ERROR', 500, (e as Error).message)
    }
  })
)
