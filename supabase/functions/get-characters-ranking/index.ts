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

      // Step 1: Get the latest completed round
      const { data: completedRounds } = await supabase
        .from('game_rounds')
        .select('round_number')
        .eq('status', 'completed')
        .order('round_number', { ascending: false })
        .limit(1)

      // Step 2: If we have a completed round, get snapshots from that round only
      if (completedRounds && completedRounds.length > 0) {
        const latestRoundNumber = completedRounds[0].round_number

        // Get snapshots from the latest round only
        const { data: snapshots, error: snapshotError } = await supabase
          .from('leaderboard_snapshots')
          .select('id, round_number, character_id, user_id, rank, total_score')
          .eq('round_number', latestRoundNumber)

        if (!snapshotError && snapshots && snapshots.length > 0) {
          // Build character score map (no aggregation needed - one snapshot per character)
          const characterScoreMap = new Map<
            string,
            {
              character_id: string
              user_id: string
              total_score: number
            }
          >()

          for (const snapshot of snapshots) {
            characterScoreMap.set(snapshot.character_id, {
              character_id: snapshot.character_id,
              user_id: snapshot.user_id,
              total_score: snapshot.total_score,
            })
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

          // Fetch latest round prompts and skills
          const { data: prompts, error: promptError } = await supabase
            .from('prompt_history')
            .select('character_id, prompt, skill')
            .in('character_id', characterIds)
            .eq('round_number', latestRoundNumber)
            .eq('is_deleted', false)

          if (promptError) {
            logger.logError(500, promptError.message)
            return errorResponse('DATABASE_ERROR', 500, promptError.message)
          }

          // Build maps for quick lookup
          const characterMap = new Map((characters || []).map((c: any) => [c.id, c]))
          const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
          const promptMap = new Map((prompts || []).map((p: any) => [p.character_id, p.prompt]))
          const skillMap = new Map((prompts || []).map((p: any) => [p.character_id, p.skill]))

          // Combine data
          const combined = Array.from(characterScoreMap.values()).map((score) => {
            const character = characterMap.get(score.character_id)
            const profile = profileMap.get(score.user_id)
            const latestPrompt = promptMap.get(score.character_id)
            const latestSkill = skillMap.get(score.character_id)

            return {
              character_id: score.character_id,
              total_score: score.total_score,
              character_name: character?.name || 'Unknown',
              display_name: profile?.display_name || 'Unknown',
              avatar_url: profile?.avatar_url || null,
              current_prompt: latestPrompt || character?.current_prompt || null,
              current_skill: latestSkill || null,
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
            current_skill: entry.current_skill,
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

      // Get all unique user_ids and character_ids
      const userIds = Array.from(new Set(characters.map((c: any) => c.user_id)))
      const characterIds = characters.map((c: any) => c.id)

      // Fetch profiles separately
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds)

      if (profileError) {
        logger.logError(500, profileError.message)
        return errorResponse('DATABASE_ERROR', 500, profileError.message)
      }

      // Fetch latest prompts and skills from prompt_history
      const { data: latestPrompts } = await supabase
        .from('prompt_history')
        .select('character_id, prompt, skill, round_number')
        .in('character_id', characterIds)
        .eq('is_deleted', false)
        .order('round_number', { ascending: false })

      // Build maps
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

      // Get the latest prompt and skill for each character
      const promptMap = new Map<string, string>()
      const skillMap = new Map<string, string>()
      if (latestPrompts) {
        for (const p of latestPrompts) {
          if (!promptMap.has(p.character_id)) {
            promptMap.set(p.character_id, p.prompt)
          }
          if (!skillMap.has(p.character_id)) {
            skillMap.set(p.character_id, p.skill)
          }
        }
      }

      // Combine data
      const combined = characters.map((char: any) => {
        const profile = profileMap.get(char.user_id)
        const latestPrompt = promptMap.get(char.id)
        const latestSkill = skillMap.get(char.id)

        return {
          character_id: char.id,
          character_name: char.name || 'Unknown',
          display_name: profile?.display_name || 'Unknown',
          avatar_url: profile?.avatar_url || null,
          total_score: 0,
          current_prompt: latestPrompt || char.current_prompt || null,
          current_skill: latestSkill || null,
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
        current_skill: entry.current_skill,
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
