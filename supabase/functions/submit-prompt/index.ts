import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { withLogging } from '../_shared/withLogging.ts'

serve(
  withLogging('submit-prompt', async (req, logger) => {
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

      const { character_id, prompt } = await req.json()
      logger.setRequestBody({ character_id, prompt })

      if (!prompt || typeof prompt !== 'string') {
        logger.logError(400, '프롬프트를 입력해주세요')
        return errorResponse('INVALID_PROMPT', 400, '프롬프트를 입력해주세요')
      }

      if (prompt.trim().length === 0 || prompt.length > 30) {
        logger.logError(400, '프롬프트는 1-30자 사이여야 합니다')
        return errorResponse('INVALID_PROMPT_LENGTH', 400, '프롬프트는 1-30자 사이여야 합니다')
      }

      const { data: round, error: roundError } = await supabase
        .from('game_rounds')
        .select('*')
        .eq('is_active', true)
        .maybeSingle()

      if (roundError || !round) {
        logger.logError(400, '현재 진행 중인 라운드가 없습니다')
        return errorResponse('ROUND_NOT_ACTIVE', 400, '현재 진행 중인 라운드가 없습니다')
      }

      const { data: existing } = await supabase
        .from('prompt_history')
        .select('id')
        .eq('character_id', character_id)
        .eq('round_number', round.round_number)
        .maybeSingle()

      if (existing) {
        logger.logError(400, '이미 이번 라운드에 제출했습니다')
        return errorResponse('ALREADY_SUBMITTED', 400, '이미 이번 라운드에 제출했습니다')
      }

      // FIXME: 스코어 계산 로직 추가
      const scores = {
        strength: Math.floor(Math.random() * 30) + 5,
        charm: Math.floor(Math.random() * 30) + 5,
        creativity: Math.floor(Math.random() * 30) + 5,
      }
      scores.total = scores.strength + scores.charm + scores.creativity

      const { data: promptHistory, error: historyError } = await supabase
        .from('prompt_history')
        .insert({
          character_id,
          user_id: user.id,
          prompt: prompt.trim(),
          round_number: round.round_number,
          strength_gained: scores.strength,
          charm_gained: scores.charm,
          creativity_gained: scores.creativity,
          total_score_gained: scores.total,
        })
        .select()
        .single()

      if (historyError) {
        logger.logError(500, '제출에 실패했습니다')
        return errorResponse('SUBMISSION_FAILED', 500, '제출에 실패했습니다')
      }

      const { data: character } = await supabase
        .from('characters')
        .select('*')
        .eq('id', character_id)
        .single()

      if (!character) {
        logger.logError(404, 'CHARACTER_NOT_FOUND')
        return errorResponse('CHARACTER_NOT_FOUND', 404)
      }

      const { data: updatedCharacter, error: updateError } = await supabase
        .from('characters')
        .update({
          current_prompt: prompt.trim(),
          strength: character.strength + scores.strength,
          charm: character.charm + scores.charm,
          creativity: character.creativity + scores.creativity,
          total_score: character.total_score + scores.total,
        })
        .eq('id', character_id)
        .select()
        .single()

      if (updateError) {
        logger.logError(500, '캐릭터 업데이트에 실패했습니다')
        return errorResponse('UPDATE_FAILED', 500, '캐릭터 업데이트에 실패했습니다')
      }

      const responseData = {
        prompt_history_id: promptHistory.id,
        round_number: round.round_number,
        scores: {
          strength: scores.strength,
          charm: scores.charm,
          creativity: scores.creativity,
          total: scores.total,
        },
        character: {
          total_score: updatedCharacter.total_score,
          strength: updatedCharacter.strength,
          charm: updatedCharacter.charm,
          creativity: updatedCharacter.creativity,
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
