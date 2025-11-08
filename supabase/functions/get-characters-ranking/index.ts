import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSupabaseClient } from '../_shared/db.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

interface LeaderboardSnapshot {
  id: string
  round_number: number
  character_id: string
  user_id: string
  rank: number
  total_score: number
  characters: {
    id: string
    name: string
    current_prompt: string | null
    user_id: string
  }
  profiles: {
    display_name: string
    avatar_url: string | null
  }
}

interface CharacterScore {
  character_id: string
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

      // Step 1: Get all completed rounds
      const { data: completedRounds, error: roundsError } = await supabase
        .from('game_rounds')
        .select('round_number')
        .eq('status', 'completed')
        .order('round_number', { ascending: true })

      // Step 2: If we have completed rounds, try to get all snapshots
      if (completedRounds && completedRounds.length > 0) {
        const roundNumbers = completedRounds.map((r) => r.round_number)

        const { data: snapshots, error: snapshotError } = await supabase
          .from('leaderboard_snapshots')
          .select(
            `
            id,
            round_number,
            character_id,
            user_id,
            rank,
            total_score,
            characters:character_id (
              id,
              name,
              current_prompt,
              user_id
            ),
            profiles:user_id (
              display_name,
              avatar_url
            )
          `
          )
          .in('round_number', roundNumbers)

        if (!snapshotError && snapshots && snapshots.length > 0) {
          // Aggregate total scores across all rounds per character
          const characterScoreMap = new Map<
            string,
            {
              character_id: string
              total_score: number
              character_name: string
              display_name: string
              avatar_url: string | null
              current_prompt: string | null
            }
          >()

          for (const snapshot of snapshots as unknown as LeaderboardSnapshot[]) {
            const existing = characterScoreMap.get(snapshot.character_id)
            if (existing) {
              existing.total_score += snapshot.total_score
            } else {
              characterScoreMap.set(snapshot.character_id, {
                character_id: snapshot.character_id,
                total_score: snapshot.total_score,
                character_name: snapshot.characters?.name || 'Unknown',
                display_name: snapshot.profiles?.display_name || 'Unknown',
                avatar_url: snapshot.profiles?.avatar_url || null,
                current_prompt: snapshot.characters?.current_prompt || null,
              })
            }
          }

          // Sort by total aggregated score
          const sorted = Array.from(characterScoreMap.values()).sort(
            (a, b) => b.total_score - a.total_score
          )

          const total = sorted.length
          const paginated = sorted.slice(offset, offset + limit)

          const leaderboard = paginated.map((entry, index) => ({
            rank: offset + index + 1,
            character_id: entry.character_id,
            character_name: entry.character_name,
            display_name: entry.display_name,
            avatar_url: entry.avatar_url,
            weighted_total: entry.total_score,
            current_prompt: entry.current_prompt,
          }))

          const responseData = {
            data: leaderboard,
            pagination: { total, limit, offset },
          }

          logger.logSuccess(200, responseData)
          return successResponse(responseData)
        }
      }

      // Step 3: No snapshots available, calculate real-time leaderboard from prompt_history
      const { data: prompts, error: promptError } = await supabase
        .from('prompt_history')
        .select('character_id, str, dex, con, int')
        .eq('is_deleted', false)

      if (promptError) {
        logger.logError(500, promptError.message)
        return errorResponse('DATABASE_ERROR', 500, promptError.message)
      }

      if (!prompts || prompts.length === 0) {
        // No prompts at all, return empty
        const responseData = {
          data: [],
          pagination: { total: 0, limit, offset },
        }
        logger.logSuccess(200, responseData)
        return successResponse(responseData)
      }

      // Aggregate stats per character
      const scoreMap = new Map<string, CharacterScore>()
      for (const p of prompts) {
        const existing = scoreMap.get(p.character_id) || {
          character_id: p.character_id,
          total_score: 0,
        }
        existing.total_score += (p.str || 0) + (p.dex || 0) + (p.con || 0) + (p.int || 0)
        scoreMap.set(p.character_id, existing)
      }

      // Sort by total_score
      const sorted = Array.from(scoreMap.values()).sort((a, b) => b.total_score - a.total_score)
      const total = sorted.length
      const characterIds = sorted.map((s) => s.character_id)

      // Fetch all character and profile info
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

      // Build character map
      const characterMap = new Map<string, CharacterWithProfile>()
      for (const char of (characters || []) as CharacterWithProfile[]) {
        characterMap.set(char.id, char)
      }

      // Apply pagination and build response
      const paginated = sorted.slice(offset, offset + limit)
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
