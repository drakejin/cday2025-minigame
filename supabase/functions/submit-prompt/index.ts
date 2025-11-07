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

      const { character_id, prompt } = await req.json()
      logger.setRequestBody({ character_id, prompt })

      if (!character_id) {
        logger.logError(400, '캐릭터 ID가 필요합니다')
        return errorResponse('CHARACTER_ID_REQUIRED', 400, '캐릭터 ID가 필요합니다')
      }

      if (!prompt || typeof prompt !== 'string') {
        logger.logError(400, '프롬프트를 입력해주세요')
        return errorResponse('INVALID_PROMPT', 400, '프롬프트를 입력해주세요')
      }

      if (prompt.trim().length === 0 || prompt.length > 30) {
        logger.logError(400, '프롬프트는 1-30자 사이여야 합니다')
        return errorResponse('INVALID_PROMPT_LENGTH', 400, '프롬프트는 1-30자 사이여야 합니다')
      }

      // Parallel: Verify character ownership and get active round
      const [characterResult, roundResult] = await Promise.all([
        supabase
          .from('characters')
          .select('id, is_active')
          .eq('id', character_id)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('game_rounds').select('*').eq('is_active', true).maybeSingle(),
      ])

      const { data: character, error: charError } = characterResult
      if (charError || !character) {
        logger.logError(404, '캐릭터를 찾을 수 없습니다')
        return errorResponse('CHARACTER_NOT_FOUND', 404, '캐릭터를 찾을 수 없습니다')
      }

      if (!character.is_active) {
        logger.logError(403, '비활성화된 캐릭터입니다')
        return errorResponse('CHARACTER_INACTIVE', 403, '비활성화된 캐릭터입니다')
      }

      const { data: round, error: roundError } = roundResult
      if (roundError || !round) {
        logger.logError(400, '현재 진행 중인 시련가 없습니다')
        return errorResponse('ROUND_NOT_ACTIVE', 400, '현재 진행 중인 시련가 없습니다')
      }

      // Parallel: Check existing submission and get character plan
      const [existingResult, planResult] = await Promise.all([
        supabase
          .from('prompt_history')
          .select('id')
          .eq('character_id', character_id)
          .eq('round_number', round.round_number)
          .maybeSingle(),
        supabase.from('character_plans').select('*').eq('character_id', character_id).maybeSingle(),
      ])

      const { data: existing } = existingResult
      if (existing) {
        logger.logError(400, '이미 이번 시련에 제출했습니다')
        return errorResponse('ALREADY_SUBMITTED', 400, '이미 이번 시련에 제출했습니다')
      }

      const { data: plan, error: planError } = planResult
      if (planError) {
        logger.logError(500, '캐릭터 플랜 조회 실패')
        return errorResponse('PLAN_QUERY_ERROR', 500, '캐릭터 플랜 조회 실패')
      }

      if (!plan) {
        logger.logError(400, '캐릭터 플랜이 설정되지 않았습니다. 먼저 스탯 분배를 완료해주세요.')
        return errorResponse(
          'PLAN_NOT_FOUND',
          400,
          '캐릭터 플랜이 설정되지 않았습니다. 먼저 스탯 분배를 완료해주세요.'
        )
      }

      // Use round_number directly as level (1, 2, or 3)
      const level = round.round_number
      const levelPrefix = `lv${level}`

      const str = plan[`${levelPrefix}_str`]
      const dex = plan[`${levelPrefix}_dex`]
      const con = plan[`${levelPrefix}_con`]
      const int = plan[`${levelPrefix}_int`]
      const skill = plan[`${levelPrefix}_skill`]

      // Validate that stats are set for this level
      if ([str, dex, con, int].some((stat) => stat == null)) {
        logger.logError(
          400,
          `레벨 ${level} 스탯이 설정되지 않았습니다. 먼저 스탯 분배를 완료해주세요.`
        )
        return errorResponse(
          'LEVEL_STATS_NOT_SET',
          400,
          `레벨 ${level} 스탯이 설정되지 않았습니다. 먼저 스탯 분배를 완료해주세요.`
        )
      }

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
