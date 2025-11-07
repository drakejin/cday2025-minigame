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
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing required environment variables')
      }

      const supabase = createClient(supabaseUrl, supabaseKey)

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

      // 내 캐릭터 검증과 모든 캐릭터 조회를 병렬로 실행
      const [
        { data: myCharacter, error: charError },
        { data: characters, error: charactersError },
      ] = await Promise.all([
        supabase
          .from('characters')
          .select('id')
          .eq('id', character_id)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single(),
        supabase.from('characters').select('id').eq('is_active', true),
      ])

      if (charError || !myCharacter) {
        logger.logError(404, 'CHARACTER_NOT_FOUND')
        return errorResponse('CHARACTER_NOT_FOUND', 404)
      }

      if (charactersError) {
        throw charactersError
      }

      if (!characters || characters.length === 0) {
        logger.logSuccess(200, {
          rank: 1,
          total_participants: 1,
          percentile: 100,
          character: { weighted_total: 0 },
        })
        return successResponse({
          rank: 1,
          total_participants: 1,
          percentile: 100,
          character: { weighted_total: 0 },
        })
      }

      // Get all prompt history for active characters (not deleted)
      const characterIds = characters.map((c: { id: string }) => c.id)
      const { data: prompts, error: promptsError } = await supabase
        .from('prompt_history')
        .select('character_id, str, dex, con, int')
        .in('character_id', characterIds)
        .eq('is_deleted', false)

      if (promptsError) {
        throw promptsError
      }

      // Calculate total score for each character
      const scoreMap = new Map<string, number>()

      for (const prompt of prompts || []) {
        const currentScore = scoreMap.get(prompt.character_id) || 0
        const promptScore =
          (prompt.str || 0) + (prompt.dex || 0) + (prompt.con || 0) + (prompt.int || 0)
        scoreMap.set(prompt.character_id, currentScore + promptScore)
      }

      // Convert to sorted array
      const allScores = Array.from(scoreMap.entries())
        .map(([character_id, total_score]) => ({ character_id, total_score }))
        .sort((a, b) => b.total_score - a.total_score)

      // Find my character's score
      const myWeighted = scoreMap.get(character_id) || 0

      // Count characters with higher scores
      const higherCount = allScores.filter((s) => s.total_score > myWeighted).length
      const totalParticipants = characters.length
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
