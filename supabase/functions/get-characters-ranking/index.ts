import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSupabaseClient } from '../_shared/db.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('get-characters-ranking', async (req, logger) => {
    try {
      const supabase = createSupabaseClient()
      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '100')
      const offset = parseInt(url.searchParams.get('offset') || '0')

      // Aggregate from prompt_history (scores stored in prompt_history now)
      const { data: aggregated, error } = await supabase
        .from('v_weighted_scores')
        .select('character_id, weighted_total')
        .order('weighted_total', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data: allCount } = await supabase
        .from('v_weighted_scores')
        .select('character_id', { count: 'exact', head: true })

      if (error) {
        logger.logError(500, error.message)
        return errorResponse('DATABASE_ERROR', 500, error.message)
      }

      // Fetch character/profile info for the page of results
      const ids = (aggregated || []).map((r: any) => r.character_id)
      let characters: any[] = []
      if (ids.length > 0) {
        const { data: chars } = await supabase
          .from('characters')
          .select(
            `
            id,
            name,
            current_prompt,
            profiles:user_id (
              display_name,
              avatar_url
            )
          `
          )
          .in('id', ids)
        characters = chars || []
      }

      const leaderboard =
        aggregated?.map((row: any, index: number) => {
          const char = characters.find((c: any) => c.id === row.character_id)
          return {
            rank: offset + index + 1,
            character_id: row.character_id,
            character_name: char?.name || 'Unknown',
            display_name: char?.profiles?.display_name || 'Unknown',
            avatar_url: char?.profiles?.avatar_url || null,
            weighted_total: row.weighted_total,
            current_prompt: char?.current_prompt || null,
          }
        }) || []

      const responseData = {
        data: leaderboard,
        pagination: {
          total: allCount || 0,
          limit,
          offset,
        },
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
