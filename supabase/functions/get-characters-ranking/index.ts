import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSupabaseClient } from '../_shared/db.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

interface CharacterScore {
  character_id: string
  total_str: number
  total_dex: number
  total_con: number
  total_int: number
  total_score: number
}

interface CharacterWithProfile {
  id: string
  name: string
  current_prompt: string | null
  user_id: string
  profiles: {
    display_name: string
    avatar_url: string | null
  }
}

serve(
  withLogging('get-characters-ranking', async (req, logger) => {
    try {
      const supabase = createSupabaseClient()
      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '100', 10)
      const offset = parseInt(url.searchParams.get('offset') || '0', 10)

      // Step 1: Get all active characters with their prompts
      const { data: prompts, error: promptError } = await supabase
        .from('prompt_history')
        .select('character_id, str, dex, con, int')
        .eq('is_deleted', false)

      if (promptError) {
        logger.logError(500, promptError.message)
        return errorResponse('DATABASE_ERROR', 500, promptError.message)
      }

      if (!prompts || prompts.length === 0) {
        const responseData = {
          data: [],
          pagination: { total: 0, limit, offset },
        }
        logger.logSuccess(200, responseData)
        return successResponse(responseData)
      }

      // Step 2: Aggregate stats per character
      const scoreMap = new Map<string, CharacterScore>()
      for (const p of prompts) {
        const existing = scoreMap.get(p.character_id) || {
          character_id: p.character_id,
          total_str: 0,
          total_dex: 0,
          total_con: 0,
          total_int: 0,
          total_score: 0,
        }
        existing.total_str += p.str || 0
        existing.total_dex += p.dex || 0
        existing.total_con += p.con || 0
        existing.total_int += p.int || 0
        existing.total_score = existing.total_str + existing.total_dex + existing.total_con + existing.total_int
        scoreMap.set(p.character_id, existing)
      }

      // Step 3: Sort by total_score and apply pagination
      const sorted = Array.from(scoreMap.values()).sort((a, b) => b.total_score - a.total_score)
      const total = sorted.length
      const paginated = sorted.slice(offset, offset + limit)
      const characterIds = paginated.map((s) => s.character_id)

      // Step 4: Fetch character and profile info
      const { data: characters, error: charError } = await supabase
        .from('characters')
        .select(
          `
          id,
          name,
          current_prompt,
          user_id,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `
        )
        .in('id', characterIds)
        .eq('is_active', true)

      if (charError) {
        logger.logError(500, charError.message)
        return errorResponse('DATABASE_ERROR', 500, charError.message)
      }

      // Step 5: Build leaderboard with character info
      const characterMap = new Map<string, CharacterWithProfile>()
      for (const char of (characters || []) as CharacterWithProfile[]) {
        characterMap.set(char.id, char)
      }

      const leaderboard = paginated.map((score, index) => {
        const char = characterMap.get(score.character_id)
        return {
          rank: offset + index + 1,
          character_id: score.character_id,
          character_name: char?.name || 'Unknown',
          display_name: char?.profiles?.display_name || 'Unknown',
          avatar_url: char?.profiles?.avatar_url || null,
          weighted_total: score.total_score,
          current_prompt: char?.current_prompt || null,
        }
      })

      const responseData = {
        data: leaderboard,
        pagination: { total, limit, offset },
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
