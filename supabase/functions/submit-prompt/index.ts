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
        logger.logError(400, '현재 진행 중인 시련가 없습니다')
        return errorResponse('ROUND_NOT_ACTIVE', 400, '현재 진행 중인 시련가 없습니다')
      }

      const { data: existing } = await supabase
        .from('prompt_history')
        .select('id')
        .eq('character_id', character_id)
        .eq('round_number', round.round_number)
        .maybeSingle()

      if (existing) {
        logger.logError(400, '이미 이번 시련에 제출했습니다')
        return errorResponse('ALREADY_SUBMITTED', 400, '이미 이번 시련에 제출했습니다')
      }

      // Get character plan
      const { data: plan } = await supabase
        .from('character_plans')
        .select('*')
        .eq('character_id', character_id)
        .maybeSingle()

      if (!plan) {
        logger.logError(400, '캐릭터 플랜이 설정되지 않았습니다')
        return errorResponse('PLAN_NOT_FOUND', 400, '캐릭터 플랜이 설정되지 않았습니다')
      }

      // Use round_number directly as level (1, 2, or 3)
      const level = round.round_number
      const levelPrefix = `lv${level}`

      const str = plan[`${levelPrefix}_str`]
      const dex = plan[`${levelPrefix}_dex`]
      const con = plan[`${levelPrefix}_con`]
      const int = plan[`${levelPrefix}_int`]
      const skill = plan[`${levelPrefix}_skill`]

      const { data: promptHistory, error: historyError } = await supabase
        .from('prompt_history')
        .insert({
          character_id,
          user_id: user.id,
          prompt: prompt.trim(),
          round_number: round.round_number,
          str,
          dex,
          con,
          int,
          skill,
        })
        .select()
        .single()

      if (historyError) {
        logger.logError(500, '제출에 실패했습니다')
        return errorResponse('SUBMISSION_FAILED', 500, '제출에 실패했습니다')
      }

      const responseData = {
        prompt_history_id: promptHistory.id,
        round_number: round.round_number,
        level,
        stats: {
          str,
          dex,
          con,
          int,
          skill,
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
