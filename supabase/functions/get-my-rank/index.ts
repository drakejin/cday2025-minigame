import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('get-my-rank', async (req, logger) => {
    try {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        logger.logError(401, 'Unauthorized')
        return errorResponse('Unauthorized', 401)
      }

      const token = authHeader.replace('Bearer ', '')
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const {
        data: { user },
      } = await supabase.auth.getUser(token)

      logger.setUser(user?.id, user?.email)

      if (!user) {
        logger.logError(401, 'Unauthorized')
        return errorResponse('Unauthorized', 401)
      }

      const { character_id } = await req.json()
      logger.setRequestBody({ character_id })

      const { data: myCharacter, error: charError } = await supabase
        .from('characters')
        .select('id')
        .eq('id', character_id)
        .eq('is_active', true)
        .single()

      if (charError || !myCharacter) {
        logger.logError(404, 'CHARACTER_NOT_FOUND')
        return errorResponse('CHARACTER_NOT_FOUND', 404)
      }

      // Weighted totals from view
      const { data: myScoreRow } = await supabase
        .from('v_weighted_scores')
        .select('character_id, weighted_total')
        .eq('character_id', character_id)
        .maybeSingle()

      const myWeighted = myScoreRow?.weighted_total || 0

      const { data: higherRows } = await supabase
        .from('v_weighted_scores')
        .select('character_id, weighted_total')
        .gt('weighted_total', myWeighted)

      const { data: totalRows } = await supabase
        .from('v_weighted_scores')
        .select('character_id')

      const higherCount = higherRows?.length || 0
      const totalParticipants = totalRows?.length || 0
      const rank = higherCount + 1
      const percentile = totalParticipants
        ? ((totalParticipants - rank + 1) / totalParticipants) * 100
        : 0

      const responseData = {
        rank,
        total_participants: totalParticipants,
        percentile: Math.round(percentile * 10) / 10,
        character: { weighted_total: myWeighted },
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
