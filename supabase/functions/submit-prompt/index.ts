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

      const { character_id, prompt, trial_data } = await req.json()
      logger.setRequestBody({ character_id, prompt, trial_data })

      if (!character_id) {
        logger.logError(400, '캐릭터 ID가 필요합니다')
        return errorResponse('CHARACTER_ID_REQUIRED', 400, '캐릭터 ID가 필요합니다')
      }

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        logger.logError(400, '프롬프트를 입력해주세요')
        return errorResponse('INVALID_PROMPT', 400, '프롬프트를 입력해주세요')
      }

      if (prompt.length > 30) {
        logger.logError(400, '프롬프트는 최대 30자까지 입력 가능합니다')
        return errorResponse('PROMPT_TOO_LONG', 400, '프롬프트는 최대 30자까지 입력 가능합니다')
      }

      if (!trial_data || typeof trial_data !== 'object') {
        logger.logError(400, '능력치 데이터를 입력해주세요')
        return errorResponse('INVALID_TRIAL_DATA', 400, '능력치 데이터를 입력해주세요')
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

      // Check existing submission
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

      // Use trial_no from round (1, 2, or 3)
      const level = round.trial_no || 1
      const currentTrial = trial_data[level]

      if (!currentTrial) {
        logger.logError(400, `Trial ${level} 데이터가 없습니다`)
        return errorResponse('TRIAL_DATA_MISSING', 400, `Trial ${level} 데이터가 없습니다`)
      }

      // Calculate final stats
      let str = 0,
        dex = 0,
        con = 0,
        int = 0

      // Add base stats from trial 1
      if (trial_data[1]?.baseStats) {
        str += trial_data[1].baseStats.str || 0
        dex += trial_data[1].baseStats.dex || 0
        con += trial_data[1].baseStats.con || 0
        int += trial_data[1].baseStats.int || 0
      }

      // Add bonus stats from trial 2 and 3
      for (let i = 2; i <= level; i++) {
        if (trial_data[i]?.bonusStats) {
          const [stat1, stat2] = trial_data[i].bonusStats
          if (stat1) str += stat1 === 'str' ? 1 : 0
          if (stat1) dex += stat1 === 'dex' ? 1 : 0
          if (stat1) con += stat1 === 'con' ? 1 : 0
          if (stat1) int += stat1 === 'int' ? 1 : 0
          if (stat2) str += stat2 === 'str' ? 1 : 0
          if (stat2) dex += stat2 === 'dex' ? 1 : 0
          if (stat2) con += stat2 === 'con' ? 1 : 0
          if (stat2) int += stat2 === 'int' ? 1 : 0
        }
      }

      const skill = currentTrial.skill || ''

      // Save to character_plans
      const planData: any = {}
      for (let i = 1; i <= level; i++) {
        const trial = trial_data[i]
        if (i === 1 && trial?.baseStats) {
          planData.lv1_str = trial.baseStats.str
          planData.lv1_dex = trial.baseStats.dex
          planData.lv1_con = trial.baseStats.con
          planData.lv1_int = trial.baseStats.int
          planData.lv1_skill = trial.skill
        } else if (i >= 2 && trial?.bonusStats) {
          const [stat1, stat2] = trial.bonusStats
          planData[`lv${i}_str`] = stat1 === 'str' || stat2 === 'str' ? 1 : 0
          planData[`lv${i}_dex`] = stat1 === 'dex' || stat2 === 'dex' ? 1 : 0
          planData[`lv${i}_con`] = stat1 === 'con' || stat2 === 'con' ? 1 : 0
          planData[`lv${i}_int`] = stat1 === 'int' || stat2 === 'int' ? 1 : 0
          planData[`lv${i}_skill`] = trial.skill
        }
      }

      // Validate that stats are set for this level
      if ([str, dex, con, int].some((stat) => stat == null || stat === 0)) {
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

      // Update character_plans and current_prompt
      await Promise.all([
        supabase.from('character_plans').upsert({
          character_id,
          ...planData,
        }),
        supabase
          .from('characters')
          .update({ current_prompt: prompt.trim() })
          .eq('id', character_id),
      ])

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
