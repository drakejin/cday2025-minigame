// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withLogging } from '../_shared/withLogging.ts'
import { errorResponse, successResponse } from '../_shared/response.ts'
import { verifyAdmin } from '../_shared/adminAuth.ts'
import { createSupabaseClient } from '../_shared/db.ts'

// Admin utility: evaluate one trial for a character (recompute scores)
serve(
  withLogging('evaluate-trial', async (req, logger) => {
    try {
      const { error, status, admin } = await verifyAdmin(req)
      logger.setUser(admin?.id, admin?.email)
      if (error || !admin) {
        return errorResponse(error || 'UNAUTHORIZED', status || 401)
      }

      const { character_id, trial_id } = await req.json()
      logger.setRequestBody({ character_id, trial_id })
      if (!character_id || !trial_id) {
        return errorResponse('INVALID_REQUEST', 400, 'character_id, trial_id는 필수입니다')
      }

      const supabase = createSupabaseClient()
      const { data: trial } = await supabase
        .from('trials')
        .select('*')
        .eq('id', trial_id)
        .maybeSingle()
      if (!trial) return errorResponse('TRIAL_NOT_FOUND', 404, '시련을 찾을 수 없습니다')

      // Temporary evaluation (randomized). Replace with actual GameRule logic.
      const score_strength = Math.floor(Math.random() * 30) + 5
      const score_dexterity = Math.floor(Math.random() * 30) + 5
      const score_constitution = Math.floor(Math.random() * 30) + 5
      const score_intelligence = Math.floor(Math.random() * 30) + 5
      const total = score_strength + score_dexterity + score_constitution + score_intelligence
      const weighted_total = total * (trial.weight_multiplier ?? 1)

      // Find latest prompt_history for this character in the round of this trial
      const { data: round } = await supabase
        .from('game_rounds')
        .select('round_number')
        .eq('id', trial.round_id)
        .maybeSingle()

      const { data: ph } = await supabase
        .from('prompt_history')
        .select('id, user_id')
        .eq('character_id', character_id)
        .eq('round_number', round?.round_number || -1)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!ph) {
        return errorResponse('PROMPT_NOT_FOUND', 404, '해당 시련에 대응하는 프롬프트가 없습니다')
      }

      const { data: result, error: upErr } = await supabase
        .from('trial_results')
        .upsert(
          {
            trial_id,
            character_id,
            user_id: ph.user_id,
            prompt_history_id: ph.id,
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

      if (upErr || !result) {
        return errorResponse('EVALUATE_FAILED', 500, upErr?.message || '평가 실패')
      }

      logger.logSuccess(200, { result })
      return successResponse({ result })
    } catch (e) {
      return errorResponse('INTERNAL_ERROR', 500, (e as Error).message)
    }
  })
)
