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

      const {
        data: characters,
        error,
        count,
      } = await supabase
        .from('characters')
        .select(
          `
          id,
          name,
          current_prompt,
          total_score,
          strength,
          charm,
          creativity,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `,
          { count: 'exact' }
        )
        .eq('is_active', true)
        .order('total_score', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        logger.logError(500, error.message)
        return errorResponse('DATABASE_ERROR', 500, error.message)
      }

      const leaderboard =
        characters?.map((char: any, index: number) => ({
          rank: offset + index + 1,
          character_id: char.id,
          character_name: char.name,
          display_name: char.profiles?.display_name || 'Unknown',
          avatar_url: char.profiles?.avatar_url || null,
          total_score: char.total_score,
          strength: char.strength,
          charm: char.charm,
          creativity: char.creativity,
          current_prompt: char.current_prompt,
        })) || []

      const responseData = {
        data: leaderboard,
        pagination: {
          total: count || 0,
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
