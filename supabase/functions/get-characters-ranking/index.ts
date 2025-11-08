import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createSupabaseClient } from '../_shared/db.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('get-characters-ranking', async (req, logger) => {
    try {
      const supabase = createSupabaseClient()
      const url = new URL(req.url)
      const limit = parseInt(url.searchParams.get('limit') || '100', 10)
      const offset = parseInt(url.searchParams.get('offset') || '0', 10)

      // Step 1: Get all completed rounds
      const { data: completedRounds } = await supabase
        .from('game_rounds')
        .select('round_number')
        .eq('status', 'completed')
        .order('round_number', { ascending: true })

      // Step 2: If we have completed rounds, try to get all snapshots
      if (completedRounds && completedRounds.length > 0) {
        const roundNumbers = completedRounds.map((r: { round_number: number }) => r.round_number)

        // Get snapshots without auto-join
        const { data: snapshots, error: snapshotError } = await supabase
          .from('leaderboard_snapshots')
          .select('id, round_number, character_id, user_id, rank, total_score')
          .in('round_number', roundNumbers)

        if (!snapshotError && snapshots && snapshots.length > 0) {
          // Aggregate total scores across all rounds per character
          const characterScoreMap = new Map<
            string,
            {
              character_id: string
              user_id: string
              total_score: number
            }
          >()

          for (const snapshot of snapshots) {
            const existing = characterScoreMap.get(snapshot.character_id)
            if (existing) {
              existing.total_score += snapshot.total_score
            } else {
              characterScoreMap.set(snapshot.character_id, {
                character_id: snapshot.character_id,
                user_id: snapshot.user_id,
                total_score: snapshot.total_score,
              })
            }
          }

          // Get all unique character_ids and user_ids
          const characterIds = Array.from(characterScoreMap.keys())
          const userIds = Array.from(
            new Set(Array.from(characterScoreMap.values()).map((c) => c.user_id))
          )

          // Fetch characters separately
          const { data: characters, error: charError } = await supabase
            .from('characters')
            .select('id, name, current_prompt, user_id')
            .in('id', characterIds)
            .eq('is_active', true)

          if (charError) {
            logger.logError(500, charError.message)
            return errorResponse('DATABASE_ERROR', 500, charError.message)
          }

          // Fetch profiles separately
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', userIds)

          if (profileError) {
            logger.logError(500, profileError.message)
            return errorResponse('DATABASE_ERROR', 500, profileError.message)
          }

          // Build maps for quick lookup
          const characterMap = new Map((characters || []).map((c: any) => [c.id, c]))
          const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

          // Combine data
          const combined = Array.from(characterScoreMap.values()).map((score) => {
            const character = characterMap.get(score.character_id)
            const profile = profileMap.get(score.user_id)

            return {
              character_id: score.character_id,
              total_score: score.total_score,
              character_name: character?.name || 'Unknown',
              display_name: profile?.display_name || 'Unknown',
              avatar_url: profile?.avatar_url || null,
              current_prompt: character?.current_prompt || null,
            }
          })

          // Sort by total aggregated score
          const sorted = combined.sort((a, b) => b.total_score - a.total_score)

          const total = sorted.length
          const paginated = sorted.slice(offset, offset + limit)

          const leaderboard = paginated.map((entry, index) => ({
            rank: offset + index + 1,
            character_id: entry.character_id,
            character_name: entry.character_name,
            display_name: entry.display_name,
            avatar_url: entry.avatar_url,
            total_score: entry.total_score,
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

      // Step 3: No snapshots available, show all characters with 0 score
      // Fetch characters and profiles separately
      const { data: characters, error: charError } = await supabase
        .from('characters')
        .select('id, name, current_prompt, user_id')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (charError) {
        logger.logError(500, charError.message)
        return errorResponse('DATABASE_ERROR', 500, charError.message)
      }

      if (!characters || characters.length === 0) {
        const responseData = {
          data: [],
          pagination: { total: 0, limit, offset },
        }
        logger.logSuccess(200, responseData)
        return successResponse(responseData)
      }

      // Get all unique user_ids
      const userIds = Array.from(new Set(characters.map((c: any) => c.user_id)))

      // Fetch profiles separately
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds)

      if (profileError) {
        logger.logError(500, profileError.message)
        return errorResponse('DATABASE_ERROR', 500, profileError.message)
      }

      // Build profile map
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

      // Combine data
      const combined = characters.map((char: any) => {
        const profile = profileMap.get(char.user_id)
        return {
          character_id: char.id,
          character_name: char.name || 'Unknown',
          display_name: profile?.display_name || 'Unknown',
          avatar_url: profile?.avatar_url || null,
          total_score: 0,
          current_prompt: char.current_prompt || null,
        }
      })

      // Apply pagination
      const total = combined.length
      const paginated = combined.slice(offset, offset + limit)

      const leaderboard = paginated.map((entry, index) => ({
        rank: offset + index + 1,
        character_id: entry.character_id,
        character_name: entry.character_name,
        display_name: entry.display_name,
        avatar_url: entry.avatar_url,
        total_score: entry.total_score,
        current_prompt: entry.current_prompt,
      }))

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
