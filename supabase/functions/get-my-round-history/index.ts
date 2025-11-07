import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyUser } from '../_shared/auth.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('get-my-round-history', async (req, logger) => {
    try {
      const { error: authError, status, user, supabase } = await verifyUser(req)
      logger.setUser(user?.id, user?.email)

      if (authError || !supabase) {
        logger.logError(status, authError || 'UNAUTHORIZED')
        return errorResponse(authError || 'UNAUTHORIZED', status)
      }

      // Parse from body (POST request)
      const body = await req.json()
      const limit = body?.limit || 20
      const offset = body?.offset || 0
      logger.setRequestBody({ limit, offset })

      const { data: character } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!character) {
        logger.logError(404, '활성 캐릭터가 없습니다')
        return errorResponse('CHARACTER_NOT_FOUND', 404, '활성 캐릭터가 없습니다')
      }

      // 라운드 조회와 프롬프트 히스토리 조회를 병렬로 실행
      const [
        { data: rounds, error: roundsError, count },
        { data: prompts, error: promptsError },
      ] = await Promise.all([
        supabase
          .from('game_rounds')
          .select('id, round_number, status, start_time, end_time', { count: 'exact' })
          .order('round_number', { ascending: false })
          .range(offset, offset + limit - 1),
        supabase
          .from('prompt_history')
          .select('*')
          .eq('character_id', character.id)
          .eq('is_deleted', false),
      ])

      if (roundsError) {
        logger.logError(500, roundsError.message)
        return errorResponse('DATABASE_ERROR', 500, roundsError.message)
      }

      if (!rounds || rounds.length === 0) {
        const responseData = {
          data: [],
          pagination: {
            total: 0,
            limit,
            offset,
          },
        }
        logger.logSuccess(200, responseData)
        return successResponse(responseData)
      }

      if (promptsError) {
        logger.logError(500, promptsError.message)
        return errorResponse('DATABASE_ERROR', 500, promptsError.message)
      }

      // Create a map of round_number -> prompt data
      const promptMap = new Map()
      if (prompts) {
        for (const prompt of prompts) {
          promptMap.set(prompt.round_number, prompt)
        }
      }

      // Merge rounds with prompts (LEFT JOIN effect)
      const transformedHistory = rounds.map(
        (round: {
          id: string
          round_number: number
          status: string
          start_time: string
          end_time: string
        }) => {
          const prompt = promptMap.get(round.round_number)

          return {
            round_id: round.id,
            round_number: round.round_number,
            round_status: round.status,
            round_start_time: round.start_time,
            round_end_time: round.end_time,
            // Prompt data (will be null if not participated)
            prompt_id: prompt?.id || null,
            prompt: prompt?.prompt || null,
            strength_gained: prompt?.strength_gained || 0,
            charm_gained: prompt?.charm_gained || 0,
            creativity_gained: prompt?.creativity_gained || 0,
            total_score_gained: prompt?.total_score_gained || 0,
            created_at: prompt?.created_at || null,
            participated: !!prompt,
          }
        }
      )

      const responseData = {
        data: transformedHistory,
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
