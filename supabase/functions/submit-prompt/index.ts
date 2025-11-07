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

      const { character_id, prompt, trial_id } = await req.json()
      logger.setRequestBody({ character_id, prompt, trial_id })

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

      // Trial resolve: if trial_id provided, validate it belongs to current round; else try to fetch by round
      let resolvedTrial: any = null
      if (trial_id) {
        const { data: t } = await supabase
          .from('trials')
          .select('*')
          .eq('id', trial_id)
          .maybeSingle()
        if (!t || t.round_id !== round.id) {
          logger.logError(400, '잘못된 시련 선택입니다')
          return errorResponse('INVALID_TRIAL', 400, '잘못된 시련 선택입니다')
        }
        resolvedTrial = t
      } else {
        const { data: trials } = await supabase
          .from('trials')
          .select('*')
          .eq('round_id', round.id)
          .order('trial_no')
        resolvedTrial = trials?.[0] || null
      }
      if (!resolvedTrial) {
        logger.logError(400, '현재 시련에 시련이 설정되지 않았습니다')
        return errorResponse('TRIAL_NOT_CONFIGURED', 400, '현재 시련에 시련이 설정되지 않았습니다')
      }

      // TODO: Replace with actual evaluation per GameRule (stats+skill). Temporary random with 4 stats.
      const score_strength = Math.floor(Math.random() * 30) + 5
      const score_dexterity = Math.floor(Math.random() * 30) + 5
      const score_constitution = Math.floor(Math.random() * 30) + 5
      const score_intelligence = Math.floor(Math.random() * 30) + 5
      const total = score_strength + score_dexterity + score_constitution + score_intelligence
      const weighted_total = total * (resolvedTrial.weight_multiplier ?? 1)

      const { data: promptHistory, error: historyError } = await supabase
        .from('prompt_history')
        .insert({
          character_id,
          user_id: user.id,
          prompt: prompt.trim(),
          round_number: round.round_number,
          strength_gained: 0,
          charm_gained: 0,
          creativity_gained: 0,
          total_score_gained: total,
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

      // Insert trial_results (unique per trial_id + character)
      const { data: trialResult, error: trErr } = await supabase
        .from('trial_results')
        .upsert(
          {
            trial_id: resolvedTrial.id,
            character_id,
            user_id: user.id,
            prompt_history_id: promptHistory.id,
            score_strength,
            score_dexterity,
            score_constitution,
            score_intelligence,
            total_score: total,
            weighted_total,
            needs_revalidation: false,
          },
          { onConflict: 'trial_id,character_id' }
        )
        .select('*')
        .single()
      if (trErr) {
        logger.logError(500, '시련 결과 저장 실패')
        return errorResponse('TRIAL_RESULT_FAILED', 500, trErr.message)
      }

      const responseData = {
        prompt_history_id: promptHistory.id,
        round_number: round.round_number,
        trial_id: resolvedTrial.id,
        scores: {
          strength: score_strength,
          dexterity: score_dexterity,
          constitution: score_constitution,
          intelligence: score_intelligence,
          total,
          weighted_total,
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
